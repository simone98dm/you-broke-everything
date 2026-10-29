// localStorage can be missing or throw (private mode, blocked site data); the app must work without it.

export function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ponytail: persistence is a convenience; quota/blocked storage just means no restore next visit
  }
}
