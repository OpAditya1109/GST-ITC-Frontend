/**
 * services/api.js — Centralized Axios instance
 *
 * All API calls go through here so:
 *  - Auth token is automatically attached
 *  - 401s are caught and trigger logout
 *  - Base URL is configured once
 */

import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30s timeout (OCR can take a few seconds)
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor: attach JWT ──────────────────────────────────────────
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: handle 401 ─────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token');
      // The auth store will handle navigation to login
    }
    return Promise.reject(error);
  }
);

// ─── Auth Endpoints ───────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// ─── Invoice Endpoints ────────────────────────────────────────────────────────
export const invoiceAPI = {
  /**
   * Upload invoice image (multipart/form-data)
   * @param {string} imageUri - local file URI from camera/gallery
   * @param {'input'|'output'} invoiceType
   */
  upload: async (imageUri, invoiceType = 'input') => {
    const formData = new FormData();

    // React Native requires this specific format for multipart uploads
    formData.append('invoice', {
      uri: imageUri,
      type: 'image/jpeg',
      name: `invoice_${Date.now()}.jpg`,
    });
    formData.append('invoiceType', invoiceType);

    return api.post('/invoices/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getAll: (params) => api.get('/invoices', { params }),

  getSummary: (month) => api.get('/invoices/summary', { params: { month } }),

  edit: (id, data) => api.put(`/invoices/${id}`, data),

  delete: (id) => api.delete(`/invoices/${id}`),
};

export default api;
