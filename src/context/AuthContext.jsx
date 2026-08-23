// src/context/AuthContext.jsx
// Mirrors the web app's AuthContext (isAuthenticated, user, userType, logout,
// checkAuthStatus). On mobile, session cookies from `withCredentials: true`
// don't persist the way they do in a browser — this stores a bearer token in
// AsyncStorage instead. This ONLY works if your backend's /api/login route
// also returns a token in the response body. If it currently only sets a
// cookie, add token issuance server-side (e.g. a JWT) for this to work fully.

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initializing, setInitializing] = useState(true);

  const checkAuthStatus = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        setUserType(null);
        return;
      }
      // TODO: confirm actual "who am I" endpoint on your backend (e.g. /api/me)
      const { data } = await api.get('/me');
      setUser(data.user || data);
      setUserType(data.userType || data.role);
      setIsAuthenticated(true);
    } catch (err) {
      setIsAuthenticated(false);
      setUser(null);
      setUserType(null);
    } finally {
      setInitializing(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = async ({ token, user: loggedInUser, userType: type }) => {
    if (token) {
      await AsyncStorage.setItem('authToken', token);
    }
    setUser(loggedInUser || null);
    setUserType(type || null);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (err) {
      // ignore network errors on logout — clear local state regardless
    }
    await AsyncStorage.removeItem('authToken');
    setUser(null);
    setUserType(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{ user, userType, isAuthenticated, initializing, login, logout, checkAuthStatus }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}