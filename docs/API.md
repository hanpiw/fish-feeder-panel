# Supabase Rest API Reference for ESP32

Dokumen ini menjelaskan endpoint REST API Supabase yang diakses oleh perangkat ESP32 untuk sinkronisasi antrean pakan manual, sinkronisasi jadwal, perekaman riwayat pakan, dan pemantauan detak jantung perangkat (heartbeat).

## Base URL
```text
https://YOUR_SUPABASE_PROJECT_REF.supabase.co
```

## Global Headers
Setiap request ke endpoint REST API Supabase **wajib** menyertakan header berikut:

```http
apikey: YOUR_SUPABASE_ANON_KEY
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
Content-Type: application/json (untuk POST / PATCH / PUT)
```

---

## 1. Device Heartbeat (Update Status Online)

ESP32 mengirim sinyal ke database setiap 15 detik untuk mengonfirmasi bahwa ia dalam keadaan aktif (online) beserta informasi kekuatan WiFi.

- **URL**: `/rest/v1/devices?id=eq.{device_id}`
- **Method**: `PATCH`
- **Request Body**:
```json
{
  "online": true,
  "wifi_strength": -58,
  "firmware_version": "v1.0.0"
}
```
- **Response**: `204 No Content` atau `200 OK`.
- **Note**: Trigger `update_devices_last_seen` di database akan otomatis mengupdate kolom `last_seen` ke waktu UTC saat update ini dilakukan.

---

## 2. Polling Feed Queue (Antrean Pakan Manual)

ESP32 menanyakan antrean perintah berstatus `pending` setiap 3 detik.

- **URL**: `/rest/v1/feed_queue?device_id=eq.{device_id}&status=eq.pending&order=created_at.asc&limit=1`
- **Method**: `GET`
- **Response Body** (Bila ada antrean):
```json
[
  {
    "id": "6d9fb7f8-cf94-4d89-9831-2856f6ba3a6a",
    "device_id": "a1b2c3d4-e5f6...",
    "command": "feed",
    "duration": 2,
    "source": "web_manual",
    "status": "pending",
    "created_at": "2026-07-02T22:15:30Z"
  }
]
```

### Mengubah Status Perintah Ke Processing/Done
Saat ESP32 mendeteksi ada baris pending, ia harus langsung mengubah statusnya ke `processing` sebelum bergerak, lalu `done` setelah servo selesai bergerak.

- **URL**: `/rest/v1/feed_queue?id=eq.{queue_id}`
- **Method**: `PATCH`
- **Request Body**:
```json
{
  "status": "processing"
}
```
dan kemudian setelah selesai:
```json
{
  "status": "done"
}
```

---

## 3. Sinkronisasi Jadwal Pakan

ESP32 menyinkronkan jadwal pakan lokal dengan database cloud setiap 60 detik.

- **URL**: `/rest/v1/schedules?device_id=eq.{device_id}&enabled=eq.true`
- **Method**: `GET`
- **Response Body**:
```json
[
  {
    "id": "f516a7f8-cf94-4d89-9831-8256f6ba32bb",
    "device_id": "a1b2c3d4-e5f6...",
    "feed_time": "08:30:00",
    "duration": 3,
    "enabled": true,
    "created_at": "2026-07-02T10:00:00Z"
  },
  {
    "id": "7823ab12-cc78-4a90-8832-7256f6ab41da",
    "device_id": "a1b2c3d4-e5f6...",
    "feed_time": "17:00:00",
    "duration": 2,
    "enabled": true,
    "created_at": "2026-07-02T10:05:00Z"
  }
]
```

---

## 4. Mencatat Riwayat Pakan (Feed Logs)

Setiap kali servo bergerak (baik karena manual feeding queue selesai atau jadwal tercapai), ESP32 mencatat log pemberian makan.

- **URL**: `/rest/v1/feed_logs`
- **Method**: `POST`
- **Request Body**:
```json
{
  "device_id": "a1b2c3d4-e5f6...",
  "source": "web_manual", // atau 'web_schedule'
  "duration": 2,
  "status": "success"
}
```
- **Response**: `201 Created`.
