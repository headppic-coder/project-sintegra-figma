import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '../lib/api';
import { toast } from 'sonner';

interface UserData {
  id: string;
  username: string;
  email: string;
  nama_user: string;
  employee_id: string | null;
  role: string;
  employee_code?: string;
  full_name?: string;
}

interface SimpleAuthContextType {
  user: UserData | null;
  loading: boolean;
  signIn: (identifier: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => void;
  isAuthenticated: boolean;
}

const SimpleAuthContext = createContext<SimpleAuthContextType | undefined>(undefined);

interface SimpleAuthProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = 'currentUser';

export function SimpleAuthProvider({ children }: SimpleAuthProviderProps) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize - check localStorage for existing session
  useEffect(() => {
    const checkSession = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const userData = JSON.parse(stored);
          setUser(userData);
        }
      } catch (error) {
        console.error('Error reading session:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
      setLoading(false);
    };

    checkSession();

    // Seed default admin user on first load
    api.seedDefaultAdmin();
  }, []);

  // Sign in
  const signIn = async (identifier: string, password: string) => {
    try {
      const result = await api.simpleLogin(identifier, password);

      if (!result.success) {
        return { error: result.error || 'Login gagal' };
      }

      // Save user to state and localStorage
      setUser(result.user!);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(result.user));

      toast.success('Login berhasil!');
      return { error: null };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { error: error.message || 'Terjadi kesalahan' };
    }
  };

  // Sign out
  const signOut = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    toast.success('Logout berhasil');
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!user,
  };

  return <SimpleAuthContext.Provider value={value}>{children}</SimpleAuthContext.Provider>;
}

export function useSimpleAuth() {
  const context = useContext(SimpleAuthContext);
  if (context === undefined) {
    console.error('⚠️ useSimpleAuth called outside of SimpleAuthProvider');
    // Return a default context instead of throwing in production
    return {
      user: null,
      loading: false,
      signIn: async () => ({ error: 'Auth not available' }),
      signOut: () => {},
      isAuthenticated: false,
    };
  }
  return context;
}