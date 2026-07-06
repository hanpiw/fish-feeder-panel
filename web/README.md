# Smart Fish Feeder Web App

Aplikasi panel kontrol berbasis web untuk proyek Smart Fish Feeder IoT. Dibangun menggunakan Next.js (App Router), TypeScript, dan Tailwind CSS, terintegrasi langsung dengan database real-time Supabase.

## Fitur Utama

- **Auth**: Fitur Sign Up dan Sign In aman menggunakan Supabase Auth.
- **Device Management**: Tambah perangkat baru untuk mendapatkan Device ID, pantau status koneksi perangkat (Online/Offline), RSSI sinyal WiFi, serta versi firmware secara real-time.
- **Manual Feed Control**: Trigger gerak servo pakan secara manual dengan durasi kustom (1-10 detik) langsung dari web, lengkap dengan status loading penunggu respon perangkat.
- **Daily Scheduler**: Pengaturan jadwal pemberian pakan otomatis harian yang tersinkronisasi otomatis ke ESP32.
- **Execution History Logs**: Pencatatan riwayat pakan lengkap dengan waktu, sumber pemicu (manual web vs jadwal otomatis), durasi, dan status eksekusi.

---

## Langkah Menjalankan Aplikasi Web

### 1. Prasyarat
Pastikan Anda sudah menginstal Node.js (versi 18+) di komputer Anda.

### 2. Instalasi Dependency
Masuk ke folder `web/` lalu jalankan perintah:
```bash
npm install
```

### 3. Konfigurasi Lingkungan
Pastikan file `.env.local` di folder `web/` sudah berisi kredensial yang tepat:
```env
NEXT_PUBLIC_SUPABASE_URL=SUPABASE_URL_PUNYA LU
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUPABASE_ANON_KEY_PUNYA LU
```

### 4. Jalankan Mode Development
Jalankan server lokal Next.js dengan perintah:
```bash
npm run dev
```
Aplikasi akan berjalan secara lokal di `http://localhost:3000`.

### 5. Bangun Produksi (Production Build)
Untuk membuild aplikasi ke dalam versi siap saji produksi:
```bash
npm run build
```
Untuk menjalankannya:
```bash
npm run start
```
