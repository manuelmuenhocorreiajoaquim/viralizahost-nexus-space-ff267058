import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Currency = "BRL" | "AKZ" | "USD";

type Rates = Record<Currency, number>; // 1 BRL = rate[currency]

const FALLBACK_RATES: Rates = {
  BRL: 1,
  AKZ: 184.9,
  USD: 0.19,
};

const CACHE_KEY = "vh_fx_rates_v1";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 min

type CachedRates = { rates: Rates; fetchedAt: number };

function readCache(): CachedRates | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedRates;
    if (!parsed?.rates || typeof parsed.fetchedAt !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(rates: Rates) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ rates, fetchedAt: Date.now() } satisfies CachedRates),
    );
  } catch {
    /* ignore */
  }
}

async function fetchRates(): Promise<Rates | null> {
  const endpoints = [
    "https://api.exchangerate.host/latest?base=BRL&symbols=AKZ,USD",
    "https://open.er-api.com/v6/latest/BRL",
  ];
  for (const url of endpoints) {
    try {
      const r = await fetch(url);
      if (!r.ok) continue;
      const j: any = await r.json();
      const map = j?.rates ?? j?.conversion_rates;
      const akz = Number(map?.AKZ);
      const usd = Number(map?.USD);
      if (akz > 0 && usd > 0) {
        return { BRL: 1, AKZ: akz, USD: usd };
      }
    } catch {
      /* try next */
    }
  }
  return null;
}

type Ctx = {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  rates: Rates;
};

const CurrencyContext = createContext<Ctx>({
  currency: "BRL",
  setCurrency: () => {},
  rates: FALLBACK_RATES,
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>("BRL");
  const [rates, setRates] = useState<Rates>(() => {
    const cached = readCache();
    return cached?.rates ?? FALLBACK_RATES;
  });

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      const cached = readCache();
      const fresh = cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS;
      if (fresh) {
        if (!cancelled) setRates(cached!.rates);
        return;
      }
      const fetched = await fetchRates();
      if (fetched && !cancelled) {
        setRates(fetched);
        writeCache(fetched);
      }
    };

    refresh();
    const id = window.setInterval(refresh, CACHE_TTL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, rates }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}

/** Parse a localized price string into a BRL number. */
function parseBRL(price: string): number | null {
  const match = price.match(/[\d.,]+/);
  if (!match) return null;
  const raw = match[0];
  let normalized: string;
  if (raw.includes(",")) {
    normalized = raw.replace(/\./g, "").replace(",", ".");
  } else {
    const parts = raw.split(".");
    if (parts.length === 2 && parts[1].length <= 2) {
      normalized = raw;
    } else {
      normalized = raw.replace(/\./g, "");
    }
  }
  const n = parseFloat(normalized);
  return isNaN(n) ? null : n;
}

/** Convert an amount in BRL to the target currency using current rates. */
export function convertCurrency(
  amountBRL: number,
  target: Currency,
  rates: Rates = FALLBACK_RATES,
): number {
  const rate = rates[target] ?? FALLBACK_RATES[target] ?? 1;
  return amountBRL * rate;
}

/** Format a numeric amount already expressed in `currency`. */
export function formatCurrency(amount: number, currency: Currency): string {
  if (currency === "BRL") {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }
  // AKZ — no decimals, thousands separator
  return (
    new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(amount)) + " AKZ"
  );
}

/**
 * Format a BRL price into the target currency.
 * IMPORTANT: AKZ is NEVER auto-converted from BRL — AKZ pricing is managed
 * per-product in the Admin panel. Without an explicit AOA value, AKZ shows
 * "Sob consulta". USD remains converted from BRL (informational only).
 */
export function formatPrice(
  price: string,
  currency: Currency,
  rates: Rates = FALLBACK_RATES,
): string {
  if (currency === "AKZ") return "Sob consulta";
  const amountBRL = parseBRL(price);
  if (amountBRL == null) return price;
  const converted = convertCurrency(amountBRL, currency, rates);
  return formatCurrency(converted, currency);
}

export function usePrice(price: string): string {
  const { currency, rates } = useCurrency();
  return formatPrice(price, currency, rates);
}

/**
 * Dual-price hook for products with admin-managed prices in BOTH BRL and AKZ.
 * - BRL: shows the BRL value.
 * - AKZ: shows the AKZ value if provided; otherwise "Sob consulta". No conversion.
 * - USD: converts from the BRL value (informational).
 */
export function useDisplayPrice(
  priceBRL: string | number | null | undefined,
  priceAOA?: number | string | null,
): string {
  const { currency, rates } = useCurrency();
  if (currency === "AKZ") {
    const aoa = typeof priceAOA === "string" ? parseFloat(priceAOA) : priceAOA;
    if (aoa != null && Number.isFinite(aoa) && (aoa as number) > 0) {
      return formatCurrency(aoa as number, "AKZ");
    }
    return "Sob consulta";
  }
  const brlStr =
    typeof priceBRL === "number" ? String(priceBRL) : (priceBRL ?? "");
  return formatPrice(brlStr, currency, rates);
}
