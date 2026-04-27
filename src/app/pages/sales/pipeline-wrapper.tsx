import { useNavigate, useLocation, Outlet } from 'react-router';
import { Button } from '../../components/ui/button';

const PIPELINE_TABS = [
  { label: 'Pipeline', path: '/sales/pipeline' },
  { label: 'Customer Pipeline', path: '/sales/pipeline/customer-pipeline' },
  { label: 'Sales Activity', path: '/sales/pipeline/sales-activity' },
  { label: 'Activity by Type', path: '/sales/pipeline/activity-by-type' },
  { label: 'Klaim BBM', path: '/sales/pipeline/klaim-bbm' },
  { label: 'Log Histori', path: '/sales/pipeline/log-histori' },
];

export function PipelineWrapper() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActiveTab = (path: string) => {
    if (path === '/sales/pipeline') {
      return location.pathname === path ||
             location.pathname.startsWith('/sales/pipeline/new') ||
             location.pathname.startsWith('/sales/pipeline/detail/') ||
             (location.pathname.match(/^\/sales\/pipeline\/[^/]+$/) && !PIPELINE_TABS.some(tab => tab.path === location.pathname));
    }
    return location.pathname === path;
  };

  return (
    <div className="space-y-4">
      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 -mx-6 px-6">
        <div className="flex gap-1">
          {PIPELINE_TABS.map((tab) => (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                isActiveTab(tab.path)
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <Outlet />
    </div>
  );
}
