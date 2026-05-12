// AES-GCM encryption using Web Crypto. Output: base64(iv).base64(ciphertext)
// Key is derived from WHM_ENCRYPTION_KEY via SHA-256.

async function getKey(secret: string): Promise<CryptoKey> {
  const raw = new TextEncoder().encode(secret);
  const hash = await crypto.subtle.digest("SHA-256", raw);
  return crypto.subtle.importKey("raw", hash, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

function b64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function unb64(s: string): Uint8Array {
  const bin = atob(s);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

export async function encryptSecret(plain: string, secret: string): Promise<string> {
  if (!secret) return plain; // fallback (should not happen in prod)
  const key = await getKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plain)),
  );
  return `${b64(iv)}.${b64(ct)}`;
}

export async function decryptSecret(token: string, secret: string): Promise<string> {
  const [ivB64, ctB64] = token.split(".");
  if (!ivB64 || !ctB64) throw new Error("Invalid ciphertext");
  const key = await getKey(secret);
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: unb64(ivB64) },
    key,
    unb64(ctB64),
  );
  return new TextDecoder().decode(pt);
}

export async function decryptSecretMaybe(token: string | null | undefined, secret: string): Promise<string> {
  if (!token) return "";
  if (!secret || !token.includes(".")) return token;
  try {
    return await decryptSecret(token, secret);
  } catch {
    return token;
  }
}
