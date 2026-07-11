import { create } from 'zustand';
import {
  loadUnlockedVaultIds,
  loadVaultMessages,
  prependVaultMessage,
  summarizeVault,
  unlockVaultItem,
} from './vaultRepository';
import { onOwnershipSync, OWNERSHIP_SYNC_EVENT } from '../ownership/ownershipSyncEvents';

export const useVaultStore = create((set, get) => ({
  messages: [],
  unlockedIds: [],
  playingId: null,
  summary: summarizeVault([]),
  loading: false,
  error: null,
  loadedAt: null,

  load: async () => {
    if (get().loading) return get().messages;
    set({ loading: true, error: null });
    try {
      const [messages, unlockedIds] = await Promise.all([
        loadVaultMessages(),
        loadUnlockedVaultIds(),
      ]);
      set({
        messages,
        unlockedIds,
        summary: summarizeVault(messages),
        loading: false,
        loadedAt: Date.now(),
      });
      return messages;
    } catch (error) {
      set({ loading: false, error: error.message || String(error) });
      return [];
    }
  },

  unlock: async (id) => {
    const unlockedIds = await unlockVaultItem(id);
    set({ unlockedIds });
    return unlockedIds;
  },

  setPlayingId: (playingId) => set({ playingId }),

  addMessage: async (message) => {
    const messages = await prependVaultMessage(message);
    set({
      messages,
      summary: summarizeVault(messages),
      loadedAt: Date.now(),
    });
    return messages;
  },
}));

let vaultSyncBound = false;

function bindVaultSyncBridge() {
  if (vaultSyncBound) return;
  vaultSyncBound = true;
  onOwnershipSync((event) => {
    if (event !== OWNERSHIP_SYNC_EVENT.PURCHASE_COMMITTED) return;
    const store = useVaultStore.getState();
    return store.load();
  });
}

bindVaultSyncBridge();
