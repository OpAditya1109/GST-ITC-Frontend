/**
 * store/invoiceStore.js — Invoice state (Zustand)
 */

import { create } from 'zustand';
import { invoiceAPI } from '../services/api';

const useInvoiceStore = create((set, get) => ({
  invoices: [],
  summary: null,
  currentInvoice: null, // OCR result being reviewed
  isLoading: false,
  error: null,

  setCurrentInvoice: (invoice) => set({ currentInvoice: invoice }),

  // ── Fetch invoices list ──────────────────────────────────────────────────────
  fetchInvoices: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await invoiceAPI.getAll(params);
      set({ invoices: data.data, isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch invoices', isLoading: false });
    }
  },

  // ── Fetch monthly summary ────────────────────────────────────────────────────
  fetchSummary: async (month) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await invoiceAPI.getSummary(month);
      set({ summary: data.data, isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch summary', isLoading: false });
    }
  },

  // ── Upload invoice image ─────────────────────────────────────────────────────
uploadInvoice: async (imageUri, invoiceType) => {
  set({ isLoading: true, error: null });
  try {
    const { data } = await invoiceAPI.upload(imageUri, invoiceType);

    // 🔥 ADD THIS
    await get().fetchSummary(); 

    set({ currentInvoice: data.data, isLoading: false });
    return data.data;
  } catch (err) {
    set({ error: 'Upload failed', isLoading: false });
    throw err;
  }
},

  // ── Edit invoice ─────────────────────────────────────────────────────────────
  editInvoice: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await invoiceAPI.edit(id, updates);
      // Update in local list
      set((state) => ({
        invoices: state.invoices.map((inv) => (inv._id === id ? data.data : inv)),
        currentInvoice: data.data,
        isLoading: false,
      }));
      return data.data;
    } catch (err) {
      set({ error: err.response?.data?.message || 'Update failed', isLoading: false });
      throw err;
    }
  },

  // ── Delete invoice ───────────────────────────────────────────────────────────
  deleteInvoice: async (id) => {
    try {
      await invoiceAPI.delete(id);
      set((state) => ({
        invoices: state.invoices.filter((inv) => inv._id !== id),
      }));
    } catch (err) {
      set({ error: err.response?.data?.message || 'Delete failed' });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));

export default useInvoiceStore;
