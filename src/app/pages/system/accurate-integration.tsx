import { PageHeader } from '../../components/page-header';
import { Settings } from 'lucide-react';

export default function AccurateIntegration() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Integrasi Accurate Online"
        description="Sinkronisasi data antara ERP Manufacturing dan Accurate Online"
        icon={Settings}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'System' },
          { label: 'Accurate Integration' },
        ]}
      />

      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <div className="text-yellow-600 text-2xl">⚠️</div>
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-900 mb-2">Dependencies Belum Terinstall</h3>
            <p className="text-sm text-yellow-800 mb-3">
              Untuk menggunakan fitur integrasi Accurate Online, install dependencies berikut:
            </p>
            <div className="bg-yellow-100 p-3 rounded border border-yellow-300 mb-2">
              <code className="text-sm font-mono">pnpm install axios crypto-js</code>
            </div>
            <div className="bg-yellow-100 p-3 rounded border border-yellow-300 mb-3">
              <code className="text-sm font-mono">pnpm install -D @types/crypto-js</code>
            </div>
            <p className="text-xs text-yellow-700 mt-2">
              Setelah install, restart dev server dengan: <code className="bg-yellow-100 px-1 rounded">pnpm dev</code>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold mb-2">📚 Dokumentasi</h3>
        <p className="text-sm text-blue-900 mb-3">
          Lihat dokumentasi lengkap integrasi Accurate Online di file:
        </p>
        <ul className="space-y-2 text-sm">
          <li>
            <code className="bg-white px-3 py-1 rounded border border-blue-300">
              INSTALL_ACCURATE.md
            </code>
            <span className="text-blue-800 ml-2">- Panduan instalasi</span>
          </li>
          <li>
            <code className="bg-white px-3 py-1 rounded border border-blue-300">
              ACCURATE_QUICK_START.md
            </code>
            <span className="text-blue-800 ml-2">- Quick start guide</span>
          </li>
          <li>
            <code className="bg-white px-3 py-1 rounded border border-blue-300">
              docs/ACCURATE_INTEGRATION.md
            </code>
            <span className="text-blue-800 ml-2">- Dokumentasi lengkap</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
