/*
 * ESP32-C3 Smart Box Controller
 * Hardware: HC-SR04 (GPIO4/5), SG90 Servo (GPIO6), Beeper (GPIO7)
 * 
 * WICHTIGE FUNKTIONALITÄT - OFFLINE VERFÜGBAR:
 * ============================================
 * Die Basis-Funktion zum Öffnen der Box funktioniert KOMPLETT OFFLINE!
 * Der Ultraschallsensor und Servo arbeiten ohne WiFi-Verbindung.
 * 
 * HAND-ERKENNUNGS-LOGIK:
 * ======================
 * 1. Hand kommt näher als 4 cm → Box toggelt (offen → zu, zu → offen)
 * 2. Nach dem Toggeln gibt es eine Abklingzeit (Cooldown) von 1,5 Sekunden,
 *    damit nicht sofort wieder umgeschaltet wird.
 * 3. Die Hand muss erst wieder entfernt werden, bevor ein neues Toggle möglich ist.
 */

 #include <WiFi.h>
 #include <HTTPClient.h>
 #include <ArduinoJson.h>
 #include <ESP32Servo.h>
 #include <time.h>
 
 // Credentials
 const char* ssid = "Beefort-Keller";
 const char* password = "tmF-14ct";
 const char* SUPABASE_URL = "https://wgilkcbrluhgxzbxmigu.supabase.co";
 const char* SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnaWxrY2JybHVoZ3h6YnhtaWd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjkxMjUsImV4cCI6MjA4Mzk0NTEyNX0.1lWzC8oElXGRETjURxgb080ZY2QxCTFlK5i7sz0mWoc";
 
 // Config
 const char* ntpServer = "pool.ntp.org";
 const long gmtOffset_sec = 3600;
 const int daylightOffset_sec = 3600;
 const int TRIG_PIN = 6, ECHO_PIN = 20, SERVO_PIN = 4, BEEPER_PIN = 7;
 const int SERVO_CLOSED = 20, SERVO_OPEN = 170; // Erhöhter Drehwinkel für mehr Bewegung
 const int SENSOR_THRESHOLD = 4; // Hand-Erkennung bis 4 cm (Öffnung/Schließung)
const unsigned long SENSOR_CHECK_INTERVAL = 50; // Sehr häufige Checks für bessere Erkennung
const unsigned long TOGGLE_COOLDOWN = 1500; // 1,5 Sekunden Abklingzeit nach Toggle
const int SENSOR_SAMPLES = 3; // Anzahl Messungen für Durchschnitt
const int SENSOR_HISTORY_SIZE = 3; // Reduziert für schnellere Reaktion
const int SENSOR_STABLE_COUNT = 2; // Reduziert für schnellere Erkennung
 const unsigned long WIFI_CHECK_INTERVAL = 30000, WIFI_TIMEOUT = 30000;
 const unsigned long HEARTBEAT_INTERVAL = 45000; // 45 Sekunden statt 10 (reduziert API-Aufrufe)
 const unsigned long COMMAND_CHECK_INTERVAL = 5000; // 5 Sekunden statt 2 (reduziert API-Aufrufe)
 
 // State
 Servo boxServo;
 bool boxIsOpen = false, beeperActive = false;
 unsigned long lastSensorCheck = 0, lastCommandCheck = 0, lastScheduleCheck = 0;
 unsigned long beeperEndTime = 0, lastWiFiCheck = 0, lastHeartbeat = 0;
