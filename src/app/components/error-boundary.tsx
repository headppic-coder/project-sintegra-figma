import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('❌ ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-12 h-12 text-red-500" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Oops! Terjadi Kesalahan
                </h1>
                <p className="text-gray-600 mb-4">
                  Aplikasi mengalami error yang tidak terduga. Silakan coba reload halaman atau kembali ke dashboard.
                </p>

                {this.state.error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <div className="font-mono text-sm text-red-800 mb-2">
                      <strong>Error:</strong> {this.state.error.toString()}
                    </div>
                    {this.state.errorInfo && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-red-700 hover:text-red-900">
                          Lihat Stack Trace
                        </summary>
                        <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto max-h-64">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </details>
                    )}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button onClick={this.handleReload} className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Reload Halaman
                  </Button>
                  <Button onClick={this.handleGoHome} variant="outline" className="flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    Kembali ke Dashboard
                  </Button>
                </div>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">💡 Tips:</h3>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Coba buka Console browser (tekan F12) untuk melihat error detail</li>
                    <li>Pastikan koneksi internet Anda stabil</li>
                    <li>Pastikan table Supabase sudah dibuat dengan benar</li>
                    <li>Clear browser cache dan coba lagi</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
