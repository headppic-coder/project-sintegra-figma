import { useState, useEffect } from 'react';
import { AlertTriangle, X, ExternalLink } from 'lucide-react';

export function DatabaseSetupBanner() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check connection status after a short delay
    const timer = setTimeout(() => {
      const connected = (window as any).__SUPABASE_CONNECTED__;
      setIsConnected(connected === true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Don't show if connected or dismissed
  if (isConnected === null || isConnected === true || isDismissed) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-sm mb-1">
              ⚠️ Database Belum Terhubung
            </div>
            <div className="text-xs opacity-90 mb-2">
              Error: Failed to fetch dari Supabase. Table database belum dibuat.
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  console.log('%c📝 SETUP DATABASE SUPABASE', 'font-weight: bold; font-size: 18px; color: #3b82f6;');
                  console.log('%c═══════════════════════════════════════', 'color: #6b7280;');
                  console.log('');
                  console.log('%c🎯 QUICK SETUP (2 menit):', 'font-weight: bold; font-size: 14px; color: #10b981;');
                  console.log('');
                  console.log('1️⃣ Buka Supabase Dashboard:');
                  console.log('   → https://supabase.com/dashboard/project/xbzxxzwisotukyvwpqql/sql');
                  console.log('');
                  console.log('2️⃣ Copy & Paste SQL ini ke SQL Editor:');
                  console.log('%c   CREATE TABLE IF NOT EXISTS public.kv_store_6a7942bb (', 'color: #f59e0b;');
                  console.log('%c       key TEXT PRIMARY KEY,', 'color: #f59e0b;');
                  console.log('%c       value JSONB NOT NULL,', 'color: #f59e0b;');
                  console.log('%c       created_at TIMESTAMPTZ DEFAULT NOW(),', 'color: #f59e0b;');
                  console.log('%c       updated_at TIMESTAMPTZ DEFAULT NOW()', 'color: #f59e0b;');
                  console.log('%c   );', 'color: #f59e0b;');
                  console.log('%c   ALTER TABLE public.kv_store_6a7942bb ENABLE ROW LEVEL SECURITY;', 'color: #f59e0b;');
                  console.log('%c   CREATE POLICY "Allow all" ON public.kv_store_6a7942bb FOR ALL USING (true) WITH CHECK (true);', 'color: #f59e0b;');
                  console.log('');
                  console.log('3️⃣ Klik tombol "Run" atau tekan Ctrl+Enter');
                  console.log('');
                  console.log('4️⃣ Refresh halaman aplikasi ini (F5)');
                  console.log('');
                  console.log('%c═══════════════════════════════════════', 'color: #6b7280;');
                  console.log('%c📄 Panduan lengkap: Lihat file SETUP_DATABASE.md di root project', 'color: #3b82f6;');
                  console.log('%c🔗 SQL Migration file: supabase/migrations/20260414000002_create_kv_store_table.sql', 'color: #8b5cf6;');
                  console.log('');
                  alert('✅ Instruksi setup sudah ditampilkan di Console (F12).\n\n📝 Buka Console untuk copy SQL query\n🔗 Atau buka file: SETUP_DATABASE.md');
                }}
                className="inline-flex items-center gap-1 bg-white text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors font-medium"
              >
                <ExternalLink className="w-3 h-3" />
                Cara Setup Database
              </a>
              <a
                href="https://supabase.com/dashboard/project/xbzxxzwisotukyvwpqql/sql"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 bg-white text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors font-medium"
              >
                <ExternalLink className="w-3 h-3" />
                Buka Supabase SQL Editor
              </a>
              <a
                href="/system-status"
                className="inline-flex items-center gap-1 bg-red-700 text-white px-2 py-1 rounded hover:bg-red-800 transition-colors"
              >
                System Status
              </a>
            </div>
          </div>
          <button
            onClick={() => setIsDismissed(true)}
            className="flex-shrink-0 p-1 hover:bg-red-700 rounded transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
