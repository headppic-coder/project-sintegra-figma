import { ReactNode } from 'react';
import { usePermission } from '../contexts/permission-context';

interface CanProps {
  permission?: string; // Single permission
  permissions?: string[]; // Multiple permissions
  requireAll?: boolean; // If true, requires ALL permissions. If false, requires ANY permission. Default: false
  fallback?: ReactNode; // Component to show if user doesn't have permission
  children: ReactNode;
}

/**
 * Can Component - Conditional rendering based on permissions
 *
 * Usage Examples:
 *
 * 1. Single Permission:
 *    <Can permission="create-customer">
 *      <Button>Create Customer</Button>
 *    </Can>
 *
 * 2. Multiple Permissions (ANY):
 *    <Can permissions={["edit-customer", "delete-customer"]}>
 *      <Button>Edit or Delete</Button>
 *    </Can>
 *
 * 3. Multiple Permissions (ALL):
 *    <Can permissions={["edit-customer", "delete-customer"]} requireAll={true}>
 *      <Button>Full Access Required</Button>
 *    </Can>
 *
 * 4. With Fallback:
 *    <Can permission="view-customer" fallback={<div>No access</div>}>
 *      <CustomerList />
 *    </Can>
 */
export function Can({ permission, permissions, requireAll = false, fallback = null, children }: CanProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermission();

  // While loading, show nothing (or you can show a loading indicator)
  if (loading) {
    return null;
  }

  // Check single permission
  if (permission) {
    if (!hasPermission(permission)) {
      return <>{fallback}</>;
    }
    return <>{children}</>;
  }

  // Check multiple permissions
  if (permissions && permissions.length > 0) {
    const hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);

    if (!hasAccess) {
      return <>{fallback}</>;
    }
    return <>{children}</>;
  }

  // If no permission specified, show children by default
  return <>{children}</>;
}

/**
 * Cannot Component - Inverse of Can
 * Shows children only if user DOES NOT have the permission
 *
 * Usage:
 * <Cannot permission="delete-customer">
 *   <div>You cannot delete customers</div>
 * </Cannot>
 */
export function Cannot({ permission, permissions, requireAll = false, children }: Omit<CanProps, 'fallback'>) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermission();

  if (loading) {
    return null;
  }

  if (permission) {
    if (hasPermission(permission)) {
      return null;
    }
    return <>{children}</>;
  }

  if (permissions && permissions.length > 0) {
    const hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);

    if (hasAccess) {
      return null;
    }
    return <>{children}</>;
  }

  return <>{children}</>;
}
