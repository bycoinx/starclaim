import { create } from 'zustand';
import {
  loadOwnershipRecords,
  appendLocalOwnershipRecord,
  refreshOwnershipRecords,
  summarizeOwnership,
  updateLocalOwnershipMessage,
} from './ownershipRepository';

export const useOwnershipStore = create((set, get) => ({
  records: [],
  summary: summarizeOwnership([]),
  loading: false,
  error: null,
  loadedAt: null,

  load: async () => {
    if (get().loading) return get().records;
    set({ loading: true, error: null });
    try {
      const records = await loadOwnershipRecords();
      set({
        records,
        summary: summarizeOwnership(records),
        loading: false,
        loadedAt: Date.now(),
      });
      return records;
    } catch (error) {
      set({ loading: false, error: error.message || String(error) });
      return [];
    }
  },

  refresh: async () => {
    set({ loading: true, error: null });
    try {
      const records = await refreshOwnershipRecords();
      set({
        records,
        summary: summarizeOwnership(records),
        loading: false,
        loadedAt: Date.now(),
      });
      return records;
    } catch (error) {
      set({ loading: false, error: error.message || String(error) });
      return get().records;
    }
  },

  addLocalRecord: async (record) => {
    const records = await appendLocalOwnershipRecord(record);
    set({
      records,
      summary: summarizeOwnership(records),
      loadedAt: Date.now(),
    });
    return records;
  },

  updateMessage: async (starId, message) => {
    const records = await updateLocalOwnershipMessage(starId, message);
    set({
      records,
      summary: summarizeOwnership(records),
      loadedAt: Date.now(),
    });
    return records;
  },
}));
