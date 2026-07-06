#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>
#include <time.h>

// ==========================================
// KONFIGURASI WIFI & SUPABASE
// ==========================================
const char* ssid = "fysss -2.4G";         // Ganti dengan SSID WiFi Anda
const char* password = "GENEIRYODAN"; // Ganti dengan Password WiFi Anda

const char* supabase_url = "https://yaivbvnqqblevecypwle.supabase.co"; // Ganti ke SUPABASE URL Anda
const char* supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhaXZidm5xcWJsZXZlY3lwd2xlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyNjcxNTIsImV4cCI6MjA5ODg0MzE1Mn0.eRYpFd8EBbhzTlqfNMH5farkJHq-Q_TPmJLUXCAmuIQ";
// Ganti ke SUPABASE ANON KEY Anda

// Salin ID Perangkat dari Dashboard Web Anda
const char* device_id = "9a76aec0-008d-4e3c-866b-44d579424a7b"; // SALIN_DEVICE_ID_DISINI (Login Halaman Dashboard Terlebih Dahulu)

// ==========================================
// PIN & PERANGKAT HARDWARE
// ==========================================
const int servoPin = 13; // Pin D13 (GPIO 13) servo SG90 (Kabel Oranye/Kuning)
Servo myServo;

// ==========================================
// VARIABEL & STATE GLOBAL
// ==========================================
unsigned long lastHeartbeat = 0;
const unsigned long heartbeatInterval = 15000; // Heartbeat setiap 15 detik

unsigned long lastQueuePoll = 0;
const unsigned long queuePollInterval = 3000; // Polling antrean manual setiap 3 detik

unsigned long lastSchedulesPoll = 0;
const unsigned long schedulesPollInterval = 60000; // Sinkronisasi jadwal setiap 60 detik

// Struktur Jadwal di Memori ESP32
struct DeviceSchedule {
  String id;
  int hour;
  int minute;
  int duration;
  bool enabled;
};

#define MAX_SCHEDULES 20
DeviceSchedule schedules[MAX_SCHEDULES];
int scheduleCount = 0;
String lastTriggeredTime = ""; // Jam:Menit terakhir kali jadwal dieksekusi

// NTP Time Configuration
const char* ntpServer = "pool.ntp.org";
const long  gmtOffset_sec = 7 * 3600; // GMT+7 (WIB). Sesuaikan bila berada di WITA (8) atau WIT (9)
const int   daylightOffset_sec = 0;

// ==========================================
// HELEPR FUNCTIONS
// ==========================================

// Fungsi menggerakkan servo SG90 untuk memberi makan
void triggerServoActuation(int durationSeconds) {
  Serial.printf("[SERVO] Memulai pemberian pakan selama %d detik...\n", durationSeconds);
  
  // Attach servo sebelum digunakan
  myServo.attach(servoPin);
  
  unsigned long startTime = millis();
  unsigned long runTime = durationSeconds * 1000;
  
  // Menggerakkan servo bolak-balik untuk menjatuhkan pakan
  while (millis() - startTime < runTime) {
    Serial.println("[SERVO] Membuka katup pakan (180 derajat)...");
    myServo.write(180);
    delay(800);
    
    Serial.println("[SERVO] Menutup katup pakan (0 derajat)...");
    myServo.write(0);
    delay(800);
  }
  
  // Pastikan posisi akhir tertutup rapat
  myServo.write(0);
  delay(200);
  
  // Detach servo setelah selesai untuk mencegah noise/jitter dan menghemat daya
  myServo.detach();
  Serial.println("[SERVO] Selesai pemberian pakan.");
}

// Mengambil waktu sekarang dari internal clock (NTP synced)
String getCurrentTimeFormatted() {
  struct tm timeinfo;
  if(!getLocalTime(&timeinfo)){
    return "";
  }
  char timeStr[9];
  strftime(timeStr, sizeof(timeStr), "%H:%M:%S", &timeinfo);
  return String(timeStr);
}

// ==========================================
// INTEGRASI SUPABASE API
// ==========================================

// 1. Mengirim Heartbeat untuk menandakan perangkat aktif (online = true)
void sendHeartbeat() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  String url = String(supabase_url) + "/rest/v1/devices?id=eq." + String(device_id);
  
  http.begin(url);
  http.addHeader("apikey", supabase_key);
  http.addHeader("Authorization", "Bearer " + String(supabase_key));
  http.addHeader("Content-Type", "application/json");
  
  // Kirim kekuatan WiFi RSSI dan firmware version
  int rssi = WiFi.RSSI();
  String payload = "{\"online\":true,\"wifi_strength\":" + String(rssi) + ",\"firmware_version\":\"v1.0.0\"}";
  
  int httpResponseCode = http.PATCH(payload);
  
  if (httpResponseCode > 0) {
    Serial.printf("[HEARTBEAT] Heartbeat terkirim. RSSI: %d dBm. Response Code: %d\n", rssi, httpResponseCode);
  } else {
    Serial.printf("[HEARTBEAT] Error saat kirim Heartbeat: %s\n", http.errorToString(httpResponseCode).c_str());
  }
  http.end();
}

