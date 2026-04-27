import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';
import { ErrorBoundary } from './components/error-boundary';
import { ThemeProvider } from './contexts/theme-context';
import { SimpleAuthProvider } from './contexts/simple-auth-context';
import { PermissionProvider } from './contexts/permission-context';
import { DatabaseSetupBanner } from './components/database-setup-banner';

// Import development helpers (only loaded in development)
if (import.meta.env.DEV) {
  import('../utils/seed-opsi-harga');
}

export default function App() {
  return (
    <ErrorBoundary>
      <SimpleAuthProvider>
        <PermissionProvider>
          <ThemeProvider>
            <DatabaseSetupBanner />
            <RouterProvider router={router} />
            <Toaster position="top-right" duration={4000} richColors closeButton />
          </ThemeProvider>
        </PermissionProvider>
      </SimpleAuthProvider>
    </ErrorBoundary>
  );
}