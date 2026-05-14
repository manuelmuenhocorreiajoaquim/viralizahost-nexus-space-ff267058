import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { CATALOG, type CycleId, findCycle, findProduct, monthlyPrice, cyclePeriodTotal, isAnnualProduct, productUnitPrice, productPeriodTotal, productSubtotalRef } from "./catalog";

export type CartItem = {
  productId: string;
  qty: number;
  domain?: string;
};

type Ctx = {
  items: CartItem[];
  cycle: CycleId;
  add: (productId: string) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  setDomain: (productId: string, domain: string) => void;
  setCycle: (c: CycleId) => void;
  clear: () => void;
  count: number;
  totals: { subtotal: number; discount: number; total: number };
};

const CartContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "vh.cart.v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [cycle, setCycleState] = useState<CycleId>("annual");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (Array.isArray(data.items)) {
          const normalized = data.items
            .map((item: any) => ({
              productId: String(item.productId ?? item.id ?? ""),
              qty: Number(item.qty ?? item.quantity ?? 1),
              domain: typeof item.domain === "string" ? item.domain : undefined,
            }))
            .filter((item: CartItem) => item.productId && Number.isFinite(item.qty) && item.qty > 0);
          setItems(normalized);
        }
        if (data.cycle) setCycleState(data.cycle);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, cycle }));
    } catch {}
  }, [items, cycle]);

  const add = (productId: string) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) return prev.map((i) => (i.productId === productId ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { productId, qty: 1 }];
    });
  };
  const remove = (productId: string) => setItems((p) => p.filter((i) => i.productId !== productId));
  const setQty = (productId: string, qty: number) =>
    setItems((p) => p.map((i) => (i.productId === productId ? { ...i, qty: Math.max(1, qty) } : i)));
  const setDomain = (productId: string, domain: string) =>
    setItems((p) => p.map((i) => (i.productId === productId ? { ...i, domain } : i)));
  const setCycle = (c: CycleId) => setCycleState(c);
  const clear = () => setItems([]);

  const totals = useMemo(() => {
    const c = findCycle(cycle);
    let subtotal = 0;
    let total = 0;
    for (const it of items) {
      const p = findProduct(it.productId);
      if (!p) continue;
      subtotal += p.basePriceBRL * c.months * it.qty;
      total += cyclePeriodTotal(p.basePriceBRL, c) * it.qty;
    }
    const discount = Math.round((subtotal - total) * 100) / 100;
    return { subtotal: Math.round(subtotal * 100) / 100, discount, total: Math.round(total * 100) / 100 };
  }, [items, cycle]);

  const count = items.reduce((s, i) => s + i.qty, 0);

  return (
    <CartContext.Provider value={{ items, cycle, add, remove, setQty, setDomain, setCycle, clear, count, totals }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export function lineMonthly(productId: string, cycle: CycleId): number {
  const p = findProduct(productId);
  if (!p) return 0;
  return monthlyPrice(p.basePriceBRL, findCycle(cycle));
}

export { CATALOG };
