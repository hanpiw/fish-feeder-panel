# Skema Wiring - Smart Fish Feeder

Dokumentasi sambungan kabel (wiring diagram) antara ESP32 DevKitV1 dan Servo SG90.

## Koneksi Fisik Pin

```text
       +-----------------------------------+
       |          ESP32 DevKitV1           |
       |                                   |
       |  [GND]   [5V/VIN]   [D13/GPIO13]  |
       +----+--------+------------+--------+
            |        |            |
            |        |            |
     Cokelat|    Merah|      Oranye|
     / Hitam|         |     / Kuning|
            |        |            |
       +----+--------+------------+--------+
       |            Servo SG90             |
       |                                   |
       +-----------------------------------+
```

### Tabel Sambungan

| No | Kabel Servo | Pin ESP32 DevKitV1 | Deskripsi Tegangan & Sinyal |
|----|-------------|--------------------|-----------------------------|
| 1  | **Cokelat / Hitam** | `GND` | Ground Terbuka |
| 2  | **Merah** | `VIN` atau `5V` | Tegangan Input (5 Volt). **HINDARI Pin 3.3V** karena arus servo SG90 yang cukup besar saat mulai bergerak dapat memicu undervoltage/reset pada ESP32. |
| 3  | **Oranye / Kuning** | `D13` (GPIO 13) | Kabel kontrol modulasi lebar pulsa (PWM) untuk mengatur sudut gerak servo. |

---

## Catatan Penting untuk Deploy Hardware

> [!WARNING]
> **Sumber Daya Listrik (Power Source)**:
> - Jika ESP32 ditenagai lewat kabel Micro-USB dari adapter charger HP, pin `VIN` atau `5V` akan menyalurkan tegangan 5V stabil dari USB. Ini aman dan cukup untuk menggerakkan servo SG90 beban ringan.
> - Namun, jika Anda menggunakan mekanisme pakan yang sangat berat (macet/stuck), motor servo dapat menarik arus hingga > 500mA yang dapat menyebabkan ESP32 me-restart sendiri (brownout). Jika ini terjadi, disarankan memberi daya 5V eksternal yang dihubungkan ke servo secara paralel (dengan menyatukan GND power supply eksternal dengan GND ESP32).
