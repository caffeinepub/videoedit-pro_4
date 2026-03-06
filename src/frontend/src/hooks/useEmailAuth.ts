import { useInternetIdentity } from "./useInternetIdentity";

// Simple, deterministic string hash — UI-only gating, not real security
function hashPassword(password: string): string {
  return btoa(
    encodeURIComponent(password)
      .split("")
      .map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ (7 + (i % 13))))
      .join(""),
  );
}

interface EmailAuthRecord {
  email: string;
  passwordHash: string;
  name: string;
  registered: boolean;
}

const SESSION_KEY = "videru_emailLoggedIn";

function storageKey(principalText: string): string {
  return `videru_email_auth_${principalText}`;
}

export function useEmailAuth() {
  const { identity } = useInternetIdentity();
  const principalText = identity?.getPrincipal().toString() ?? "";

  function getRecord(): EmailAuthRecord | null {
    if (!principalText) return null;
    try {
      const raw = localStorage.getItem(storageKey(principalText));
      if (!raw) return null;
      return JSON.parse(raw) as EmailAuthRecord;
    } catch {
      return null;
    }
  }

  function saveRecord(record: EmailAuthRecord): void {
    if (!principalText) return;
    localStorage.setItem(storageKey(principalText), JSON.stringify(record));
  }

  const record = getRecord();
  const isRegistered = record?.registered === true;
  const isEmailLoggedIn =
    sessionStorage.getItem(SESSION_KEY) === principalText && isRegistered;

  function register(name: string, email: string, password: string): void {
    const newRecord: EmailAuthRecord = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: hashPassword(password),
      registered: true,
    };
    saveRecord(newRecord);
    sessionStorage.setItem(SESSION_KEY, principalText);
  }

  function loginWithEmail(email: string, password: string): boolean {
    if (!record) return false;
    const emailMatch = record.email === email.trim().toLowerCase();
    const passwordMatch = record.passwordHash === hashPassword(password);
    if (emailMatch && passwordMatch) {
      sessionStorage.setItem(SESSION_KEY, principalText);
      return true;
    }
    return false;
  }

  function logout(): void {
    sessionStorage.removeItem(SESSION_KEY);
  }

  function getStoredName(): string {
    return record?.name ?? "";
  }

  function getStoredEmail(): string {
    return record?.email ?? "";
  }

  return {
    isRegistered,
    isEmailLoggedIn,
    register,
    loginWithEmail,
    logout,
    getStoredName,
    getStoredEmail,
  };
}
