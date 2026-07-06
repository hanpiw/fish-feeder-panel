# Smart Fish Feeder IoT

Sistem pemberi pakan ikan otomatis berbasis IoT menggunakan ESP32 DevKitV1, Servo SG90, Next.js (App Router), dan Supabase.

## Struktur Direktori

Sesuai dengan PRD, proyek ini disusun dengan struktur berikut:

```text
smart-fish-feeder/
├── docs/                     # Dokumentasi teknis
│   ├── PRD.md                # Product Requirements Document
│   ├── API.md                # Supabase REST API Reference untuk ESP32
│   ├── migration.sql         # Skema database & kebijakan RLS
│   └── README.md             # Indeks dokumentasi
│
├── firmware/                 # Firmware ESP32
│   └── esp32/
│       ├── src/main.cpp      # Kode C++ ESP32 utama
│       ├── platformio.ini    # Konfigurasi PlatformIO
│       └── README.md         # Panduan upload & build
│
├── hardware/                 # Dokumentasi hardware
│   └── wiring-diagram.md     # Skema penyambungan kabel pin servo & ESP32
│
└── web/                      # Aplikasi Web Next.js
    ├── src/
    │   ├── app/              # Next.js App Router (Dashboard, Auth)
    │   ├── components/       # Komponen UI global (Navbar, dll.)
    │   ├── features/         # Arsitektur Berbasis Fitur (auth, device, feeding, history, schedules)
    │   └── lib/supabase.ts   # Utilitas client Supabase
    ├── package.json          # Dependency aplikasi web
    ├── tsconfig.json         # Konfigurasi TypeScript
    └── README.md             # Panduan menjalankan aplikasi web
```

---

## Memulai Proyek

### 1. Inisialisasi Database Supabase
Database untuk proyek ini telah diatur. Jika Anda ingin melakukan replikasi ke proyek baru:
- Eksekusi file SQL di [docs/migration.sql](file:///h:/Folder%20Hanpi/AppAdmin/fish-feeder/docs/migration.sql) di SQL Editor Supabase Anda.

### 2. Konfigurasi dan Jalankan Aplikasi Web
1. Masuk ke direktori web:
   ```bash
   cd web
   ```
2. Konfigurasi file `.env.local` dengan kredensial Supabase Anda (telah diisi otomatis):
   ```text
   NEXT_PUBLIC_SUPABASE_URL=SUPABASE_URL_PUNYA LU
   NEXT_PUBLIC_SUPABASE_ANON_KEY=SUPABASE_ANON_KEY_PUNYA LU
   ```
3. Jalankan server pengembangan lokal:
   ```bash
   npm run dev
   ```
4. Buka `http://localhost:3000` di browser Anda. Lakukan registrasi akun baru (Sign Up) lalu masuk (Sign In).

### 3. Konfigurasi dan Upload Firmware ESP32
1. Hubungkan ESP32 DevKitV1 dan Servo SG90 sesuai panduan di [hardware/wiring-diagram.md](file:///h:/Folder%20Hanpi/AppAdmin/fish-feeder/hardware/wiring-diagram.md).
2. Ikuti instruksi di [firmware/esp32/README.md](file:///h:/Folder%20Hanpi/AppAdmin/fish-feeder/firmware/esp32/README.md) untuk menyesuaikan SSID, Password WiFi, dan Device ID, serta untuk mengunggah firmware ke ESP32 menggunakan VS Code (PlatformIO) atau Arduino IDE.
