# 📚 Supabase Database Documentation

Dokumentasi lengkap untuk database PostgreSQL sistem ERP Packaging Management.

---

## 📖 Daftar Dokumentasi

### 1. **DATABASE_STRUCTURE.md** 📊
Dokumentasi overview struktur database dengan penjelasan setiap schema dan tabel.

**Isi:**
- Overview database PostgreSQL
- Penjelasan 9 schema (master, sales, production, dll)
- Database features (RLS, triggers, functions)
- Migration files overview
- Best practices

**Kapan Update:**
- Saat menambah schema baru
- Saat menambah tabel baru di schema existing
- Saat menambah/mengubah database features
- Saat ada perubahan major di struktur

---

### 2. **COMPLETE_SCHEMA_MAPPING.md** 🗺️
Mapping lengkap antara menu/fitur aplikasi dengan tabel database.

**Isi:**
- Mapping menu → tables untuk setiap modul
- Total tables per schema
- Migration file references
- Summary statistics

**Kapan Update:**
- Saat menambah menu baru
- Saat menambah tabel baru
- Saat mengubah relasi menu-tabel
- Saat menambah detail tables

**Contoh Update:**
```markdown
| **Pipeline** | `sales.pipeline`<br>`sales.pipeline_follow_ups`<br>`sales.pipeline_logs` | sales | 15, 17 |
```

---

### 3. **PIPELINE_SCHEMA.md** 📝
Dokumentasi detail untuk tabel `sales.pipeline`.

**Isi:**
- Struktur kolom lengkap dengan tipe data
- Enum values untuk setiap field
- Indexes dan foreign keys
- Relasi ke tabel lain
- Contoh query SQL
- TypeScript interfaces
- Best practices

**Kapan Update:**
- **SETIAP KALI** ada perubahan di tabel pipeline
- Menambah/menghapus kolom
- Mengubah tipe data
- Menambah constraint atau index
- Mengubah relasi foreign key

**Template untuk Tabel Lain:**
File ini bisa dijadikan template untuk mendokumentasikan tabel lain yang kompleks.

---

### 4. **PIPELINE_FOLLOWUP_SCHEMA.md** 🔄
Dokumentasi detail untuk tabel `sales.pipeline_follow_ups`.

**Isi:**
- Struktur kolom follow-up
- Indexes dan triggers
- Auto-generate follow-up number
- Contoh query dan integration

**Kapan Update:**
- Saat ada perubahan di tabel pipeline_follow_ups
- Menambah field baru
- Mengubah business logic

---

### 5. **CHANGELOG_PIPELINE_SCHEMA.md** 📅
Log perubahan (change log) khusus untuk schema pipeline.

**Isi:**
- Version history (1.0, 1.1, 1.2, dst)
- Detail perubahan per version
- Migration SQL untuk setiap perubahan
- Impact analysis
- Testing checklist
- Rollback plan

**Kapan Update:**
- **WAJIB setiap kali** ada perubahan schema pipeline
- Format: tambah section version baru di atas
- Catat tanggal dan detail perubahan
- Include migration SQL dan testing checklist

**Format Version Baru:**
```markdown
## 📅 Version 1.3 - 2026-04-XX

### ✅ Penambahan Kolom Baru
...

### 🔄 Perubahan Layout
...

### 📊 Impact Analysis
...
```

---

### 6. **CONTOH_KODE_PRAKTIS.md** 💻
Kumpulan contoh kode praktis untuk query database.

**Isi:**
- Setup Supabase client
- CRUD operations untuk setiap tabel
- Contoh query dengan joins
- Real-time subscriptions
- TypeScript service classes

**Kapan Update:**
- Saat ada best practice baru
- Saat menambah endpoint API baru
- Saat ada pattern query yang sering dipakai

---

### 7. **DIAGRAM_RELATIONSHIPS.md** 🔗
Diagram ERD dan relasi antar tabel.

**Isi:**
- Entity Relationship Diagrams
- Foreign key relationships
- Cascade behaviors
- Cross-schema relationships

**Kapan Update:**
- Saat menambah tabel dengan foreign key
- Saat mengubah relasi antar tabel
- Saat menambah cascade behavior

