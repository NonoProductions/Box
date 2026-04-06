// Legacy-Konfigurationsdatei fuer die alte Vanilla-App.
// Fuer die aktuelle Vite/React-App bitte .env bzw. .env.example verwenden.

export const config = {
  supabase: {
    url: 'YOUR_SUPABASE_URL',
    anonKey: 'YOUR_SUPABASE_ANON_KEY',
    serviceRoleKey: 'YOUR_SUPABASE_SERVICE_ROLE_KEY',
  },
  esp32: {
    wifi: {
      ssid: 'YOUR_WIFI_SSID',
      password: 'YOUR_WIFI_PASSWORD',
    },
    pins: {
      ultrasonicTrig: 4,
      ultrasonicEcho: 5,
      servo: 6,
      beeper: 7,
    },
    sensor: {
      threshold: 20,
      checkInterval: 500,
    },
  },
}
