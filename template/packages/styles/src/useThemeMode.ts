'use client';
import { useCallback, useEffect, useState } from 'react';

import type { ThemeMode } from './themes.css';

const STORAGE_KEY = 'theme-mode';

function applyMode(mode: ThemeMode): void {
  const root = document.documentElement;
  const lightClass = root.dataset['lightClass'];
  const darkClass = root.dataset['darkClass'];

  if (!lightClass || !darkClass) return;
  root.classList.remove(mode === 'dark' ? lightClass : darkClass);
  root.classList.add(mode === 'dark' ? darkClass : lightClass);
  root.style.colorScheme = mode;

  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* empty */
  }
}

export function useThemeMode() {
  const [mode, setModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    const current =
      document.documentElement.style.colorScheme === 'dark' ? 'dark' : 'light';
    setModeState(current);
  }, []);

  const setMode = useCallback((newMode: ThemeMode) => {
    applyMode(newMode);
    setModeState(newMode);
  }, []);

  const toggle = useCallback(() => {
    setModeState((prev) => {
      const next: ThemeMode = prev === 'light' ? 'dark' : 'light';
      applyMode(next);
      return next;
    });
  }, []);

  return { mode, setMode, toggle };
}
