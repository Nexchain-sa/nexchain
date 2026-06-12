import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext(null);

/* يطبّق الدور النشط المخزَّن على بيانات المستخدم مع الحفاظ على الدور الأصلي (الهوية) */
const withActiveRole = (u) => {
  if (!u) return u;
  const baseRole = u.role;
  const active = localStorage.getItem('fl_active_role') || baseRole;
  return { ...u, role: active, baseRole };
};

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(() => withActiveRole(JSON.parse(localStorage.getItem('fl_user') || 'null')));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('fl_token');
    if (token) {
      authAPI.me()
        .then(({ data }) => {
          localStorage.setItem('fl_user', JSON.stringify(data.user));
          localStorage.setItem('fl_base_role', data.user.role);
          setUser(withActiveRole(data.user));
        })
        .catch(() => { localStorage.removeItem('fl_token'); localStorage.removeItem('fl_user'); setUser(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('fl_token', data.token);
    localStorage.setItem('fl_user', JSON.stringify(data.user));
    localStorage.setItem('fl_base_role', data.user.role);
    localStorage.removeItem('fl_active_role');
    const u = withActiveRole(data.user);
    setUser(u);
    return u;
  };

  const logout = () => {
    ['fl_token', 'fl_user', 'fl_active_role', 'fl_base_role'].forEach(k => localStorage.removeItem(k));
    setUser(null);
  };

  /* تبديل الدور النشط (مشترٍ / بائع / ممول ...) مع الحفاظ على هوية الحساب */
  const switchRole = (role) => {
    localStorage.setItem('fl_active_role', role);
    setUser(prev => prev ? { ...prev, role } : prev);
  };

  const updateUser = (u) => {
    setUser(withActiveRole(u));
    localStorage.setItem('fl_user', JSON.stringify({ ...u, role: u.baseRole || u.role }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, switchRole, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
