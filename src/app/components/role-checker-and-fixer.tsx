import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';
import { api } from '../lib/api';
import { toast } from 'sonner';
import { useSimpleAuth } from '../contexts/simple-auth-context';

export function RoleCheckerAndFixer() {
  const { user } = useSimpleAuth();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');

  const handleFixRole = async () => {
    if (!selectedRole || !user?.username) {
      toast.error('Pilih role yang benar');
      return;
    }

    try {
      setLoading(true);
      await api.assignRoleToUser(user.username, selectedRole);
      toast.success('Role berhasil diupdate! Silakan refresh halaman atau logout/login lagi.');

      // Update localStorage
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        const userData = JSON.parse(currentUser);
        userData.role = selectedRole;
        localStorage.setItem('currentUser', JSON.stringify(userData));
      }

      // Reload page after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast.error(error.message || 'Gagal update role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 bg-orange-50 border-orange-300">
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-orange-900">Role Tidak Sesuai?</h3>
            <p className="text-sm text-orange-800 mt-1">
              Jika Anda seharusnya bisa menyetujui penawaran tapi tidak bisa, kemungkinan format role Anda salah.
            </p>
            <div className="mt-2 p-2 bg-white rounded border border-orange-200">
              <p className="text-xs font-semibold text-gray-700">Role Anda Saat Ini:</p>
              <p className="text-sm font-mono bg-orange-100 px-2 py-1 rounded inline-block mt-1">
                {user?.role || 'Tidak ada role'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Pilih Role yang Benar:
            </label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Pilih role..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manager_sales">manager_sales (Manager Sales)</SelectItem>
                <SelectItem value="sales_manager">sales_manager (Sales Manager)</SelectItem>
                <SelectItem value="direktur">direktur (Direktur)</SelectItem>
                <SelectItem value="director">director (Director)</SelectItem>
                <SelectItem value="admin">admin (Admin)</SelectItem>
                <SelectItem value="super-admin">super-admin (Super Admin)</SelectItem>
                <SelectItem value="staff_sales">staff_sales (Staff Sales)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleFixRole}
            disabled={loading || !selectedRole}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Update Role
              </>
            )}
          </Button>
        </div>

        <div className="text-xs text-orange-700 bg-orange-100 p-2 rounded">
          <strong>Catatan:</strong> Setelah update role, halaman akan refresh otomatis.
          Jika masih belum berubah, coba logout dan login kembali.
        </div>
      </div>
    </Card>
  );
}