// 2. Mengirim catatan log pakan ke tabel `feed_logs`
void insertFeedLog(String source, int durationSeconds, String status) {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  String url = String(supabase_url) + "/rest/v1/feed_logs";
  
  http.begin(url);
  http.addHeader("apikey", supabase_key);
  http.addHeader("Authorization", "Bearer " + String(supabase_key));
  http.addHeader("Content-Type", "application/json");
  
  // Body JSON untuk feed_logs
  JsonDocument doc;
  doc["device_id"] = device_id;
  doc["source"] = source;
  doc["duration"] = durationSeconds;
  doc["status"] = status;
  
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  int httpResponseCode = http.POST(jsonPayload);
  
  if (httpResponseCode > 0) {
    Serial.printf("[LOG] Riwayat pakan berhasil dicatat. Response Code: %d\n", httpResponseCode);
  } else {
    Serial.printf("[LOG] Gagal mencatat riwayat pakan: %s\n", http.errorToString(httpResponseCode).c_str());
  }
  http.end();
}

// 3. Mengupdate status perintah antrean pakan di `feed_queue`
void updateQueueStatus(String queueId, String newStatus) {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  String url = String(supabase_url) + "/rest/v1/feed_queue?id=eq." + queueId;
  
  http.begin(url);
  http.addHeader("apikey", supabase_key);
  http.addHeader("Authorization", "Bearer " + String(supabase_key));
  http.addHeader("Content-Type", "application/json");
  
  String payload = "{\"status\":\"" + newStatus + "\"}";
  int httpResponseCode = http.PATCH(payload);
  
  if (httpResponseCode > 0) {
    Serial.printf("[QUEUE] Perubahan status antrean menjadi '%s' berhasil. Response: %d\n", newStatus.c_str(), httpResponseCode);
  } else {
    Serial.printf("[QUEUE] Gagal mengubah status antrean: %s\n", http.errorToString(httpResponseCode).c_str());
  }
  http.end();
}

// 4. Polling perintah pakan manual di `feed_queue`
void checkFeedQueue() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  // Ambil perintah berstatus 'pending' yang paling lama dibuat (FIFO)
  String url = String(supabase_url) + "/rest/v1/feed_queue?device_id=eq." + String(device_id) + "&status=eq.pending&order=created_at.asc&limit=1";
  
  http.begin(url);
  http.addHeader("apikey", supabase_key);
  http.addHeader("Authorization", "Bearer " + String(supabase_key));
  
  int httpResponseCode = http.GET();
  
  if (httpResponseCode == 200) {
    String responseBody = http.getString();
    
    JsonDocument doc;
    DeserializationError error = deserializeJson(doc, responseBody);
    
    if (!error) {
      JsonArray arr = doc.as<JsonArray>();
      if (arr.size() > 0) {
        JsonObject item = arr[0];
        String queueId = item["id"].as<String>();
        int durationSeconds = item["duration"].as<int>();
        String source = item["source"].as<String>();
        
        Serial.printf("[QUEUE] Menemukan antrean pending! ID: %s, Durasi: %d detik\n", queueId.c_str(), durationSeconds);
        
        // 1. Ubah status antrean menjadi 'processing'
        updateQueueStatus(queueId, "processing");
        
        // 2. Jalankan gerakan servo
        triggerServoActuation(durationSeconds);
        
        // 3. Ubah status antrean menjadi 'done'
        updateQueueStatus(queueId, "done");
        
        // 4. Masukkan ke dalam tabel feed_logs
        insertFeedLog(source, durationSeconds, "success");
      }
    }
  } else {
    Serial.printf("[QUEUE] Gagal polling antrean. Response Code: %d\n", httpResponseCode);
  }
  http.end();
}

// 5. Polling sinkronisasi jadwal harian dari tabel `schedules`
void syncSchedules() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  String url = String(supabase_url) + "/rest/v1/schedules?device_id=eq." + String(device_id) + "&enabled=eq.true";
  
  http.begin(url);
  http.addHeader("apikey", supabase_key);
  http.addHeader("Authorization", "Bearer " + String(supabase_key));
  
  int httpResponseCode = http.GET();
  
  if (httpResponseCode == 200) {
    String responseBody = http.getString();
    
    JsonDocument doc;
    DeserializationError error = deserializeJson(doc, responseBody);
    
    if (!error) {
      JsonArray arr = doc.as<JsonArray>();
      scheduleCount = 0;
      
      for (int i = 0; i < arr.size() && i < MAX_SCHEDULES; i++) {
        JsonObject item = arr[i];
        String id = item["id"].as<String>();
        String timeStr = item["feed_time"].as<String>(); // Format "HH:MM:SS" atau "HH:MM"
        int duration = item["duration"].as<int>();
        
        // Parsing jam dan menit dari string timeStr
        int firstColon = timeStr.indexOf(':');
        int secondColon = timeStr.indexOf(':', firstColon + 1);
        
        int hour = timeStr.substring(0, firstColon).toInt();
        int minute = (secondColon != -1) 
          ? timeStr.substring(firstColon + 1, secondColon).toInt() 
          : timeStr.substring(firstColon + 1).toInt();
          
        schedules[i] = {id, hour, minute, duration, true};
        scheduleCount++;
      }
      Serial.printf("[SCHEDULE] Berhasil menyinkronkan %d jadwal pakan aktif.\n", scheduleCount);
    }
  } else {
    Serial.printf("[SCHEDULE] Gagal menyinkronkan jadwal. Response Code: %d\n", httpResponseCode);
  }
  http.end();
}

