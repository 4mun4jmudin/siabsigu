// resources/js/components/ThemeToggle.jsx
import React from 'react';
import { useTheme } from '../ThemeProvider';

export default function ThemeToggle() {
  const { themeName, setThemeName } = useTheme();

  return (
    <div className="inline-flex items-center gap-2">
      <button
        onClick={() => setThemeName('neutral')}
        className={`rounded-full px-3 py-2 text-sm font-medium ${themeName === 'neutral' ? 'bg-slate-100 shadow-sm' : 'bg-white'}`}
        aria-pressed={themeName === 'neutral'}
      >
        Netral
      </button>

      <button
        onClick={() => setThemeName('warm')}
        className={`rounded-full px-3 py-2 text-sm font-medium ${themeName === 'warm' ? 'bg-slate-100 shadow-sm' : 'bg-white'}`}
        aria-pressed={themeName === 'warm'}
      >
        Hangat
      </button>
    </div>
  );
}
