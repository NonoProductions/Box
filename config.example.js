// Konfigurationsdatei - Kopieren Sie diese zu config.js und füllen Sie sie aus
// config.js sollte in .gitignore sein

export const config = {
  supabase: {
    url: 'YOUR_SUPABASE_URL', // z.B. 'https://xxxxx.supabase.co'
    anonKey: 'YOUR_SUPABASE_ANON_KEY',
    serviceRoleKey: 'YOUR_SUPABASE_SERVICE_ROLE_KEY' // Nur für ESP32
  },
  esp32: {
    wifi: {
      ssid: 'YOUR_WIFI_SSID',
      password: 'YOUR_WIFI_PASSWORD'
    },
    pins: {
      ultrasonicTrig: 4,
      ultrasonicEcho: 5,
      servo: 6,
      beeper: 7
    },
    sensor: {
      threshold: 20, // cm - Abstand für automatische Öffnung
      checkInterval: 500 // ms
    }
  }
};