---

### 8. **QUICK_REFERENCE.md** ⚡
Quick reference untuk developer.

**Isi:**
- Cheat sheet table names
- Common queries
- Enum values
- Status values

**Kapan Update:**
- Saat ada table/field yang sering dipakai
- Saat ada enum values baru

---

## 🔄 Workflow Update Dokumentasi

### Scenario 1: Menambah Kolom Baru di Tabel Existing

**Contoh:** Menambah kolom `estimasi_harga` di `sales.pipeline`

**Step 1:** Update Schema Documentation
```markdown
File: /supabase/PIPELINE_SCHEMA.md

Tambahkan di section "Struktur Kolom":
| `estimasi_harga` | NUMERIC(15,2) | YES | Estimasi nilai deal dalam Rupiah |
```

**Step 2:** Update Change Log
```markdown
File: /supabase/CHANGELOG_PIPELINE_SCHEMA.md

## 📅 Version 1.2 - 2026-04-14

### ✅ Penambahan Kolom Baru
- estimasi_harga (NUMERIC 15,2)

**Migration SQL:**
ALTER TABLE sales.pipeline
ADD COLUMN estimasi_harga NUMERIC(15,2);
```

**Step 3:** Update Database Structure (jika perlu)
```markdown
File: /supabase/DATABASE_STRUCTURE.md

Update section sales schema jika ada perubahan signifikan
```

**Step 4:** Update Schema Mapping
```markdown
File: /supabase/COMPLETE_SCHEMA_MAPPING.md

Update note di tabel pipeline:
- `sales.pipeline` - Main pipeline data (v1.2: added estimasi_harga)
```

---

### Scenario 2: Menambah Tabel Baru

**Contoh:** Menambah tabel `sales.pipeline_logs`

**Step 1:** Buat Dokumentasi Tabel Baru
```markdown
File: /supabase/PIPELINE_LOGS_SCHEMA.md (new file)

# Pipeline Logs Schema Documentation
...
```

**Step 2:** Update Schema Mapping
```markdown
File: /supabase/COMPLETE_SCHEMA_MAPPING.md

| **Pipeline** | `sales.pipeline`<br>`sales.pipeline_logs` | sales | 15, 17 |
```

**Step 3:** Update Database Structure
```markdown
File: /supabase/DATABASE_STRUCTURE.md

**Tables:**
- `pipeline_logs` - Log histori perubahan pipeline
```

**Step 4:** Update Change Log
```markdown
File: /supabase/CHANGELOG_PIPELINE_SCHEMA.md

### ✅ Tabel Baru
- `sales.pipeline_logs` untuk auto-logging
```

---

### Scenario 3: Mengubah Layout/UI (Tanpa Schema Change)

**Contoh:** Memindahkan kolom PIC Sales ke posisi lain

**Step 1:** Update Schema Documentation
```markdown
File: /supabase/PIPELINE_SCHEMA.md

Update section "Perubahan Schema (Change Log)":
### Version 1.2 - 2026-04-14
**Perubahan Display:**
- ✅ Kolom "PIC Sales" dipindah ke kolom kanan
```

**Step 2:** Update Change Log
```markdown
File: /supabase/CHANGELOG_PIPELINE_SCHEMA.md

### 🔄 Perubahan Layout Detail Informasi Pipeline
- PIC Sales dipindah dari kolom kiri ke kanan
```

**Catatan:** Perubahan UI/layout tetap perlu didokumentasikan untuk history tracking.

---

## ✅ Checklist Update Dokumentasi

### Minimal (Wajib)
- [ ] Update schema documentation file (e.g., PIPELINE_SCHEMA.md)
- [ ] Update change log (CHANGELOG_PIPELINE_SCHEMA.md)
- [ ] Tambah migration SQL di change log
- [ ] Update tanggal "Last Updated"

### Recommended
- [ ] Update COMPLETE_SCHEMA_MAPPING.md
- [ ] Update DATABASE_STRUCTURE.md (jika major change)
- [ ] Update contoh query di CONTOH_KODE_PRAKTIS.md
- [ ] Update diagram jika ada relasi baru

