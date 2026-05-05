import { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../config';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const initialized = useRef(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken && !initialized.current) {
      initialized.current = true;
      setToken(storedToken);
    }
  }, []);

  useEffect(() => {
    if (!token || !initialized.current) return;

    let cancelled = false;

    fetch(api('/api/auth/me'), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          if (data.user) {
            setUser(data.user);
          } else {
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('pendingRoom');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
