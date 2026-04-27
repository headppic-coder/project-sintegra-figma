import { Navigate } from 'react-router';
import { useSimpleAuth } from '../contexts/simple-auth-context';

interface SimpleProtectedRouteProps {
  children: React.ReactNode;
}

export function SimpleProtectedRoute({ children }: SimpleProtectedRouteProps) {
  try {
    const { isAuthenticated, loading } = useSimpleAuth();

    if (loading) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
  } catch (error) {
    // If context is not available, redirect to login
    console.error('Auth context error:', error);
    return <Navigate to="/login" replace />;
  }
}