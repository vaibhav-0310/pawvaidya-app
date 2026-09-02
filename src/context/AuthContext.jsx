// src/context/AuthContext.jsx
// Mirrors the web app's session-based authentication flow for React Native.

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api_essentials';

const AuthContext = createContext(null);
const SESSION_COOKIE_KEY = 'pawvaidya.sessionCookie';
const AUTH_USER_KEY = 'pawvaidya.authUser';
const AUTH_TYPE_KEY = 'pawvaidya.authType';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initializing, setInitializing] = useState(true);

  const checkAuthStatus = useCallback(async () => {
    try {
      const storedUser = await AsyncStorage.getItem(AUTH_USER_KEY);
      const storedType = await AsyncStorage.getItem(AUTH_TYPE_KEY);

      if (storedUser) {
        setUser(JSON.parse(storedUser));
        setUserType(storedType || null);
        setIsAuthenticated(true);
      }
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

  const login = async ({ user: loggedInUser, userType: type }) => {
    if (!loggedInUser) {
      throw new Error('Login succeeded, but the server did not return the user details.');
    }

    await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(loggedInUser));
    if (type) await AsyncStorage.setItem(AUTH_TYPE_KEY, type);
    setUser(loggedInUser);
    setUserType(type || null);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      await api.get('/logout');
    } catch (err) {
      // ignore network errors on logout — clear local state regardless
    }
    await AsyncStorage.removeItem(SESSION_COOKIE_KEY);
    await AsyncStorage.multiRemove([AUTH_USER_KEY, AUTH_TYPE_KEY]);
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