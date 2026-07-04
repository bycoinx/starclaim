import AsyncStorage from '@react-native-async-storage/async-storage';

export const VAULT_MESSAGES_KEY = '@vault_messages';
export const VAULT_UNLOCKED_KEY = '@vault_unlocked';

export async function loadVaultMessages() {
  const raw = await AsyncStorage.getItem(VAULT_MESSAGES_KEY);
  const messages = raw ? JSON.parse(raw) : [];
  return normalizeVaultMessages(messages);
}

export async function prependVaultMessage(message) {
  const messages = await loadVaultMessages();
  const next = normalizeVaultMessages([{ ...message, id: message.id || `vault-${Date.now()}` }, ...messages]);
  await AsyncStorage.setItem(VAULT_MESSAGES_KEY, JSON.stringify(next));
  return next;
}

export async function loadUnlockedVaultIds() {
  const raw = await AsyncStorage.getItem(VAULT_UNLOCKED_KEY);
  const unlocked = raw ? JSON.parse(raw) : [];
  return Array.isArray(unlocked) ? unlocked.map(String) : [];
}

export async function saveUnlockedVaultIds(ids) {
  const next = Array.from(new Set((Array.isArray(ids) ? ids : []).map(String)));
  await AsyncStorage.setItem(VAULT_UNLOCKED_KEY, JSON.stringify(next));
  return next;
}

export async function unlockVaultItem(id) {
  const current = await loadUnlockedVaultIds();
  return saveUnlockedVaultIds([id, ...current]);
}

export function summarizeVault(messages = []) {
  const totalItems = messages.length;
  const audioItems = messages.filter((message) => message.type === 'audio').length;
  const textItems = messages.filter((message) => message.type !== 'audio').length;
  const lockedItems = messages.filter((message) => message.lockType && message.lockType !== 'none').length;

  return {
    totalItems,
    audioItems,
    textItems,
    lockedItems,
  };
}

function normalizeVaultMessages(messages) {
  return (Array.isArray(messages) ? messages : []).map((message) => ({
    id: String(message.id || `${message.createdAt || message.date || Date.now()}`),
    type: message.type || (message.audioUri ? 'audio' : 'text'),
    text: message.text || '',
    audioUri: message.audioUri || '',
    lockType: message.lockType || 'none',
    lockValue: message.lockValue || '',
    recipient: message.recipient || '',
    createdAt: message.createdAt || message.date || '',
    raw: message,
  }));
}