bool handCurrentlyDetected = false; // Ist die Hand gerade erkannt?
unsigned long lastToggleTime = 0; // Zeitstempel des letzten Toggles (für Cooldown)
int sensorHandDetectedCount = 0; // Zähler für bestätigte Hand-Erkennungen
unsigned long lastStateUpdate = 0; // Zeitstempel des letzten State-Updates (für Heartbeat-Optimierung)
 // Schedule Beeper State
 bool scheduleBeeperActive = false; // Flag ob Schedule-Beeper aktiv ist
 unsigned long scheduleBeeperEndTime = 0; // Zeitstempel wann Schedule-Beeper enden soll
 unsigned long scheduleBeeperLastToggle = 0; // Zeitstempel für letztes Ein/Aus-Schalten
 bool scheduleBeeperState = false; // Aktueller Zustand (an/aus) für Pipsen
 const unsigned long SCHEDULE_BEEPER_DURATION = 60000; // 1 Minute = 60000ms
 const unsigned long SCHEDULE_BEEPER_TOGGLE_INTERVAL = 500; // Alle 500ms ein/aus für Pipsen
 // (sensorHistory entfernt - direkte Messwerte sind zuverlässiger)
 bool initialStateSent = false; // Flag für ersten State-Update
 bool ntpConfigured = false; // Flag für NTP-Konfiguration
 bool tcpipReady = false; // Flag für TCP/IP-Stack Bereitschaft
 String boxStateId = ""; // UUID des box_state Eintrags
 // Pipsen-Schalter (gesteuert per Webseite)
 bool beeperSwitchOn = false;
 
 void beep(int freq, int durationMs) {
   tone(BEEPER_PIN, freq);
   delay(durationMs);
   noTone(BEEPER_PIN);
 }
 
 // Pipsen ein/aus – wird von Web-Befehl „beeper_switch“ gesteuert
 void setBeeperSwitch(bool on) {
   beeperSwitchOn = on;
 
  if (beeperSwitchOn) {
    beeperActive = false;
    scheduleBeeperActive = false;
    tone(BEEPER_PIN, 1000);
  } else {
    noTone(BEEPER_PIN);
  }
 }
 
 void moveServoFast(int toAngle) {
   int currentAngle = boxIsOpen ? SERVO_OPEN : SERVO_CLOSED;
   int step = 6, delayMs = 3;
   if (currentAngle < toAngle) {
     for (int pos = currentAngle; pos <= toAngle; pos += step) {
       boxServo.write(pos);
       delay(delayMs);
     }
   } else {
     for (int pos = currentAngle; pos >= toAngle; pos -= step) {
       boxServo.write(pos);
       delay(delayMs);
     }
   }
   boxServo.write(toAngle);
 }
 
 int httpRequest(String url, String method = "GET", String payload = "") {
   // Prüfe TCP/IP-Stack Bereitschaft
   if (!tcpipReady || WiFi.status() != WL_CONNECTED) {
     return -1;
   }
   
   HTTPClient http;
   http.setTimeout(10000);
   http.setReuse(false);
   
  if (!http.begin(url)) {
    return -1;
  }
   
   http.addHeader("apikey", SUPABASE_KEY);
   http.addHeader("Authorization", "Bearer " + String(SUPABASE_KEY));
   http.addHeader("Content-Type", "application/json");
   if (method == "PATCH" || method == "POST") http.addHeader("Prefer", "return=minimal");
   
   int code = -1;
   if (method == "GET") {
     code = http.GET();
   } else if (method == "POST") {
     code = http.POST(payload);
   } else if (method == "PATCH") {
     code = http.PATCH(payload);
   }
   
  if (code == 401) {
    Serial.println("HTTP 401 Supabase");
  }
   
   http.end();
   return code;
 }
 
 void setup() {
   Serial.begin(115200);
   delay(100);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(BEEPER_PIN, OUTPUT);
  digitalWrite(BEEPER_PIN, LOW);
  
  boxServo.setPeriodHertz(50);
  boxServo.attach(SERVO_PIN, 500, 2400);
  boxServo.write(SERVO_CLOSED);
  
  beep(2000, 150);
  delay(200);
  beep(2000, 150);
  
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
  
  delay(2000);
  tcpipReady = true;
  
  Serial.println("OK WiFi " + WiFi.localIP().toString());
  Serial.println("READY");
  Serial.flush();
 }
 
 void loop() {
   unsigned long now = millis();
   
   // NTP-Konfiguration - erst nach 5 Sekunden UND wenn TCP/IP-Stack bereit ist
  if (!ntpConfigured && tcpipReady && now > 5000 && WiFi.status() == WL_CONNECTED) {
    configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
    delay(2000);
    ntpConfigured = true;
  }
   
   // WiFi reconnect
   if (now - lastWiFiCheck >= WIFI_CHECK_INTERVAL) {
    if (WiFi.status() != WL_CONNECTED) {
      tcpipReady = false;
      WiFi.begin(ssid, password);
      unsigned long start = millis();
      while (WiFi.status() != WL_CONNECTED && (millis() - start < 10000)) {
        delay(500);
      }
      if (WiFi.status() == WL_CONNECTED) {
        delay(2000);
        tcpipReady = true;
        ntpConfigured = false;
      }
    }
     lastWiFiCheck = now;
   }
   
  // Heartbeat - erst nach 10 Sekunden im loop() starten (nach NTP)
  if (now > 10000 && tcpipReady && ntpConfigured && now - lastHeartbeat >= HEARTBEAT_INTERVAL) {
    if (WiFi.status() == WL_CONNECTED) {
      // Erster State-Update nach Setup
      if (!initialStateSent) {
        updateBoxState(boxIsOpen);
        initialStateSent = true;
      } else if (now - lastStateUpdate >= HEARTBEAT_INTERVAL) {
        updateBoxState(boxIsOpen);
      }
    }
    lastHeartbeat = now;
  }
   
  // Commands - erst nach 10 Sekunden im loop() starten (nach NTP)
  if (now > 10000 && tcpipReady && ntpConfigured && now - lastCommandCheck >= COMMAND_CHECK_INTERVAL) {
     checkCommands();
     lastCommandCheck = now;
   }
   
   // Schedules - erst nach 10 Sekunden im loop() starten (nach NTP)
   if (now > 10000 && tcpipReady && ntpConfigured && now - lastScheduleCheck >= 60000) {
     checkSchedules();
     lastScheduleCheck = now;
   }
   
   // Sensor
   if (now - lastSensorCheck >= SENSOR_CHECK_INTERVAL) {
     checkUltrasonicSensor();
     lastSensorCheck = now;
   }
   
  // (Toggle-Logik ist jetzt direkt in checkUltrasonicSensor())
   
   // Schedule-Beeper (pipsen für 1 Minute)
   if (scheduleBeeperActive) {
     if (now >= scheduleBeeperEndTime) {
       stopScheduleBeeper();
     } else {
       if (now - scheduleBeeperLastToggle >= SCHEDULE_BEEPER_TOGGLE_INTERVAL && !beeperSwitchOn) {
         scheduleBeeperState = !scheduleBeeperState;
         if (scheduleBeeperState) {
           tone(BEEPER_PIN, 1000);
         } else {
           noTone(BEEPER_PIN);
         }
         scheduleBeeperLastToggle = now;
       }
     }
   }
   
   // Beeper
   if (beeperActive && now >= beeperEndTime) stopBeeper();
   
   delay(10);
 }
 
 void checkCommands() {
   if (!tcpipReady || WiFi.status() != WL_CONNECTED) {
     return;
   }
   
   String url = String(SUPABASE_URL) + "/rest/v1/commands?executed=eq.false&order=timestamp.asc&limit=1";
   HTTPClient http;
   http.setTimeout(5000);
   http.setReuse(false);
   
  if (!http.begin(url)) {
    return;
  }
   
   http.addHeader("apikey", SUPABASE_KEY);
   http.addHeader("Authorization", "Bearer " + String(SUPABASE_KEY));
   http.addHeader("Content-Type", "application/json");
   
   int code = http.GET();
   if (code == 200) {
     String payload = http.getString();
     DynamicJsonDocument doc(1024);
     if (!deserializeJson(doc, payload)) {
       if (doc.is<JsonArray>() && doc.size() > 0) {
         JsonObject cmd = doc[0];
         String cmdId = cmd["id"].as<String>();
        String cmdType = cmd["command"].as<String>();
        JsonObject data = cmd["data"];
        
        if (cmdType == "open") openBox();
         else if (cmdType == "close") closeBox();
         else if (cmdType == "beeper") startBeeper(data.containsKey("duration") ? data["duration"] : 2);
         else if (cmdType == "beeper_switch") {
           bool enabled = data.containsKey("enabled") ? data["enabled"].as<bool>() : false;
           setBeeperSwitch(enabled);
         }
         else if (cmdType == "schedule_trigger") {
           startBeeper(data.containsKey("beeper_duration") ? data["beeper_duration"] : 5);
           openBox();
         }
         markCommandExecuted(cmdId);
       }
    }
  }
   http.end();
 }
 
 void checkSchedules() {
   if (!tcpipReady || WiFi.status() != WL_CONNECTED) return;
   
   time_t now = time(nullptr);
   if (now < 946684800) return;
   
  struct tm* timeinfo = localtime(&now);
  int currentDay = timeinfo->tm_wday == 0 ? 6 : timeinfo->tm_wday - 1;
  // Format: HH:MM:SS um mit Supabase "time without time zone" zu matchen
  char timeStr[9];
  sprintf(timeStr, "%02d:%02d:00", timeinfo->tm_hour, timeinfo->tm_min);
  
  String url = String(SUPABASE_URL) + "/rest/v1/schedules?active=eq.true&time=eq." + String(timeStr);
   HTTPClient http;
   http.setTimeout(10000);
   http.setReuse(false);
   
   if (!http.begin(url)) {
     return;
   }
   
   http.addHeader("apikey", SUPABASE_KEY);
   http.addHeader("Authorization", "Bearer " + String(SUPABASE_KEY));
   
  int code = http.GET();
  if (code == 200) {
    String payload = http.getString();
    DynamicJsonDocument doc(2048);
    if (!deserializeJson(doc, payload) && doc.is<JsonArray>()) {
      for (JsonObject schedule : doc.as<JsonArray>()) {
        bool dayMatch = false;
        
        // days kann ein echtes JSON-Array sein ODER ein String "[1,2,3]"
        if (schedule["days"].is<JsonArray>()) {
          // Echtes JSONB-Array
          JsonArray days = schedule["days"];
          for (JsonVariant day : days) {
            if (day.as<int>() == currentDay) {
              dayMatch = true;
              break;
            }
          }
        } else if (schedule["days"].is<const char*>()) {
          // String-Format: "[1,2,3,4]" - muss extra geparst werden
          String daysStr = schedule["days"].as<String>();
          DynamicJsonDocument daysDoc(256);
          if (!deserializeJson(daysDoc, daysStr) && daysDoc.is<JsonArray>()) {
            for (JsonVariant day : daysDoc.as<JsonArray>()) {
              if (day.as<int>() == currentDay) {
                dayMatch = true;
                break;
              }
            }
          }
        }
        
        if (dayMatch) {
          startScheduleBeeper();
        }
      }
    }
  }
  http.end();
 }
 
 int readUltrasonicDistance() {
   // Mehrfachmessung für bessere Genauigkeit
   int measurements[SENSOR_SAMPLES];
   int validSamples = 0;
   
   for (int i = 0; i < SENSOR_SAMPLES; i++) {
     digitalWrite(TRIG_PIN, LOW);
     delayMicroseconds(2);
     digitalWrite(TRIG_PIN, HIGH);
     delayMicroseconds(10);
     digitalWrite(TRIG_PIN, LOW);
     
     long duration = pulseIn(ECHO_PIN, HIGH, 30000); // Timeout 30ms (ca. 5m)
     
     if (duration > 0) {
       int distance = duration * 0.034 / 2;
       // Nur gültige Werte (2-200cm) akzeptieren
       if (distance >= 2 && distance <= 200) {
         measurements[validSamples] = distance;
         validSamples++;
       }
     }
     delayMicroseconds(50); // Kurze Pause zwischen Messungen
   }
   
   if (validSamples == 0) return -1; // Keine gültige Messung
   
   // Median berechnen für robustere Werte (weniger anfällig für Ausreißer)
   // Einfaches Sortieren für kleine Arrays
   for (int i = 0; i < validSamples - 1; i++) {
     for (int j = i + 1; j < validSamples; j++) {
       if (measurements[i] > measurements[j]) {
         int temp = measurements[i];
         measurements[i] = measurements[j];
         measurements[j] = temp;
       }
     }
   }
   
   // Median zurückgeben (mittlerer Wert)
   return measurements[validSamples / 2];
 }
 
