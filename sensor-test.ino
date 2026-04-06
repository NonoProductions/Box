/*
 * HC-SR04 Ultraschallsensor - TESTPROGRAMM
 * 
 * Gibt alle 200ms die gemessene Entfernung im Serial Monitor aus.
 * Pins: TRIG = GPIO 6, ECHO = GPIO 20
 * 
 * Serial Monitor auf 115200 Baud einstellen!
 * 
 * WICHTIG fuer ESP32-C3:
 * In Arduino IDE unter Tools -> "USB CDC On Boot" -> "Enabled" setzen!
 * Oder dieses Programm nutzt automatisch USBSerial als Fallback.
 */

// ESP32-C3 USB Serial Workaround
#if ARDUINO_USB_CDC_ON_BOOT
  #define SERIAL_OUT Serial
#elif defined(ARDUINO_USB_MODE) && ARDUINO_USB_MODE
  #define SERIAL_OUT Serial
#else
  // Versuche USBSerial fuer ESP32-C3 wenn CDC nicht aktiviert
  #if CONFIG_IDF_TARGET_ESP32C3 || CONFIG_IDF_TARGET_ESP32S3
    #define SERIAL_OUT USBSerial
  #else
    #define SERIAL_OUT Serial
  #endif
#endif

const int TRIG_PIN = 6;
const int ECHO_PIN = 20;

// LED Pin zum Blinken (zeigt dass der ESP laeuft, auch ohne Serial)
const int LED_PIN = 8; // ESP32-C3 hat oft eine LED auf GPIO 8

void setup() {
  SERIAL_OUT.begin(115200);
  
  // Warte bis Serial bereit ist (wichtig fuer USB CDC)
  unsigned long startWait = millis();
  while (!SERIAL_OUT && (millis() - startWait < 3000)) {
    delay(100);
  }
  delay(500);
  
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  
  SERIAL_OUT.println();
  SERIAL_OUT.println("================================");
  SERIAL_OUT.println("HC-SR04 Sensor Test gestartet");
  SERIAL_OUT.println("TRIG Pin: " + String(TRIG_PIN));
  SERIAL_OUT.println("ECHO Pin: " + String(ECHO_PIN));
  SERIAL_OUT.println("================================");
  SERIAL_OUT.println();
  SERIAL_OUT.flush();
}

void loop() {
  // LED toggeln - damit du siehst dass der ESP laeuft
  // (auch wenn Serial nicht funktioniert)
  static bool ledState = false;
  ledState = !ledState;
  digitalWrite(LED_PIN, ledState);
  
  // Einzelmessung
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  long duration = pulseIn(ECHO_PIN, HIGH, 30000); // 30ms Timeout
  
  if (duration == 0) {
    SERIAL_OUT.println("FEHLER: Kein Echo empfangen (Timeout) - Sensor pruefen!");
  } else {
    float distanceCm = duration * 0.034 / 2.0;
    
    SERIAL_OUT.print("Dauer: ");
    SERIAL_OUT.print(duration);
    SERIAL_OUT.print(" us  |  Entfernung: ");
    SERIAL_OUT.print(distanceCm, 1);
    SERIAL_OUT.print(" cm");
    
    if (distanceCm < 4.0) {
      SERIAL_OUT.print("  <<< HAND ERKANNT (< 4cm)");
    }
    
    SERIAL_OUT.println();
  }
  
  SERIAL_OUT.flush();
  delay(200);
}
