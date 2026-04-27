import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useSimpleAuth } from '../contexts/simple-auth-context';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Eye, EyeOff, Lock, User, Factory } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../lib/api';

export function SimpleLogin() {
  const navigate = useNavigate();
  const { signIn, isAuthenticated } = useSimpleAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Login form
  const [loginForm, setLoginForm] = useState({
    identifier: '',
    password: '',
  });

  // Register form
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    nama_user: '',
    confirmPassword: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(loginForm.identifier, loginForm.password);

      if (error) {
        toast.error(error);
      } else {
        navigate('/');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat login');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error('Password dan konfirmasi password tidak sama');
      return;
    }

    if (registerForm.password.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }

    setLoading(true);

    try {
      await api.createSimpleUser({
        username: registerForm.username,
        email: registerForm.email,
        password: registerForm.password,
        nama_user: registerForm.nama_user,
        role: 'staff',
      });

      toast.success('Registrasi berhasil! Silakan login');

      // Reset form dan pindah ke tab login
      setRegisterForm({
        username: '',
        email: '',
        password: '',
        nama_user: '',
        confirmPassword: '',
      });

      // Auto fill login form
      setLoginForm({
        identifier: registerForm.username,
        password: registerForm.password,
      });
    } catch (error: any) {
      toast.error(error.message || 'Gagal mendaftar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Factory className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            ERP Manufaktur
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sistem Manajemen Produksi Kemasan Plastik
          </p>
        </div>

        {/* Login/Register Card */}
        <Card className="shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center">Selamat Datang</CardTitle>
            <CardDescription className="text-center">
              Masuk ke akun Anda atau daftar baru
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Masuk</TabsTrigger>
                <TabsTrigger value="register">Daftar</TabsTrigger>
              </TabsList>

              {/* Tab Login */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="identifier">Username atau Email</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="identifier"
                        type="text"
                        placeholder="Masukkan username atau email"
                        value={loginForm.identifier}
                        onChange={(e) => setLoginForm({ ...loginForm, identifier: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Masukkan password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Memproses...' : 'Masuk'}
                  </Button>

                  <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
                    <p>Default credentials:</p>
                    <p className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded mt-1">
                      admin / admin123
                    </p>
                  </div>
                </form>
              </TabsContent>

              {/* Tab Register */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nama_user">Nama Lengkap *</Label>
                    <Input
                      id="nama_user"
                      type="text"
                      placeholder="Nama lengkap Anda"
                      value={registerForm.nama_user}
                      onChange={(e) => setRegisterForm({ ...registerForm, nama_user: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg_username">Username *</Label>
                    <Input
                      id="reg_username"
                      type="text"
                      placeholder="Username untuk login"
                      value={registerForm.username}
                      onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg_email">Email *</Label>
                    <Input
                      id="reg_email"
                      type="email"
                      placeholder="email@example.com"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg_password">Password *</Label>
                    <div className="relative">
                      <Input
                        id="reg_password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Minimal 6 karakter"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        className="pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Konfirmasi Password *</Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Ulangi password"
                      value={registerForm.confirmPassword}
                      onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Memproses...' : 'Daftar'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>⚠️ Simple Login System - Development Only</p>
          <p className="text-xs mt-1">Password tidak dienkripsi</p>
        </div>
      </div>
    </div>
  );
}