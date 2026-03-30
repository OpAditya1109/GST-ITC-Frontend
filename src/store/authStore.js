/**
 * store/authStore.js — Global authentication state (Zustand)
 *
 * Persists token in SecureStore (encrypted, OS-level storage).
 * Exposes: user, token, isLoading, login, register, logout
 */

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../services/api';

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isLoading: true, // true on cold start while we check SecureStore

  // ── Bootstrap: load token on app start ──────────────────────────────────────
  initialize: async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        // Validate token by fetching current user
        const { data } = await authAPI.getMe();
        set({ user: data.data, token, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      // Token invalid or expired
      await SecureStore.deleteItemAsync('auth_token');
      set({ user: null, token: null, isLoading: false });
    }
  },

  // ── Login ────────────────────────────────────────────────────────────────────
  login: async (phone, password) => {
    const { data } = await authAPI.login({ phone, password });
    await SecureStore.setItemAsync('auth_token', data.token);
    set({ user: data.user, token: data.token });
    return data;
  },

  // ── Register ─────────────────────────────────────────────────────────────────
  register: async (formData) => {
    const { data } = await authAPI.register(formData);
    await SecureStore.setItemAsync('auth_token', data.token);
    set({ user: data.user, token: data.token });
    return data;
  },

  // ── Logout ───────────────────────────────────────────────────────────────────
  logout: async () => {
    await SecureStore.deleteItemAsync('auth_token');
    set({ user: null, token: null });
  },
}));

export default useAuthStore;