// 6. Memeriksa apakah saat ini adalah waktu untuk memberi makan terjadwal
void checkSchedules() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) return;
  
  int currentHour = timeinfo.tm_hour;
  int currentMinute = timeinfo.tm_min;
  
  // Format jam:menit saat ini untuk validasi pencegahan pemicuan ganda
  char curTimeStr[6];
  sprintf(curTimeStr, "%02d:%02d", currentHour, currentMinute);
  String curTimeStrObj = String(curTimeStr);
  
  // Jika sudah dieksekusi di menit yang sama, lewati
  if (lastTriggeredTime == curTimeStrObj) return;
  
  for (int i = 0; i < scheduleCount; i++) {
    if (schedules[i].enabled && schedules[i].hour == currentHour && schedules[i].minute == currentMinute) {
      Serial.printf("[SCHEDULE] Waktunya makan sesuai jadwal! Jam: %s, Durasi: %d detik\n", curTimeStr, schedules[i].duration);
      
      // Catat menit ini agar tidak terpicu lagi
      lastTriggeredTime = curTimeStrObj;
      
      // Jalankan servo
      triggerServoActuation(schedules[i].duration);
      
      // Catat ke feed_logs
      insertFeedLog("web_schedule", schedules[i].duration, "success");
      break; // Hanya eksekusi satu jadwal per menit
    }
  }
}


// ==========================================
// ARDUINO SETUP & LOOP
// ==========================================

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n--- SMART FISH FEEDER BOOTING ---");
  
  // Set servo pin sebagai OUTPUT (tapi tidak diattach dulu untuk hemat energi)
  pinMode(servoPin, OUTPUT);
  digitalWrite(servoPin, LOW);
  
  // Mulai koneksi WiFi
  WiFi.begin(ssid, password);
  Serial.printf("[WIFI] Menghubungkan ke SSID: %s\n", ssid);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\n[WIFI] Terhubung!");
  Serial.print("[WIFI] IP Address: ");
  Serial.println(WiFi.localIP());
  
  // Inisialisasi NTP Time Sync
  Serial.println("[TIME] Sinkronisasi waktu dengan NTP server...");
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  
  // Menunggu sinkronisasi waktu selesai
  struct tm timeinfo;
  int retries = 0;
  while (!getLocalTime(&timeinfo) && retries < 10) {
    Serial.println("[TIME] Menunggu sinkronisasi...");
    delay(1000);
    retries++;
  }
  
  if (getLocalTime(&timeinfo)) {
    Serial.print("[TIME] Sinkronisasi berhasil! Waktu lokal saat ini: ");
    Serial.println(getCurrentTimeFormatted());
  } else {
    Serial.println("[TIME] Gagal sinkronisasi waktu NTP. Jadwal pakan lokal mungkin terhambat.");
  }
  
  // Sinkronisasi jadwal awal
  syncSchedules();
  
  // Kirim heartbeat online pertama kali
  sendHeartbeat();
  
  Serial.println("--- PERANGKAT SIAP MEMULAI LOOP ---");
}

void loop() {
  // Reconnect WiFi otomatis jika terputus
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WIFI] Koneksi terputus! Mencoba menghubungkan kembali...");
    WiFi.disconnect();
    WiFi.begin(ssid, password);
    
    int retries = 0;
    while (WiFi.status() != WL_CONNECTED && retries < 15) {
      delay(1000);
      Serial.print(".");
      retries++;
    }
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("\n[WIFI] Terhubung kembali!");
      sendHeartbeat();
    }
    return;
  }
  
  unsigned long currentMillis = millis();
  
  // 1. Jalankan Polling Feed Queue (Antrean Manual) setiap 3 detik
  if (currentMillis - lastQueuePoll >= queuePollInterval) {
    lastQueuePoll = currentMillis;
    checkFeedQueue();
  }
  
  // 2. Jalankan Polling Jadwal (Sync schedules) setiap 60 detik
  if (currentMillis - lastSchedulesPoll >= schedulesPollInterval) {
    lastSchedulesPoll = currentMillis;
    syncSchedules();
  }
  
  // 3. Kirim Heartbeat ke database setiap 15 detik
  if (currentMillis - lastHeartbeat >= heartbeatInterval) {
    lastHeartbeat = currentMillis;
    sendHeartbeat();
  }
  
  // 4. Periksa jadwal pakan lokal setiap 1 detik
  static unsigned long lastTimeCheck = 0;
  if (currentMillis - lastTimeCheck >= 1000) {
    lastTimeCheck = currentMillis;
    checkSchedules();
  }
  
  delay(10); // Menjaga stabilitas CPU
}
