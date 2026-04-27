import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../lib/api';
import { useSimpleAuth } from './simple-auth-context';

interface PermissionContextType {
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  loading: boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useSimpleAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user permissions
  const fetchPermissions = async () => {
    if (!isAuthenticated || !user?.username) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userPermissions = await api.getUserPermissions(user.username);
      setPermissions(userPermissions);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  // Refresh permissions manually
  const refreshPermissions = async () => {
    await fetchPermissions();
  };

  // Load permissions when user changes
  useEffect(() => {
    fetchPermissions();
  }, [user, isAuthenticated]);

  // Check if user has a specific permission
  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  // Check if user has any of the given permissions
  const hasAnyPermission = (permList: string[]): boolean => {
    return permList.some(perm => permissions.includes(perm));
  };

  // Check if user has all of the given permissions
  const hasAllPermissions = (permList: string[]): boolean => {
    return permList.every(perm => permissions.includes(perm));
  };

  const value: PermissionContextType = {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    loading,
    refreshPermissions,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermission() {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermission must be used within a PermissionProvider');
  }
  return context;
}
