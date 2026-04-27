import { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { usePermission } from '../contexts/permission-context';
import { Card } from './ui/card';
import { AlertCircle } from 'lucide-react';

interface PermissionProtectedRouteProps {
  permission?: string; // Single permission required
  permissions?: string[]; // Multiple permissions
  requireAll?: boolean; // If true, requires ALL permissions. If false, requires ANY permission
  children: ReactNode;
  redirectTo?: string; // Where to redirect if no permission (default: /403)
  fallback?: ReactNode; // Custom fallback component
}

/**
 * PermissionProtectedRoute - Protects routes based on permissions
 *
 * Usage Examples:
 *
 * 1. Single Permission:
 *    <PermissionProtectedRoute permission="view-customer">
 *      <CustomerPage />
 *    </PermissionProtectedRoute>
 *
 * 2. Multiple Permissions (ANY):
 *    <PermissionProtectedRoute permissions={["edit-customer", "delete-customer"]}>
 *      <CustomerEditPage />
 *    </PermissionProtectedRoute>
 *
 * 3. Multiple Permissions (ALL):
 *    <PermissionProtectedRoute permissions={["manage-users", "manage-roles"]} requireAll={true}>
 *      <AdminSettingsPage />
 *    </PermissionProtectedRoute>
 *
 * 4. Custom Redirect:
 *    <PermissionProtectedRoute permission="view-reports" redirectTo="/dashboard">
 *      <ReportsPage />
 *    </PermissionProtectedRoute>
 */
export function PermissionProtectedRoute({
  permission,
  permissions,
  requireAll = false,
  children,
  redirectTo,
  fallback
}: PermissionProtectedRouteProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermission();

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Check single permission
  if (permission) {
    if (!hasPermission(permission)) {
      return fallback ? <>{fallback}</> : <AccessDenied redirectTo={redirectTo} />;
    }
    return <>{children}</>;
  }

  // Check multiple permissions
  if (permissions && permissions.length > 0) {
    const hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);

    if (!hasAccess) {
      return fallback ? <>{fallback}</> : <AccessDenied redirectTo={redirectTo} />;
    }
    return <>{children}</>;
  }

  // If no permission specified, allow access
  return <>{children}</>;
}

// Default Access Denied component
function AccessDenied({ redirectTo }: { redirectTo?: string }) {
  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="max-w-md w-full p-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-muted-foreground">
            Please contact your administrator if you believe this is a mistake.
          </p>
        </div>
      </Card>
    </div>
  );
}