### Optional
- [ ] Tambah contoh use case
- [ ] Update best practices
- [ ] Tambah troubleshooting guide

---

## 📋 Template Change Log Entry

```markdown
## 📅 Version X.Y - YYYY-MM-DD

### ✅ Penambahan Kolom Baru

| Kolom | Tipe | Nullable | Deskripsi | Alasan |
|-------|------|----------|-----------|--------|
| `field_name` | VARCHAR(50) | YES | Deskripsi | Kenapa ditambahkan |

**Migration SQL:**
```sql
ALTER TABLE schema.table_name
ADD COLUMN field_name VARCHAR(50);
```

### ❌ Penghapusan Kolom

| Kolom | Tipe | Alasan |
|-------|------|--------|
| `old_field` | VARCHAR | Redundant |

### 🔄 Perubahan Layout/UI

**Detail Informasi:**
- ✅ Kolom X dipindah dari A ke B
- ❌ Kolom Y dihapus dari tampilan

### 📊 Impact Analysis

**Database:**
- ✅ Backward compatible
- ❌ Breaking change (explain)

**Frontend:**
- ✅ Form updated
- ✅ Detail view updated

**Backend/API:**
- ✅ No breaking change

### 🧪 Testing Checklist

- [ ] Create record with new field
- [ ] Update existing record
- [ ] Check log histori
- [ ] Test rollback plan
```

---

## 🎯 Best Practices

### 1. Update Documentation BEFORE Push Code
```
❌ Bad: Code → Deploy → (forget documentation)
✅ Good: Code → Update Docs → Review → Deploy
```

### 2. Be Specific in Change Logs
```
❌ Bad: "Update pipeline table"
✅ Good: "Add estimasi_harga (NUMERIC 15,2) for revenue projection"
```

### 3. Include Migration SQL
Selalu include migration SQL yang bisa langsung di-copy-paste:
```sql
-- ✅ Good: Ready to use
ALTER TABLE sales.pipeline
ADD COLUMN estimasi_harga NUMERIC(15,2);

COMMENT ON COLUMN sales.pipeline.estimasi_harga 
IS 'Estimasi nilai deal dalam Rupiah';
```

### 4. Document Why, Not Just What
```
❌ Bad: "Added field X"
✅ Good: "Added field X to enable revenue forecasting in dashboard"
```

### 5. Keep Versions Incremental
```
1.0 → Initial
1.1 → Minor changes (add field, UI change)
1.2 → Minor changes
2.0 → Major restructure
```

### 6. Update TypeScript Interfaces
Jika schema berubah, update juga interface TypeScript di dokumentasi:
```typescript
interface Pipeline {
  // ... existing fields
  estimasiHarga?: string; // ← Added in v1.2
}
```

---

## 🔍 Finding Documentation

### By Table Name
- Pipeline: `PIPELINE_SCHEMA.md`, `CHANGELOG_PIPELINE_SCHEMA.md`
- Follow-ups: `PIPELINE_FOLLOWUP_SCHEMA.md`
- All tables: `COMPLETE_SCHEMA_MAPPING.md`

### By Module
- Sales: See "Sales Module" section in `COMPLETE_SCHEMA_MAPPING.md`
- Production: See "Production Module" section
- etc.

### By Feature
- RLS Policies: `DATABASE_STRUCTURE.md` → "Row Level Security"
- Triggers: `DATABASE_STRUCTURE.md` → "Database Functions"
- Relationships: `DIAGRAM_RELATIONSHIPS.md`

---

## 🚨 Important Notes

1. **Always update docs when schema changes** - No exception!
2. **Include rollback plan** - In case something goes wrong
3. **Test before documenting** - Document what actually works
4. **Version numbers matter** - Keep them sequential
5. **Date everything** - Helps track timeline
6. **Be detailed** - Future you will thank you

---

## 📞 Questions?

Jika ada pertanyaan tentang dokumentasi:
1. Check existing docs first
2. Look at similar tables for examples
3. Ask development team lead
4. Update this README if you find gaps

---

**Maintained by:** ERP Development Team  
**Last Updated:** 2026-04-14  
**Documentation Version:** 2.0
