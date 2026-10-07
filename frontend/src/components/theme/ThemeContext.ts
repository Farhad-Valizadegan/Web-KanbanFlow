import { createContext, useContext } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export const ThemeContext = createContext<{
    theme: ThemePreference;
    setTheme: (theme: ThemePreference) => void;
} | null>(null);

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('ThemeProvider is required.');
    return context;
}
