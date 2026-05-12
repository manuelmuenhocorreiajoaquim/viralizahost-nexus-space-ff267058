// Shared WHM API helpers — server side only.
// Uses WHM API Token with header `Authorization: whm USERNAME:TOKEN`.

export interface WhmServerRow {
  id: string;
  hostname: string;
  api_url: string;
  username: string;
  token: string;
  server_ip: string | null;
  nameserver1: string;
  nameserver2: string;
}

function authHeader(s: { username: string; token: string }) {
  return `whm ${s.username}:${s.token}`;
}

function normalizeBaseUrl(api_url: string) {
  // ensure no trailing slash
  return api_url.replace(/\/+$/, "");
}

export async function whmCall(
  s: WhmServerRow,
  endpoint: string,
  params: Record<string, string | number> = {},
): Promise<any> {
  const base = normalizeBaseUrl(s.api_url);
  const url = new URL(`${base}/json-api/${endpoint}`);
  url.searchParams.set("api.version", "1");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: authHeader(s),
      Accept: "application/json",
    },
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`WHM ${endpoint} responded with non-JSON: ${text.slice(0, 200)}`);
  }

  if (!res.ok) {
    throw new Error(
      `WHM ${endpoint} HTTP ${res.status}: ${json?.metadata?.reason ?? text.slice(0, 200)}`,
    );
  }
  // WHM may put errors inside metadata
  const meta = json?.metadata;
  if (meta && meta.result === 0) {
    throw new Error(`WHM ${endpoint}: ${meta.reason ?? "unknown error"}`);
  }
  return json;
}

export function generatePassword(length = 18): string {
  // strong password with letters, digits, symbols
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#%&*-_=+";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) out += chars[bytes[i] % chars.length];
  return out;
}

export function deriveUsername(domain: string): string {
  // cPanel: 8 chars max, lowercase, must start with letter
  const base = domain
    .toLowerCase()
    .replace(/^www\./, "")
    .replace(/\.[^.]+$/, "") // strip TLD
    .replace(/[^a-z0-9]/g, "");
  let u = (base || "user").slice(0, 5);
  if (!/^[a-z]/.test(u)) u = "u" + u;
  // suffix with 3 random digits to avoid clashes
  const r = Math.floor(100 + Math.random() * 900);
  return (u + r).slice(0, 8);
}
