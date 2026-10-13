// Device-local accounts. There is no server: an account is a name plus a passphrase, and everything
// saved under it is encrypted in this browser with a key derived from that passphrase (PBKDF2 → AES-GCM).
// Forgetting the passphrase means the data cannot be opened by anyone, including the developers.
// This is a privacy feature for a shared device, not a replacement for real server-side accounts.

const INDEX = "heard.accounts";
const blobKey = (id: string) => `heard.acct.${id}`;
const ITER = 210_000;
const CHECK = "heard-ok";

export interface AccountRec {
  id: string;
  name: string;
  salt: string;
  check: string;
  created: string;
}

export const cryptoOk = () => typeof crypto !== "undefined" && !!crypto.subtle && typeof TextEncoder !== "undefined";

const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export function listAccounts(): AccountRec[] {
  try {
    const raw = localStorage.getItem(INDEX);
    const a = raw ? (JSON.parse(raw) as AccountRec[]) : [];
    return Array.isArray(a) ? a : [];
  } catch {
    return [];
  }
}

function writeIndex(a: AccountRec[]) {
  localStorage.setItem(INDEX, JSON.stringify(a));
}

async function deriveKey(pass: string, salt: BufferSource): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: ITER, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

export async function encryptText(key: CryptoKey, text: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(text)));
  return `${b64(iv)}.${b64(ct)}`;
}

export async function decryptText(key: CryptoKey, blob: string): Promise<string> {
  const [iv, ct] = blob.split(".");
  const out = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(iv) as BufferSource }, key, unb64(ct));
  return new TextDecoder().decode(out);
}

export const MIN_PASS = 8;

export function checkPassphrase(pass: string): string | null {
  if (pass.length < MIN_PASS) return `Use at least ${MIN_PASS} characters. A few unrelated words works well.`;
  return null;
}

export async function createAccount(name: string, pass: string): Promise<{ rec: AccountRec; key: CryptoKey }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(pass, salt);
  const rec: AccountRec = {
    id: Math.random().toString(36).slice(2, 10),
    name: name.trim() || "Friend",
    salt: b64(salt),
    check: await encryptText(key, CHECK),
    created: new Date().toISOString(),
  };
  writeIndex([...listAccounts(), rec]);
  return { rec, key };
}

/** Returns the key when the passphrase is right, otherwise null. */
export async function unlock(rec: AccountRec, pass: string): Promise<CryptoKey | null> {
  try {
    const key = await deriveKey(pass, unb64(rec.salt) as BufferSource);
    return (await decryptText(key, rec.check)) === CHECK ? key : null;
  } catch {
    return null;
  }
}

export async function writeBlob(id: string, key: CryptoKey, data: unknown) {
  localStorage.setItem(blobKey(id), await encryptText(key, JSON.stringify(data)));
}

export async function readBlob<T>(id: string, key: CryptoKey): Promise<T | null> {
  try {
    const raw = localStorage.getItem(blobKey(id));
    if (!raw) return null;
    return JSON.parse(await decryptText(key, raw)) as T;
  } catch {
    return null;
  }
}

export function removeAccount(id: string) {
  try {
    writeIndex(listAccounts().filter((a) => a.id !== id));
    localStorage.removeItem(blobKey(id));
  } catch {
    /* ignore */
  }
}
