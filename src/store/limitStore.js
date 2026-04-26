import { create } from 'zustand';

const useLimitStore = create((set) => ({
  visible: false,
  used: 0,
  limit: 0,

  open: (data) =>
    set({
      visible: true,
      used: data.used ?? 0,
      limit: data.limit ?? 0,
    }),

  close: () =>
    set({
      visible: false,
    }),
}));

export default useLimitStore;