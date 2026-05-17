import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CATALOG,
  type CycleId,
  type Product,
  findCycle,
  findProduct,
  monthlyPrice,
  cyclePeriodTotal,
  isAnnualProduct,
  productUnitPrice,
  productPeriodTotal,
  productSubtotalRef,
  registerDomainProduct,
} from "./catalog";

export type CartItem = {
  productId: string;
  qty: number;
  domain?: string;
  name?: string;
  type?: Product["type"];
  priceBRL?: number;
  billing?: Product["billing"];
};

type Ctx = {
  items: CartItem[];
  cycle: CycleId;
  add: (
    productId: string,
    snapshot?: Partial<Omit<CartItem, "productId" | "qty">> & { qty?: number },
  ) => void;
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
const CATALOG_VERSION_KEY = "vh.catalog.version";

/**
 * Hard-reset all checkout state and navigate to /checkout with the chosen
 * product. Used by "Contratar" buttons so each click starts a fresh checkout
 * and never reuses a previously-selected product or cycle from cache.
 */
export function startCheckout(productId: string, cycle: CycleId = "monthly") {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("selectedProduct");
    localStorage.removeItem("selectedCycle");
    localStorage.removeItem("checkoutState");
    localStorage.removeItem("cart");
    localStorage.removeItem("cachedCheckout");
    localStorage.removeItem("cachedProducts");
    sessionStorage.clear();
    localStorage.setItem(CATALOG_VERSION_KEY, CATALOG_VERSION);
  } catch {}
  const url = `/checkout?step=cycle&product=${encodeURIComponent(productId)}&cycle=${cycle}&t=${Date.now()}`;
  // Hard navigation → guarantees a fresh app boot with clean state.
  window.location.href = url;
}

/** Clear checkout-related state (call on logo/home navigation). */
export function clearCheckoutState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("selectedProduct");
    localStorage.removeItem("selectedCycle");
    localStorage.removeItem("checkoutState");
    localStorage.removeItem("cart");
    localStorage.removeItem("cachedCheckout");
    localStorage.removeItem("cachedProducts");
  } catch {}
}
export const CATALOG_VERSION = "2026-05-17-vps-prices-v2";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [cycle, setCycleState] = useState<CycleId>("monthly");

  useEffect(() => {
    try {
      // Invalidate cached cart/cycle when catalog version changes
      const savedVersion = localStorage.getItem(CATALOG_VERSION_KEY);
      if (savedVersion !== CATALOG_VERSION) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem("vh.checkout.customer.v1");
        localStorage.setItem(CATALOG_VERSION_KEY, CATALOG_VERSION);
        return;
      }
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (Array.isArray(data.items)) {
          const normalized = data.items
            .map((item: any) => ({
              productId: String(item.productId ?? item.id ?? ""),
              qty: Number(item.qty ?? item.quantity ?? 1),
              domain: typeof item.domain === "string" ? item.domain : undefined,
              name: typeof item.name === "string" ? item.name : undefined,
              type: typeof item.type === "string" ? item.type : undefined,
              priceBRL: Number.isFinite(Number(item.priceBRL ?? item.price))
                ? Number(item.priceBRL ?? item.price)
                : undefined,
              billing:
                item.billing === "annual" || item.billing === "monthly" ? item.billing : undefined,
            }))
            .filter((item: CartItem) => item.productId && Number.isFinite(item.qty) && item.qty > 0)
            .map((item: CartItem) => {
              if (
                item.productId.startsWith("domain:") &&
                item.priceBRL &&
                !findProduct(item.productId)
              ) {
                const domain = item.domain ?? item.name ?? item.productId.replace(/^domain:/, "");
                registerDomainProduct(domain, item.priceBRL);
              }
              return item;
            });
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

  const add = (
    productId: string,
    snapshot?: Partial<Omit<CartItem, "productId" | "qty">> & { qty?: number },
  ) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      const qty = Math.max(1, Math.trunc(Number(snapshot?.qty ?? 1)) || 1);
      if (existing)
        return prev.map((i) =>
          i.productId === productId ? { ...i, ...snapshot, qty: i.qty + qty } : i,
        );
      return [...prev, { productId, qty, ...snapshot }];
    });
  };
  const remove = (productId: string) => setItems((p) => p.filter((i) => i.productId !== productId));
  const setQty = (productId: string, qty: number) =>
    setItems((p) =>
      p.map((i) => (i.productId === productId ? { ...i, qty: Math.max(1, qty) } : i)),
    );
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
      subtotal += productSubtotalRef(p, c) * it.qty;
      total += productPeriodTotal(p, c) * it.qty;
    }
    const discount = Math.round((subtotal - total) * 100) / 100;
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discount,
      total: Math.round(total * 100) / 100,
    };
  }, [items, cycle]);

  const count = items.reduce((s, i) => s + i.qty, 0);

  return (
    <CartContext.Provider
      value={{ items, cycle, add, remove, setQty, setDomain, setCycle, clear, count, totals }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

/** Per-month price for monthly products; for annual products returns annual/12 (display-only). */
export function lineMonthly(productId: string, cycle: CycleId): number {
  const p = findProduct(productId);
  if (!p) return 0;
  if (isAnnualProduct(p)) return Math.round((p.basePriceBRL / 12) * 100) / 100;
  return monthlyPrice(p.basePriceBRL, findCycle(cycle));
}

/** Total billed for an item (one cycle period × qty). Domains: annual × qty. */
export function lineTotal(productId: string, cycle: CycleId, qty: number): number {
  const p = findProduct(productId);
  if (!p) return 0;
  return Math.round(productPeriodTotal(p, findCycle(cycle)) * qty * 100) / 100;
}

/** Unit price (per month for recurring, per year for annual). */
export function lineUnit(productId: string, cycle: CycleId): number {
  const p = findProduct(productId);
  if (!p) return 0;
  return productUnitPrice(p, findCycle(cycle));
}

export { CATALOG, isAnnualProduct };
