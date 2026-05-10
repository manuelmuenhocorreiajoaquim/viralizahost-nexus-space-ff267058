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
  const raw = match[0].replace(/[.,]/g, "");
  const num = parseInt(raw, 10);
  if (isNaN(num)) return price;
  if (currency === "BRL") {
    return `R$ ${num.toLocaleString("pt-BR")}`;
  }
  const akz = num * 1000;
  return `${akz.toLocaleString("pt-BR")} AKZ`;
}

export function usePrice(price: string): string {
  const { currency } = useCurrency();
  return formatPrice(price, currency);
}