void checkUltrasonicSensor() {
  // WICHTIG: Diese Funktion funktioniert komplett OFFLINE (ohne WiFi)
  // Einfache Toggle-Logik: Hand <= 4cm → Box öffnen/schließen
  
  unsigned long now = millis();
  int distance = readUltrasonicDistance();
  
  if (distance < 0) {
    // Keine gültige Messung → Hand ist weg
    handCurrentlyDetected = false;
    sensorHandDetectedCount = 0;
    return;
  }
  
  // Prüfe ob Hand erkannt wurde (Schwellwert <= 4 cm)
  bool handDetected = (distance <= SENSOR_THRESHOLD);
  
  if (handDetected) {
    sensorHandDetectedCount++;
    
    // Hand muss stabil erkannt werden (SENSOR_STABLE_COUNT aufeinanderfolgende Messungen)
    if (sensorHandDetectedCount >= SENSOR_STABLE_COUNT && !handCurrentlyDetected) {
      // Cooldown prüfen: nicht toggeln wenn letztes Toggle zu kurz her ist
      if (now - lastToggleTime >= TOGGLE_COOLDOWN) {
        handCurrentlyDetected = true;
        lastToggleTime = now;
        
        if (boxIsOpen) {
          closeBox();
        } else {
          openBox();
        }
        sensorHandDetectedCount = 0;
      }
    }
  } else {
    // Keine Hand erkannt → zurücksetzen
    handCurrentlyDetected = false;
    sensorHandDetectedCount = 0;
  }
}
 
 void openBox() {
   // WICHTIG: Diese Funktion funktioniert OFFLINE!
   // Servo und Beeper arbeiten ohne WiFi-Verbindung
   if (boxIsOpen) return;
   beep(2500, 60);
   moveServoFast(SERVO_OPEN);
  boxIsOpen = true;
   // Stoppe Schedule-Beeper sofort wenn Box geöffnet wird
   stopScheduleBeeper();
   // State-Update und Logging funktionieren nur mit WiFi, sind aber optional
  updateBoxState(true);
  logActivity("box_opened", "Box wurde geöffnet");
  Serial.println("OPEN");
 }
 
 void closeBox() {
   if (!boxIsOpen) return;
   beep(1800, 60);
   beep(1800, 60);
   moveServoFast(SERVO_CLOSED);
  boxIsOpen = false;
  updateBoxState(false);
  logActivity("box_closed", "Box wurde geschlossen");
  Serial.println("CLOSE");
 }
 
 void startBeeper(int durationSeconds) {
  if (beeperSwitchOn) return;
  beeperActive = true;
  beeperEndTime = millis() + (durationSeconds * 1000);
  tone(BEEPER_PIN, 1000);
 }
 
