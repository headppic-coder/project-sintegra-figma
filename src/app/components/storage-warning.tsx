import { useState, useEffect } from 'react';
import { Database, CheckCircle2, AlertTriangle, ExternalLink, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export function StorageWarning() {
  const [show, setShow] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const sqlCommand = `CREATE TABLE IF NOT EXISTS kv_store_6a7942bb (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE kv_store_6a7942bb DISABLE ROW LEVEL SECURITY;`;
  const dashboardUrl = 'https://supabase.com/dashboard/project/xbzxxzwisotukyvwpqql/editor';

  useEffect(() => {
    // Check connection status
    const checkStatus = () => {
      const connected = (window as any).__SUPABASE_CONNECTED__;
      const error = (window as any).__SUPABASE_ERROR__;
      
      if (connected === false) {
        setIsConnected(false);
        setErrorMessage(error || 'Unknown error');
        setShow(true);
      } else if (connected === true) {
        setIsConnected(true);
        setShow(true);
        // Auto hide success message after 5 seconds
        setTimeout(() => setShow(false), 5000);
      }
    };

    // Check immediately
    setTimeout(checkStatus, 100);

    // Check again after 2 seconds (after health check completes)
    const timer = setTimeout(checkStatus, 2000);

    return () => clearTimeout(timer);
  }, []);

  const copyToClipboard = () => {
    // Fallback method for environments where Clipboard API is blocked
    const textarea = document.createElement('textarea');
    textarea.value = sqlCommand;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
      document.execCommand('copy');
      setCopied(true);
      toast.success('SQL command copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy. Please copy manually.');
    } finally {
      document.body.removeChild(textarea);
    }
  };

  if (!show) {
    return null;
  }

  // Success - Connected to Supabase
  if (isConnected) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-2.5 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-semibold text-sm flex items-center gap-2">
              <Database className="w-4 h-4" />
              Terkoneksi ke Supabase Cloud Database
            </div>
            <div className="text-xs opacity-90">
              Semua data tersimpan secara persisten di cloud
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error - Cannot connect to Supabase
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-0.5 animate-pulse" />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-base mb-2">
              🚨 Tidak Dapat Terhubung ke Supabase Database
            </div>
            
            <div className="bg-white/10 rounded-lg p-3 mb-3 backdrop-blur-sm">
              <div className="text-xs font-semibold mb-1">Error Detail:</div>
              <div className="text-xs opacity-95 font-mono bg-black/20 px-2 py-1 rounded">
                {errorMessage.includes('Failed to fetch') 
                  ? 'Network error / CORS blocked / RLS policy blocking request'
                  : errorMessage}
              </div>
            </div>

            <div className="bg-yellow-500/20 border border-yellow-400/50 rounded-lg p-3 mb-3">
              <div className="font-bold text-sm mb-2 flex items-center gap-2">
                🔧 Langkah-langkah Fix (WAJIB):
              </div>
              <ol className="text-xs space-y-2 ml-4 list-decimal">
                <li>
                  <strong>Buka Supabase Dashboard</strong>
                  <button 
                    onClick={() => window.open(dashboardUrl, '_blank')}
                    className="ml-2 inline-flex items-center gap-1 underline hover:no-underline font-bold bg-white/20 px-2 py-0.5 rounded"
                  >
                    Klik di sini <ExternalLink className="w-3 h-3" />
                  </button>
                </li>
                <li>
                  <strong>Klik "SQL Editor"</strong> di menu sidebar kiri → Klik <strong>"New query"</strong>
                </li>
                <li>
                  <strong>Copy & Paste SQL command ini:</strong>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="flex-1 bg-black/30 px-2 py-1.5 rounded font-mono text-[11px] text-green-300">
                      {sqlCommand}
                    </code>
                    <button
                      onClick={copyToClipboard}
                      className="bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors flex items-center gap-1"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span className="text-[10px]">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span className="text-[10px]">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </li>
                <li>
                  <strong>Klik tombol "RUN"</strong> (atau tekan Ctrl+Enter)
                </li>
                <li>
                  <strong>Tunggu sampai muncul "Success"</strong>
                </li>
                <li>
                  <strong>Refresh halaman ini</strong> (tekan F5 atau Ctrl+R)
                </li>
              </ol>
            </div>

            <div className="text-xs opacity-90">
              💡 <strong>Kenapa error ini terjadi?</strong> Row Level Security (RLS) di Supabase secara default memblokir semua akses ke database. SQL command di atas akan menonaktifkan RLS untuk tabel yang digunakan aplikasi ini.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}