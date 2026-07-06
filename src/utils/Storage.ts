const STORAGE_KEY = 'nativemind_conversation';

export function loadFromStorage(): { messages: Message[]; context: number[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        messages: parsed.messages || [],
        context: parsed.context || [],
      };
    }
  } catch {
    // ignore corrupt data
  }
  return { messages: [], context: [] };
}

export function saveToStorage(messages: Message[], context: number[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, context }));
  } catch {
    // storage full or unavailable
  }
}

export function clearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // storage full or unavailable
  }
}