void stopBeeper() {
  beeperActive = false;
  if (!beeperSwitchOn) noTone(BEEPER_PIN);
 }
 
 void startScheduleBeeper() {
  if (beeperSwitchOn) return;
  scheduleBeeperActive = true;
  scheduleBeeperEndTime = millis() + SCHEDULE_BEEPER_DURATION;
  scheduleBeeperLastToggle = millis();
  scheduleBeeperState = true;
  tone(BEEPER_PIN, 1000);
 }
 
 void stopScheduleBeeper() {
  if (scheduleBeeperActive) {
    scheduleBeeperActive = false;
    scheduleBeeperState = false;
    if (!beeperSwitchOn) noTone(BEEPER_PIN);
  }
 }
 
 void markCommandExecuted(String commandId) {
   String url = String(SUPABASE_URL) + "/rest/v1/commands?id=eq." + commandId;
   String payload = "{\"executed\":true,\"executed_at\":\"" + getCurrentTimeISO() + "\"}";
   int code = httpRequest(url, "PATCH", payload);
   (void)code;
 }
 
 void updateBoxState(bool isOpen) {
   if (!tcpipReady || WiFi.status() != WL_CONNECTED) return;
   
   // Wenn wir die UUID noch nicht haben, hole sie zuerst
   if (boxStateId.length() == 0) {
     String url = String(SUPABASE_URL) + "/rest/v1/box_state?order=created_at.desc&limit=1";
     HTTPClient http;
     http.setTimeout(5000);
     http.setReuse(false);
     
     if (http.begin(url)) {
       http.addHeader("apikey", SUPABASE_KEY);
       http.addHeader("Authorization", "Bearer " + String(SUPABASE_KEY));
       http.addHeader("Content-Type", "application/json");
       
       int code = http.GET();
       if (code == 200) {
         String payload = http.getString();
         DynamicJsonDocument doc(512);
        if (!deserializeJson(doc, payload) && doc.is<JsonArray>() && doc.size() > 0) {
          boxStateId = doc[0]["id"].as<String>();
        }
       }
       http.end();
     }
     
     // Wenn immer noch keine ID, erstelle einen neuen Eintrag
     if (boxStateId.length() == 0) {
       String url = String(SUPABASE_URL) + "/rest/v1/box_state";
       String payload = "{\"is_open\":" + String(isOpen ? "true" : "false") + ",\"last_updated\":\"" + getCurrentTimeISO() + "\"}";
       HTTPClient http;
       http.setTimeout(5000);
       http.setReuse(false);
       
       if (http.begin(url)) {
         http.addHeader("apikey", SUPABASE_KEY);
         http.addHeader("Authorization", "Bearer " + String(SUPABASE_KEY));
         http.addHeader("Content-Type", "application/json");
         http.addHeader("Prefer", "return=representation");
         
         int code = http.POST(payload);
        if (code == 201) {
          String response = http.getString();
          DynamicJsonDocument doc(512);
          if (!deserializeJson(doc, response) && doc.is<JsonArray>() && doc.size() > 0) {
            boxStateId = doc[0]["id"].as<String>();
          }
        }
         http.end();
       }
       return; // Beim ersten Mal nur erstellen, nicht updaten
     }
   }
   
  // Jetzt mit der UUID aktualisieren
  String url = String(SUPABASE_URL) + "/rest/v1/box_state?id=eq." + boxStateId;
  String payload = "{\"is_open\":" + String(isOpen ? "true" : "false") + ",\"last_updated\":\"" + getCurrentTimeISO() + "\"}";
  int code = httpRequest(url, "PATCH", payload);
  if (code == 200 || code == 204) {
    lastStateUpdate = millis();
  }
 }
 
 void logActivity(String eventType, String message) {
   if (!tcpipReady || WiFi.status() != WL_CONNECTED) return;
   String url = String(SUPABASE_URL) + "/rest/v1/activity_logs";
   String payload = "{\"event_type\":\"" + eventType + "\",\"message\":\"" + message + "\"}";
   httpRequest(url, "POST", payload);
 }
 
 String getCurrentTimeISO() {
   time_t now = time(nullptr);
   if (now < 946684800) return "2024-01-01T00:00:00Z";
   struct tm* timeinfo = gmtime(&now);
   char buffer[30];
   sprintf(buffer, "%04d-%02d-%02dT%02d:%02d:%02dZ",
     timeinfo->tm_year + 1900, timeinfo->tm_mon + 1, timeinfo->tm_mday,
     timeinfo->tm_hour, timeinfo->tm_min, timeinfo->tm_sec);
   return String(buffer);
 }
 