# ESP32 SG90 Servo - Smart Fish Feeder Firmware

Firmware ini dikembangkan menggunakan framework Arduino untuk perangkat ESP32 DevKitV1 yang mengontrol Servo SG90. ESP32 terhubung ke internet menggunakan WiFi lokal dan berkomunikasi dengan Supabase menggunakan protokol HTTP REST API (Client Polling 3 detik).

## Sambungan Kabel Hardware

| Servo SG90 | Warna Kabel | Pin ESP32 DevKitV1 | Keterangan |
|------------|-------------|---------------------|------------|
| Ground (GND)| Cokelat / Hitam | GND | Sambungan Ground |
| Power (VCC) | Merah | VIN / 5V | **PENTING**: Gunakan 5V karena servo butuh arus besar saat bergerak. Hindari pin 3.3V. |
| Signal (PWM)| Oranye / Kuning | D13 (GPIO 13) | Kontrol posisi servo |

## Cara Penggunaan & Konpilasi

Proyek ini terstruktur sebagai proyek **PlatformIO** (namun kodenya juga 100% kompatibel dengan **Arduino IDE**).

### Menggunakan PlatformIO (VS Code):
1. Buka folder `firmware/esp32` di VS Code yang telah memiliki ekstensi PlatformIO.
2. Edit file `src/main.cpp` dan sesuaikan variabel berikut:
   - `ssid`: Nama WiFi Anda
   - `password`: Password WiFi Anda
   - `device_id`: Salin UUID dari dashboard web yang Anda buat setelah mendaftarkan perangkat.
3. Hubungkan ESP32 DevKitV1 Anda ke port USB komputer.
4. Klik tombol **PlatformIO: Build** (ikon centang di status bar bawah) untuk kompilasi.
5. Klik tombol **PlatformIO: Upload** (ikon panah kanan) untuk mem-flash firmware ke ESP32.
6. Buka Serial Monitor (baud rate: `115200`) untuk melihat log proses debugging.

### Menggunakan Arduino IDE:
1. Buka Arduino IDE.
2. Buat sketsa baru.
3. Salin seluruh konten dari `src/main.cpp` ke dalam sketsa Anda.
4. Simpan sketsa dengan nama `esp32_fish_feeder.ino`.
5. Pastikan Anda menginstal library berikut melalui Library Manager (Tools -> Manage Libraries):
   - **ArduinoJson** (oleh Benoit Blanchon, versi 7.x)
   - **ESP32Servo** (oleh John K. Bennett, versi 3.x)
6. Pilih Board: **DOIT ESP32 DEVKIT V1** (atau modul ESP32 umum lainnya).
7. Konfigurasi SSID, Password WiFi, dan Device ID di baris awal kode.
8. Klik **Upload**.
