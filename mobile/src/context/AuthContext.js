import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('fl_token');
        const saved = await AsyncStorage.getItem('fl_user');
        if (token && saved) {
          setUser(JSON.parse(saved));
          // Verify token with server
          const res = await authAPI.me();
          const freshUser = res.data.data;
          setUser(freshUser);
          await AsyncStorage.setItem('fl_user', JSON.stringify(freshUser));
        }
      } catch {
        await AsyncStorage.removeItem('fl_token');
        await AsyncStorage.removeItem('fl_user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token, user: u } = res.data;
    await AsyncStorage.setItem('fl_token', token);
    await AsyncStorage.setItem('fl_user', JSON.stringify(u));
    setUser(u);
    return u;
  };

  const logout = async () => {
    await AsyncStorage.removeItem('fl_token');
    await AsyncStorage.removeItem('fl_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
