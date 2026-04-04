import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(() => JSON.parse(localStorage.getItem('nx_user') || 'null'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('nx_token');
    if (token) {
      authAPI.me()
        .then(({ data }) => { setUser(data.user); localStorage.setItem('nx_user', JSON.stringify(data.user)); })
        .catch(() => { localStorage.removeItem('nx_token'); localStorage.removeItem('nx_user'); setUser(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('nx_token', data.token);
    localStorage.setItem('nx_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('nx_token');
    localStorage.removeItem('nx_user');
    setUser(null);
  };

  const updateUser = (u) => {
    setUser(u);
    localStorage.setItem('nx_user', JSON.stringify(u));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
