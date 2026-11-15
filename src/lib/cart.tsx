import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { addLine, cartCount, setLineQty, type CartLine } from "./cart-logic";

const STORAGE_KEY = "bintou-cart";

type CartContextValue = {
  lines: CartLine[];
  count: number;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  add: (slug: string, size: string) => void;
  setQty: (slug: string, size: string, qty: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
    } catch {
      // ignore corrupted storage
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, loaded]);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: cartCount(lines),
      isOpen,
      setOpen,
      add: (slug, size) => {
        setLines((prev) => addLine(prev, slug, size));
        setOpen(true);
      },
      setQty: (slug, size, qty) => setLines((prev) => setLineQty(prev, slug, size, qty)),
      clear: () => setLines([]),
    }),
    [lines, isOpen],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
