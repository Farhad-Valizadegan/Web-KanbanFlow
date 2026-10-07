import { useEffect, useState, type ReactNode } from 'react';
import { ThemeContext, type ThemePreference } from './ThemeContext';

const storageKey = 'kanbanflow-theme';
function readPreference(): ThemePreference {
    try {
        const value = localStorage.getItem(storageKey);
        if (value === 'light' || value === 'dark') return value;
    } catch { /* The theme still works when storage is unavailable. */ }
    return 'system';
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<ThemePreference>(readPreference);
    useEffect(() => {
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const apply = () => {
            const resolved = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
            document.documentElement.dataset.theme = resolved;
            document.documentElement.style.colorScheme = resolved;
        };
        apply();
        try { localStorage.setItem(storageKey, theme); } catch { /* Optional persistence. */ }
        media.addEventListener('change', apply);
        return () => media.removeEventListener('change', apply);
    }, [theme]);
    useEffect(() => {
        const sync = (event: StorageEvent) => {
            if (event.key === storageKey || event.key === null) setTheme(readPreference());
        };
        window.addEventListener('storage', sync);
        return () => window.removeEventListener('storage', sync);
    }, []);
    return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}
