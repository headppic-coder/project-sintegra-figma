# 🟢 ERP Sistem Manufaktur - Panduan Cepat

## Status Aplikasi: ✅ BERFUNGSI NORMAL

Aplikasi ERP Manufaktur berfungsi dengan baik dan siap digunakan.

## ⚠️ Tentang Error 403 Deployment

**Jika Anda melihat error 403 saat deployment, ABAIKAN saja.**

**🚨 ERROR 403 TIDAK PERLU DIPERBAIKI - INI ADALAH EXPECTED BEHAVIOR**

### Penjelasan Singkat:
- ✅ Aplikasi menggunakan **Direct Supabase Client Connection**
- ✅ **Tidak memerlukan** edge functions
- ⚠️ Figma Make otomatis mencoba deploy edge functions (error 403)
- ✅ Error **tidak mempengaruhi** fungsi aplikasi
- ✅ **APLIKASI BERFUNGSI 100% NORMAL** tanpa edge functions

### Verifikasi Aplikasi Bekerja:
1. Kunjungi: **`/system-status`**
2. Semua test harus PASS ✅

### Dokumentasi Lengkap:
→ `/⚠️_ERROR_403_TIDAK_PERLU_DIPERBAIKI.md` - **BACA INI DULU**  
→ `/README_ERROR_403.md` - Penjelasan detail tentang error 403  
→ `/⚠️_BACA_INI_TENTANG_ERROR_403.txt` - Quick reference

---

## Fitur Utama Aplikasi

### 7 Modul Bisnis:
1. **Sales** - Customer, Pipeline, Quotation, Sales Order, Delivery
2. **PPIC** - Production Planning & Inventory Control
3. **Production** - Manufacturing execution
4. **Procurement** - Purchase management
5. **Warehouse** - Inventory & stock management
6. **Design** - Product design & specifications
7. **HRGA** - HR, General Affairs & organization

### Teknologi:
- **Frontend**: React + TypeScript + Tailwind CSS
- **Database**: Supabase Cloud (PostgreSQL)
- **Connection**: Direct client-side (no server needed)
- **Security**: Row Level Security (RLS)

### Fitur UI:
- ✅ Light & Dark Mode
- ✅ Responsive Design
- ✅ Industrial Clean Minimalist Design
- ✅ Bahasa Indonesia
- ✅ Role-based Access Control

---

## Quick Start

### 1. Koneksi Supabase
Aplikasi akan otomatis mendeteksi koneksi Supabase saat pertama kali dibuka.

### 2. Navigasi
Gunakan sidebar di kiri untuk mengakses modul-modul:
- **Dashboard** - Overview sistem
- **Sales** - Modul penjualan
- **PPIC** - Planning & control
- **Production** - Produksi
- **Procurement** - Pembelian
- **Warehouse** - Gudang
- **Design** - Desain
- **HRGA** - HR & organization

### 3. Dark Mode
Toggle dark/light mode menggunakan icon di pojok kanan atas.

### 4. System Status
Cek kesehatan sistem di: **`/system-status`**

---

## Dokumentasi Lengkap

### Arsitektur & Teknis:
- `/README_ERROR_403.md` - Penjelasan error 403 deployment
- `/src/app/lib/api.ts` - Client-side API documentation
- `/ATTRIBUTIONS.md` - Credits & licenses

### Modul-Modul:
- Sales: `/src/app/pages/sales/`
- PPIC: `/src/app/pages/ppic/`
- Production: `/src/app/pages/production/`
- Procurement: `/src/app/pages/procurement/`
- Warehouse: `/src/app/pages/warehouse/`
- Design: `/src/app/pages/design/`
- HRGA: `/src/app/pages/hrga/`

---

## Troubleshooting

### Q: Error 403 muncul saat deployment?
**A:** NORMAL dan AMAN diabaikan. Aplikasi tetap berfungsi normal.

### Q: Data tidak muncul?
**A:** 
1. Cek koneksi Supabase di `/system-status`
2. Pastikan Supabase credentials sudah di-set
3. Cek browser console untuk error details

### Q: Dark mode tidak berfungsi?
**A:** Refresh browser (F5) untuk apply perubahan.

### Q: Perlu bantuan?
**A:** 
1. Kunjungi `/system-status` untuk diagnostic
2. Baca `/README_ERROR_403.md` untuk info error 403
3. Check browser console untuk error messages

---

## 🎯 Bottom Line

**APLIKASI BERFUNGSI NORMAL. ABAIKAN ERROR 403. GUNAKAN SEPERTI BIASA.**

Kunjungi `/system-status` untuk verifikasi bahwa semua komponen bekerja dengan baik.

---

**Terakhir diperbarui:** 10 April 2026  
**Versi:** 1.0.0  
**Status:** ✅ Production Ready