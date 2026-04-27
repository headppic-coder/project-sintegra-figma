import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { UserPlus, CheckCircle } from 'lucide-react';
import { api } from '../lib/api';
import { toast } from 'sonner';

interface CreateManagerHelperProps {
  onSuccess?: () => void;
}

export function CreateManagerHelper({ onSuccess }: CreateManagerHelperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    nama_user: '',
  });

  const handleCreate = async () => {
    if (!formData.username || !formData.email || !formData.password || !formData.nama_user) {
      toast.error('Semua field harus diisi');
      return;
    }

    try {
      setLoading(true);
      await api.createSimpleUser({
        ...formData,
        role: 'manager_sales',
      });

      toast.success('User Manager Sales berhasil dibuat!');
      setFormData({ username: '', email: '', password: '', nama_user: '' });
      setIsOpen(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating manager:', error);
      toast.error(error.message || 'Gagal membuat user Manager Sales');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Card className="p-4 bg-green-50 border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-green-900">Belum Ada Manager Sales?</h3>
            <p className="text-sm text-green-800">
              Buat user dengan role Manager Sales untuk dapat menyetujui penawaran
            </p>
          </div>
          <Button
            onClick={() => setIsOpen(true)}
            variant="outline"
            className="border-green-600 text-green-700 hover:bg-green-100"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Buat Manager Sales
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-green-50 border-green-200">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-green-900">Buat User Manager Sales</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
          >
            Tutup
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="manager1"
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="manager@example.com"
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Password minimal 6 karakter"
            />
          </div>

          <div>
            <Label htmlFor="nama_user">Nama Lengkap</Label>
            <Input
              id="nama_user"
              value={formData.nama_user}
              onChange={(e) => setFormData({ ...formData, nama_user: e.target.value })}
              placeholder="John Doe"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-green-100 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-700" />
          <div className="text-sm text-green-800">
            <p className="font-semibold">Role: manager_sales</p>
            <p className="text-xs">User ini akan dapat menyetujui/menolak penawaran penjualan</p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={loading}
          >
            Batal
          </Button>
          <Button
            onClick={handleCreate}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? 'Membuat...' : 'Buat User'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
