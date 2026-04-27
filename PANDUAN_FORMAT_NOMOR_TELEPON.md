# Panduan Format Nomor Telepon

## Format Standar

Semua nomor telepon di sistem menggunakan format standar internasional:

```
[kode_negara][nomor_tanpa_0_di_depan]
```

### Contoh Format yang Benar:
- ✅ `6281392819234` (Indonesia)
- ✅ `60123456789` (Malaysia)
- ✅ `6591234567` (Singapore)

### Contoh Format yang SALAH:
- ❌ `081392819234` (ada 0 di depan)
- ❌ `62-813-9281-9234` (ada strip/dash)
- ❌ `+62 813 9281 9234` (ada spasi dan simbol)
- ❌ `813-9281-9234` (tidak ada kode negara)

---

## Cara Input Nomor Telepon

### 1. **Di Form Customer / Calon Customer**

Sistem menyediakan input field khusus dengan 2 bagian:

#### a. Selector Kode Negara
- Default: +62 (Indonesia) 🇮🇩
- Pilihan lain: Malaysia, Singapore, Thailand, Philippines, Vietnam

#### b. Input Nomor (HANYA BAGIAN LOKAL)
- ✅ **Ketik langsung nomor lokal: 81392819234**
- ✅ **Tanpa 0 di depan**
- ✅ **Tanpa +62 atau 62 di depan**
- ✅ **Tanpa spasi atau strip**
- ✅ **Langsung angka saja!**

**Contoh Input:**
```
Kode Negara: +62
Nomor: 81392819234  ← HANYA INI! Tanpa 0, tanpa 62
```

Sistem akan otomatis menyimpan sebagai: `6281392819234`

**Auto-Normalisasi:**
- Ketik `081392819234` → otomatis jadi `81392819234`
- Ketik `62813928192834` → otomatis jadi `81392819234`
- Ketik `+62813928192834` → otomatis jadi `81392819234`
- Ketik `0813-9281-9234` → otomatis jadi `81392819234`

---

## Auto-Formatting & Normalisasi

### Saat Mengetik:
Sistem akan otomatis membersihkan input Anda:

**Contoh 1: Input dengan 0 di depan**
```
Anda ketik: 0813-9281-9234
↓ Hapus dash: 081392819234
↓ Hapus 0: 81392819234
Tampil: 81392819234
Disimpan: 6281392819234
```

**Contoh 2: Input dengan +62**
```
Anda ketik: +62813-9281-9234
↓ Hapus +: 62813-9281-9234
↓ Hapus dash: 6281392819234
↓ Hapus 62: 81392819234
Tampil: 81392819234
Disimpan: 6281392819234
```

**Contoh 3: Input dengan 62**
```
Anda ketik: 62 813 9281 9234
↓ Hapus spasi: 6281392819234
↓ Hapus 62: 81392819234
Tampil: 81392819234
Disimpan: 6281392819234
```

**Contoh 4: Input langsung (RECOMMENDED!)**
```
Anda ketik: 81392819234
Tampil: 81392819234
Disimpan: 6281392819234
```

### Saat Blur (keluar dari input):
- Validasi panjang nomor (10-15 digit termasuk kode negara)
- Validasi kode negara valid
- Preview nomor yang akan disimpan ditampilkan

### Saat Disimpan:
- Format: `[kode_negara][nomor]` (hanya angka)
- Contoh: `6281392819234`

### Saat Ditampilkan di Tabel:
- Format: `6281392819234` (tanpa spasi)
- Format sama dengan yang disimpan di database
- Menggunakan font monospace untuk mudah dibaca

---

## Validasi

Sistem akan memvalidasi nomor telepon dengan aturan:

### ✅ Valid jika:
1. Panjang 10-15 digit (termasuk kode negara)
2. Dimulai dengan kode negara yang valid (62, 60, 65, 66, 63, 84, dll)
3. Hanya berisi angka

### ❌ Tidak Valid jika:
1. Terlalu pendek (< 10 digit)
2. Terlalu panjang (> 15 digit)
3. Kode negara tidak dikenali
4. Mengandung karakter selain angka

---

## Kode Negara yang Didukung

