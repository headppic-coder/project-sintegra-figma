// Pre-import @supabase/functions-js to ensure it's bundled
import '@supabase/functions-js';

import { createRoot } from 'react-dom/client';
import App from './app/App';
import './styles/index.css';

// Production environment check
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

// Display startup message
console.log(
  `%c✅ ERP System Ready${isProduction ? ' (Production)' : ' (Development)'}`,
  'color: #10b981; font-weight: bold;'
);

if (isProduction) {
  console.log('%c🌐 Running on Figma Make Production', 'color: #3b82f6;');
  console.log('%c📝 Run testProduction() in console to verify all features', 'color: #8b5cf6;');

  // Add production test helper to window
  (window as any).testProduction = async () => {
    console.log('🧪 Testing Production Environment...\n');

    const tests = [
      { name: 'Supabase Connection', check: () => (window as any).__SUPABASE_CONNECTED__ === true },
      { name: 'Supabase Client', check: () => !!(window as any).__SUPABASE_CLIENT__ },
      { name: 'Database URL', check: () => !!(window as any).__SUPABASE_URL__ },
    ];

    console.table(tests.map(t => ({
      Test: t.name,
      Result: t.check() ? '✅ PASS' : '❌ FAIL'
    })));

    console.log('\n📊 For detailed status, visit: /system-status');
  };
}

// Render app
createRoot(document.getElementById('root')!).render(<App />);