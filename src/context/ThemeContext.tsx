import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeId, ThemeDefinition, APP_THEMES } from '../types/theme';

interface ThemeContextType {
  theme: ThemeId;
  themeConfig: ThemeDefinition;
  setTheme: (id: ThemeId) => void;
  allThemes: ThemeDefinition[];
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'app_active_theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    try {
      // Clear legacy lissenly theme key if present
      localStorage.removeItem('lissenly_active_theme');
      const saved = localStorage.getItem(STORAGE_KEY) as ThemeId;
      if (saved && APP_THEMES.some((t) => t.id === saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'blue'; // Default is classic blue
  });

  const activeTheme = APP_THEMES.find((t) => t.id === themeId) || APP_THEMES[0];

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, themeId);
    } catch {
      // ignore
    }

    const root = document.documentElement;
    root.setAttribute('data-theme', themeId);
    document.body.setAttribute('data-theme', themeId);
    if (activeTheme.isDark) {
      root.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark');
    }

    // Inject CSS variables dynamically
    const c = activeTheme.colors;
    root.style.setProperty('--th-bg', c.bg);
    root.style.setProperty('--th-surface', c.surface);
    root.style.setProperty('--th-surface-dim', c.surfaceDim);
    root.style.setProperty('--th-surface-hover', c.surfaceHover);
    root.style.setProperty('--th-text', c.text);
    root.style.setProperty('--th-text-muted', c.textMuted);
    root.style.setProperty('--th-text-inverse', c.textInverse || '#FFFFFF');
    root.style.setProperty('--th-primary', c.primary);
    root.style.setProperty('--th-primary-hover', c.primaryHover);
    root.style.setProperty('--th-primary-light', c.primaryLight);
    root.style.setProperty('--th-border', c.border);
    root.style.setProperty('--th-border-subtle', c.borderSubtle || c.border);
    root.style.setProperty('--th-badge-bg', c.badgeBg);
    root.style.setProperty('--th-badge-text', c.badgeText);
    root.style.setProperty('--th-badge-border', c.badgeBorder);
    root.style.setProperty('--th-sidebar-bg', c.sidebarBg);
    root.style.setProperty('--th-sidebar-text', c.sidebarText);
    root.style.setProperty('--th-sidebar-text-muted', c.sidebarTextMuted);
    root.style.setProperty('--th-sidebar-active', c.sidebarActive);
    root.style.setProperty('--th-sidebar-hover', c.sidebarHover);
    root.style.setProperty('--th-sidebar-border', c.sidebarBorder);

    // Update meta theme-color tag
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', c.primary);
    }
  }, [themeId, activeTheme]);

  const setTheme = (id: ThemeId) => {
    if (APP_THEMES.some((t) => t.id === id)) {
      setThemeId(id);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: themeId,
        themeConfig: activeTheme,
        setTheme,
        allThemes: APP_THEMES,
        isDark: activeTheme.isDark
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
