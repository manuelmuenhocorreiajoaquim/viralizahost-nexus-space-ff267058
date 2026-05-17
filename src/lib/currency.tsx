import { createContext, useContext, useState, type ReactNode } from "react";

export type Currency = "BRL" | "AKZ";

type Ctx = {
  currency: Currency;
  setCurrency: (c: Currency) => void;
};

const CurrencyContext = createContext<Ctx>({
  currency: "BRL",
  setCurrency: () => {},
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>("BRL");
  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}

/**
 * Convert a price string ("R$ 79", "R$ 1.500", "79", "Sob consulta") to the
 * target currency display. AKZ uses 1 BRL = 1.000 AKZ.
 */
export function formatPrice(price: string, currency: Currency): string {
  const match = price.match(/[\d.,]+/);
  if (!match) return price;
  const raw = match[0];
  // Normalize to a JS number. Accept both pt-BR ("1.299,90") and dot-decimal ("59.99").
  let normalized: string;
  if (raw.includes(",")) {
    // pt-BR style: dots are thousands separators, comma is decimal
    normalized = raw.replace(/\./g, "").replace(",", ".");
  } else {
    const parts = raw.split(".");
    if (parts.length === 2 && parts[1].length <= 2) {
      // Dot-decimal style (e.g. "59.99")
      normalized = raw;
    } else {
      // Dots used as thousands separators (e.g. "1.299")
      normalized = raw.replace(/\./g, "");
    }
  }
  const num = parseFloat(normalized);
  if (isNaN(num)) return price;
  if (currency === "BRL") {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  }
  const akz = num * 1000;
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(akz) + " AKZ";
}

export function usePrice(price: string): string {
  const { currency } = useCurrency();
  return formatPrice(price, currency);
}