| Negara | Kode | Contoh |
|--------|------|--------|
| 🇮🇩 Indonesia | 62 | 6281234567890 |
| 🇲🇾 Malaysia | 60 | 60123456789 |
| 🇸🇬 Singapore | 65 | 6591234567 |
| 🇹🇭 Thailand | 66 | 66812345678 |
| 🇵🇭 Philippines | 63 | 639171234567 |
| 🇻🇳 Vietnam | 84 | 84912345678 |

---

## Migrasi Data Lama

Jika Anda memiliki data nomor telepon lama dengan format berbeda:

### Format Lama → Format Baru
```
081392819234     → 6281392819234
+62 813-9281-9234 → 6281392819234
0813 9281 9234   → 6281392819234
```

### Cara Normalisasi:
1. Edit customer/calon customer
2. Input ulang nomor telepon dengan format baru
3. Simpan

Sistem akan otomatis normalisasi format saat Anda simpan.

---

## ⭐ Cara Input yang DIREKOMENDASIKAN

### Cara Paling Mudah:
```
1. Pilih kode negara: +62 (Indonesia)
2. Ketik HANYA nomor lokal: 81392819234
3. Selesai! ✅
```

**JANGAN ketik:**
- ❌ 0813... (tanpa 0)
- ❌ +62813... (tanpa +62)
- ❌ 62813... (tanpa 62)

**Langsung ketik:**
- ✅ 81392819234

Sistem akan otomatis:
- Menambahkan kode negara (+62)
- Menyimpan sebagai: 6281392819234
- Menampilkan sebagai: 6281392819234

---

## FAQ

### Q: Mengapa harus tanpa 0 di depan?
**A:** Format internasional tidak menggunakan 0 di depan. Angka 0 adalah prefix untuk panggilan lokal, bukan internasional.

### Q: Bagaimana jika saya lupa kode negara?
**A:** Default sistem adalah +62 (Indonesia). Anda bisa memilih kode negara lain dari dropdown.

### Q: Apakah bisa input dengan format lama (0813...)?
**A:** Bisa! Sistem akan otomatis menghapus 0 di depan. Anda juga bisa paste format apapun (+62813..., 62813..., 0813...) dan sistem akan otomatis normalisasi menjadi 81... (bagian lokal saja).

### Q: Apakah nomor ditampilkan dengan spasi?
**A:** Tidak. Nomor ditampilkan sama seperti format penyimpanan: `6281392819234` (tanpa spasi, tanpa format tambahan).

### Q: Bagaimana untuk nomor telepon kantor dengan extension?
**A:** Simpan nomor utama dulu. Extension bisa ditambahkan di field catatan atau notes.

### Q: Apakah format ini untuk WhatsApp compatible?
**A:** Ya! Format ini compatible dengan WhatsApp link (wa.me/6281392819234).

---

## Keuntungan Format Standar

✅ **Konsisten** - Semua nomor di sistem menggunakan format sama  
✅ **International** - Bisa digunakan untuk panggilan internasional  
✅ **WhatsApp Ready** - Langsung bisa digunakan untuk link WhatsApp  
✅ **Database Friendly** - Mudah diquery dan difilter  
✅ **Validation Ready** - Mudah divalidasi formatnya  
✅ **Clean Data** - Tidak ada spasi, dash, atau karakter aneh  

---

## Lokasi Penggunaan

Format standar ini diterapkan di:
- ✅ Calon Customer (phone)
- ✅ Customer (companyPhone, contacts.phone)
- ✅ Pipeline (nomorTelepon)
- ✅ Follow-up (phone)

Semua lokasi ini sudah menggunakan `PhoneInput` component yang otomatis memformat nomor.

---

## Technical Details

### Storage Format
```json
{
  "phone": "6281392819234",
  "companyPhone": "6281392819234",
  "contacts": [
    {
      "pic": "John Doe",
      "phone": "6281392819234"
    }
  ]
}
```

### Display Format
```
6281392819234
```
(Sama dengan format storage, tanpa spasi)

### Utility Functions
- `formatPhoneNumber(phone)` - Format dan validasi nomor
- `normalizePhoneNumber(phone)` - Normalisasi dari berbagai format
- `displayPhoneNumber(phone)` - Format untuk display
- `isValidPhoneNumber(phone)` - Validasi nomor

---

**Update:** April 2026  
**Version:** 1.0  
**Status:** ✅ Implemented
