import { createContext, useContext, useState, useEffect } from 'react';
const Ctx = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = localStorage.getItem('ws_token');
    const u = localStorage.getItem('ws_user');
    if (t && u) { setToken(t); setUser(JSON.parse(u)); }
    setReady(true);
  }, []);
  const login = (t, u) => {
    localStorage.setItem('ws_token', t);
    localStorage.setItem('ws_user', JSON.stringify(u));
    setToken(t); setUser(u);
  };
  const logout = () => {
    localStorage.removeItem('ws_token');
    localStorage.removeItem('ws_user');
    setToken(null); setUser(null);
  };
  const updateUser = (u) => { setUser(u); localStorage.setItem('ws_user', JSON.stringify(u)); };
  return <Ctx.Provider value={{ user, token, ready, login, logout, updateUser }}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);
