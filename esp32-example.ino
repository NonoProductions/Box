/*
 * ESP32-C3 Smart Box Controller
 * 
 * Hardware:
 * - ESP32-C3 Super Mini
 * - HC-SR04 Ultrasonic Sensor (Trig: GPIO4, Echo: GPIO5)
 * - SG90 Servo (Signal: GPIO6)
 * - Beeper/Buzzer (GPIO7)
 * 
 * Libraries needed:
 * - WiFi (built-in)
 * - HTTPClient (built-in)
 * - ArduinoJson (install via Library Manager)
 * - Servo (install via Library Manager)
 * - Supabase ESP32 Client (or use HTTP requests)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Servo.h>

// WiFi Credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Supabase Configuration
const char* supabaseUrl = "YOUR_SUPABASE_URL";
const char* supabaseKey = "YOUR_SUPABASE_ANON_KEY";
const char* supabaseApiKey = "YOUR_SUPABASE_SERVICE_ROLE_KEY"; // For updates

// Pin Definitions
const int TRIG_PIN = 4;
const int ECHO_PIN = 5;
const int SERVO_PIN = 6;
const int BEEPER_PIN = 7;

// Servo positions
const int SERVO_CLOSED = 0;
const int SERVO_OPEN = 90;

// Sensor settings
const int SENSOR_THRESHOLD = 20; // cm - distance to trigger auto-open
const unsigned long SENSOR_CHECK_INTERVAL = 500; // ms

// State
Servo boxServo;
bool boxIsOpen = false;
unsigned long lastSensorCheck = 0;
unsigned long lastCommandCheck = 0;
unsigned long lastScheduleCheck = 0;
unsigned long beeperEndTime = 0;
bool beeperActive = false;

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  // Initialize pins
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(BEEPER_PIN, OUTPUT);
  
  // Initialize servo
  boxServo.attach(SERVO_PIN);
  boxServo.write(SERVO_CLOSED);
  boxIsOpen = false;
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("Connected! IP: ");
  Serial.println(WiFi.localIP());
  
  // Update box state in Supabase
  updateBoxState(false);
  
  Serial.println("Smart Box Controller Ready!");
}

void loop() {
  unsigned long currentMillis = millis();
  
  // Check for commands from Supabase
  if (currentMillis - lastCommandCheck >= 2000) {
    checkCommands();
    lastCommandCheck = currentMillis;
  }
  
  // Check schedules
  if (currentMillis - lastScheduleCheck >= 60000) {
    checkSchedules();
    lastScheduleCheck = currentMillis;
  }
  
  // Check ultrasonic sensor for auto-open
  if (currentMillis - lastSensorCheck >= SENSOR_CHECK_INTERVAL) {
    checkUltrasonicSensor();
    lastSensorCheck = currentMillis;
  }
  
  // Handle beeper
  if (beeperActive && currentMillis >= beeperEndTime) {
    stopBeeper();
  }
  
  delay(10);
}

void checkCommands() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  String url = String(supabaseUrl) + "/rest/v1/commands?executed=eq.false&order=timestamp.asc&limit=1";
  
  http.begin(url);
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", "Bearer " + String(supabaseKey));
  http.addHeader("Content-Type", "application/json");
  
  int httpCode = http.GET();
  
  if (httpCode == 200) {
    String payload = http.getString();
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, payload);
    
    if (doc.is<JsonArray>() && doc.size() > 0) {
      JsonObject command = doc[0];
      String cmdId = command["id"].as<String>();
      String cmd = command["command"].as<String>();
      JsonObject data = command["data"];
      
      Serial.print("Executing command: ");
      Serial.println(cmd);
      
      if (cmd == "open") {
        openBox();
      } else if (cmd == "close") {
        closeBox();
      } else if (cmd == "beeper") {
        int duration = data.containsKey("duration") ? data["duration"] : 2;
        startBeeper(duration);
      } else if (cmd == "schedule_trigger") {
        int duration = data.containsKey("beeper_duration") ? data["beeper_duration"] : 5;
        startBeeper(duration);
        openBox();
      }
      
      // Mark command as executed
      markCommandExecuted(cmdId);
    }
  }
  
  http.end();
}

void checkSchedules() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  // Get current time
  time_t now = time(nullptr);
  struct tm* timeinfo = localtime(&now);
  int currentHour = timeinfo->tm_hour;
  int currentMinute = timeinfo->tm_min;
  int currentDay = timeinfo->tm_wday == 0 ? 6 : timeinfo->tm_wday - 1; // Convert to 0-6 (Mo-So)
  
  String timeStr = String(currentHour) + ":" + (currentMinute < 10 ? "0" : "") + String(currentMinute);
  
  HTTPClient http;
  String url = String(supabaseUrl) + "/rest/v1/schedules?active=eq.true&time=eq." + timeStr;
  
  http.begin(url);
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", "Bearer " + String(supabaseKey));
  
  int httpCode = http.GET();
  
  if (httpCode == 200) {
    String payload = http.getString();
    DynamicJsonDocument doc(2048);
    deserializeJson(doc, payload);
    
    if (doc.is<JsonArray>()) {
      for (JsonObject schedule : doc.as<JsonArray>()) {
        JsonArray days = schedule["days"];
        bool dayMatches = false;
        
        for (JsonVariant day : days) {
          if (day.as<int>() == currentDay) {
            dayMatches = true;
            break;
          }
        }
        
        if (dayMatches) {
          int beeperDuration = schedule["beeper_duration"] | 5;
          Serial.println("Schedule triggered!");
          startBeeper(beeperDuration);
          openBox();
        }
      }
    }
  }
  
  http.end();
}

void checkUltrasonicSensor() {
  // Trigger sensor
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  // Read echo
  long duration = pulseIn(ECHO_PIN, HIGH);
  int distance = duration * 0.034 / 2; // Convert to cm
  
  // Auto-open if object detected and box is closed
  if (distance > 0 && distance < SENSOR_THRESHOLD && !boxIsOpen) {
    Serial.print("Object detected at ");
    Serial.print(distance);
    Serial.println(" cm - Opening box");
    openBox();
  }
}

void openBox() {
  if (boxIsOpen) return;
  
  boxServo.write(SERVO_OPEN);
  boxIsOpen = true;
  updateBoxState(true);
  logActivity("box_opened", "Box wurde geöffnet");
  Serial.println("Box opened");
}

void closeBox() {
  if (!boxIsOpen) return;
  
  boxServo.write(SERVO_CLOSED);
  boxIsOpen = false;
  updateBoxState(false);
  logActivity("box_closed", "Box wurde geschlossen");
  Serial.println("Box closed");
}

void startBeeper(int durationSeconds) {
  beeperActive = true;
  beeperEndTime = millis() + (durationSeconds * 1000);
  tone(BEEPER_PIN, 1000); // 1kHz tone
  Serial.print("Beeper started for ");
  Serial.print(durationSeconds);
  Serial.println(" seconds");
}

void stopBeeper() {
  beeperActive = false;
  noTone(BEEPER_PIN);
  Serial.println("Beeper stopped");
}

void markCommandExecuted(String commandId) {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  String url = String(supabaseUrl) + "/rest/v1/commands?id=eq." + commandId;
  
  http.begin(url);
  http.addHeader("apikey", supabaseApiKey);
  http.addHeader("Authorization", "Bearer " + String(supabaseApiKey));
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Prefer", "return=minimal");
  
  String payload = "{\"executed\":true,\"executed_at\":\"" + getCurrentTimeISO() + "\"}";
  http.PATCH(payload);
  
  http.end();
}

void updateBoxState(bool isOpen) {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  String url = String(supabaseUrl) + "/rest/v1/box_state?id=eq.1";
  
  http.begin(url);
  http.addHeader("apikey", supabaseApiKey);
  http.addHeader("Authorization", "Bearer " + String(supabaseApiKey));
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Prefer", "return=minimal");
  
  String payload = "{\"is_open\":" + String(isOpen ? "true" : "false") + ",\"last_updated\":\"" + getCurrentTimeISO() + "\"}";
  http.PATCH(payload);
  
  http.end();
}

void logActivity(String eventType, String message) {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  String url = String(supabaseUrl) + "/rest/v1/activity_logs";
  
  http.begin(url);
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", "Bearer " + String(supabaseKey));
  http.addHeader("Content-Type", "application/json");
  
  String payload = "{\"event_type\":\"" + eventType + "\",\"message\":\"" + message + "\"}";
  http.POST(payload);
  
  http.end();
}

String getCurrentTimeISO() {
  // Note: You may need to sync time with NTP server first
  // For now, returning a placeholder - implement proper time sync
  time_t now = time(nullptr);
  if (now < 946684800) { // Before 2000, time not set
    return "2024-01-01T00:00:00Z";
  }
  
  struct tm* timeinfo = gmtime(&now);
  char buffer[30];
  sprintf(buffer, "%04d-%02d-%02dT%02d:%02d:%02dZ",
          timeinfo->tm_year + 1900,
          timeinfo->tm_mon + 1,
          timeinfo->tm_mday,
          timeinfo->tm_hour,
          timeinfo->tm_min,
          timeinfo->tm_sec);
  return String(buffer);
}

