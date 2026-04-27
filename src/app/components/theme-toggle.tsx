import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/theme-context';
import { Button } from './ui/button';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="h-10 w-10 p-0"
      title={theme === 'light' ? 'Aktifkan Dark Mode' : 'Aktifkan Light Mode'}
    >
      {theme === 'light' ? (
        <Moon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
      ) : (
        <Sun className="h-5 w-5 text-yellow-500" />
      )}
    </Button>
  );
}
