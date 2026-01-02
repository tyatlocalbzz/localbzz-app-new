'use client';

import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    // Check localStorage or system preference on mount
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = stored === 'dark' || (!stored && prefersDark);
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  const toggle = () => {
    const newDark = !dark;
    setDark(newDark);
    document.documentElement.classList.toggle('dark', newDark);
    localStorage.setItem('theme', newDark ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {dark ? '☀️' : '🌙'}
    </button>
  );
}
