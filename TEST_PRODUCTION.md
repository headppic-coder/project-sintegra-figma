# 🧪 Test Production Access

## Quick Test Commands

Buka Console browser (F12) dan jalankan command ini untuk test production:

### 1. Test Connection
```javascript
// Cek status koneksi
console.log('Connected:', window.__SUPABASE_CONNECTED__);
console.log('URL:', window.__SUPABASE_URL__);
console.log('Client:', window.__SUPABASE_CLIENT__);
```

### 2. Test Database Read
```javascript
// Test baca data dari Supabase
window.__SUPABASE_CLIENT__
  .from('kv_store_6a7942bb')
  .select('*')
  .limit(5)
  .then(result => console.log('Data:', result));
```

### 3. Test Database Write
```javascript
// Test tulis data ke Supabase
window.__SUPABASE_CLIENT__
  .from('kv_store_6a7942bb')
  .upsert({ 
    key: 'test:production', 
    value: { tested: true, timestamp: new Date().toISOString() }
  })
  .then(result => console.log('Write Result:', result));
```

### 4. Test API Functions
```javascript
// Import API dari window (jika exposed)
// Atau test lewat UI langsung:
// 1. Buka halaman Customers
// 2. Klik "Tambah Customer"
// 3. Isi form dan Save
// 4. Lihat console untuk response
```

## Expected Results

### ✅ Success Indicators:
- Console shows: `✅ Supabase Connected`
- `__SUPABASE_CONNECTED__ = true`
- Data loads di tabel-tabel
- Form save berhasil tanpa error
- No CORS errors
- No 403/401 auth errors

### ❌ Error Indicators:
- Console shows: `❌ Supabase Connection Error`
- `__SUPABASE_CONNECTED__ = false`
- CORS errors
- Network timeout
- 401/403 authentication errors

## Debugging Production Issues

### Check 1: Network Tab
1. Tekan F12 → Network tab
2. Filter: XHR/Fetch
3. Cari request ke `xbzxxzwisotukyvwpqql.supabase.co`
4. Status harus 200 OK

### Check 2: Console Logs
Look for:
- `✅ ERP System Ready (Production)`
- `🌐 Running on Figma Make Production`
- `✅ Supabase Connected`

### Check 3: Application Tab
1. F12 → Application tab
2. Local Storage → Check for Supabase keys
3. Should be empty (no auth session)

## Common Issues & Solutions

### Issue: "Failed to fetch"
**Cause**: Network/CORS issue
**Solution**: 
- Check internet connection
- Verify Supabase project is active
- Check https://status.supabase.com

### Issue: "403 Forbidden"
**Cause**: RLS policies blocking access
**Solution**:
- Login to Supabase dashboard
- Go to Authentication → Policies
- Ensure table `kv_store_6a7942bb` allows public access
- Or temporarily disable RLS for testing

### Issue: "Table doesn't exist"
**Cause**: Table belum dibuat
**Solution**:
```sql
-- Run di Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS kv_store_6a7942bb (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

-- Enable RLS
ALTER TABLE kv_store_6a7942bb ENABLE ROW LEVEL SECURITY;

-- Allow public access (for testing)
CREATE POLICY "Allow public read" ON kv_store_6a7942bb
  FOR SELECT USING (true);

CREATE POLICY "Allow public write" ON kv_store_6a7942bb
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON kv_store_6a7942bb
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete" ON kv_store_6a7942bb
  FOR DELETE USING (true);
```

### Issue: Data tidak muncul
**Cause**: Belum ada data di database
**Solution**:
- Buka aplikasi dan tambah data manual
- Atau seed data via SQL:
```sql
INSERT INTO kv_store_6a7942bb (key, value)
VALUES 
  ('test:1', '{"message": "Test data 1"}'::jsonb),
  ('test:2', '{"message": "Test data 2"}'::jsonb);
```

## Performance Testing

### Measure Load Time:
```javascript
performance.mark('app-start');
// ... app loads ...
performance.mark('app-loaded');
performance.measure('load-time', 'app-start', 'app-loaded');
console.log(performance.getEntriesByName('load-time'));
```

### Measure API Response:
```javascript
async function testAPISpeed() {
  const start = performance.now();
  await window.__SUPABASE_CLIENT__
    .from('kv_store_6a7942bb')
    .select('*')
    .limit(1);
  const end = performance.now();
  console.log(`API Response Time: ${end - start}ms`);
}
testAPISpeed();
```

## Success Criteria ✅

Your production is ready when:

- [ ] ✅ App loads without errors
- [ ] ✅ Console shows green checkmarks
- [ ] ✅ Data loads from Supabase
- [ ] ✅ CRUD operations work (Create, Read, Update, Delete)
- [ ] ✅ No CORS errors
- [ ] ✅ No authentication errors
- [ ] ✅ All pages accessible
- [ ] ✅ Forms can submit successfully
- [ ] ✅ Response time < 2 seconds

## 🎯 Quick Validation

Paling cepat: Buka `/system-status` page dan lihat semua test PASS!
