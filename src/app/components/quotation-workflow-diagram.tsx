import { ArrowRight, FileEdit, Send, CheckCircle, XCircle } from 'lucide-react';
import { Card } from './ui/card';

export function QuotationWorkflowDiagram() {
  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Alur Kerja Penawaran Penjualan</h3>

      <div className="space-y-4">
        {/* Workflow Steps */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Step 1: Draft */}
          <div className="flex-1 min-w-[200px]">
            <div className="bg-white border-2 border-gray-300 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 text-gray-700 mb-2">
                <FileEdit className="h-5 w-5" />
                <span className="font-semibold">1. Buat Draft</span>
              </div>
              <p className="text-xs text-gray-600">
                Staff Sales, Manager, Direktur, atau Admin membuat draft penawaran
              </p>
            </div>
          </div>

          <ArrowRight className="h-6 w-6 text-blue-500 flex-shrink-0" />

          {/* Step 2: Submit */}
          <div className="flex-1 min-w-[200px]">
            <div className="bg-white border-2 border-yellow-300 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 text-yellow-700 mb-2">
                <Send className="h-5 w-5" />
                <span className="font-semibold">2. Ajukan Persetujuan</span>
              </div>
              <p className="text-xs text-gray-600">
                Penawaran diajukan untuk ditinjau
              </p>
            </div>
          </div>

          <ArrowRight className="h-6 w-6 text-blue-500 flex-shrink-0" />

          {/* Step 3: Review */}
          <div className="flex-1 min-w-[200px]">
            <div className="bg-white border-2 border-blue-300 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 text-blue-700 mb-2">
                <div className="flex gap-1">
                  <CheckCircle className="h-5 w-5" />
                  <XCircle className="h-5 w-5" />
                </div>
                <span className="font-semibold">3. Tinjau & Putuskan</span>
              </div>
              <p className="text-xs text-gray-600">
                Manager Sales, Direktur, atau Admin menyetujui/menolak
              </p>
            </div>
          </div>
        </div>

        {/* Final Status */}
        <div className="flex items-center gap-3 flex-wrap mt-6">
          <div className="flex-1 min-w-[200px]">
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-700 mb-1">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">Disetujui</span>
              </div>
              <p className="text-xs text-green-600">
                ✓ Dapat digunakan untuk pesanan penjualan
              </p>
            </div>
          </div>

          <div className="flex-1 min-w-[200px]">
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-700 mb-1">
                <XCircle className="h-5 w-5" />
                <span className="font-semibold">Ditolak</span>
              </div>
              <p className="text-xs text-red-600">
                ✗ Tidak dapat digunakan (perlu revisi)
              </p>
            </div>
          </div>
        </div>

        {/* Permissions Info */}
        <div className="mt-6 pt-6 border-t border-blue-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Yang Dapat Membuat Draft:</h4>
              <ul className="space-y-1 text-gray-700">
                <li>• Staff Sales</li>
                <li>• Manager Sales</li>
                <li>• Direktur</li>
                <li>• Admin</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Yang Dapat Menyetujui/Menolak:</h4>
              <ul className="space-y-1 text-gray-700">
                <li>• Manager Sales</li>
                <li>• Direktur</li>
                <li>• Admin</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
