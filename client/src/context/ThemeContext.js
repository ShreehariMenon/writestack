import { createContext, useContext, useState, useEffect } from 'react';
const Ctx = createContext(null);
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('ws_theme') || 'light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ws_theme', theme);
  }, [theme]);
  return <Ctx.Provider value={{ theme, toggle: () => setTheme(t => t === 'dark' ? 'light' : 'dark') }}>{children}</Ctx.Provider>;
}
export const useTheme = () => useContext(Ctx);
