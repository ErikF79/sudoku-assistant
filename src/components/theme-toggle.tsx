'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('sudoku-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = stored ? stored === 'dark' : prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  const toggle = () => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('sudoku-theme', next ? 'dark' : 'light');
      return next;
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Attiva tema chiaro' : 'Attiva tema scuro'}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-card text-foreground shadow-sm transition hover:bg-primary/10"
    >
      {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
