import { getProduct } from "./products";

export type CartLine = { slug: string; size: string; qty: number };

export function addLine(lines: CartLine[], slug: string, size: string, qty = 1): CartLine[] {
  const existing = lines.find((l) => l.slug === slug && l.size === size);
  if (existing) {
    return lines.map((l) => (l === existing ? { ...l, qty: l.qty + qty } : l));
  }
  return [...lines, { slug, size, qty }];
}

export function setLineQty(lines: CartLine[], slug: string, size: string, qty: number): CartLine[] {
  if (qty <= 0) return lines.filter((l) => !(l.slug === slug && l.size === size));
  return lines.map((l) => (l.slug === slug && l.size === size ? { ...l, qty } : l));
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((n, l) => n + l.qty, 0);
}

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + (getProduct(l.slug)?.price ?? 0) * l.qty, 0);
}

export type StockMap = Record<string, number>;

export function stockKey(slug: string, size: string): string {
  return `${slug}|${size}`;
}

/** Quantity available for a size; a size with no stock row counts as sold out. */
export function stockFor(stock: StockMap | undefined, slug: string, size: string): number {
  return stock?.[stockKey(slug, size)] ?? 0;
}

export type CheckedItem = { slug: string; size: string; qty: number; name: string; price: number };

export type CartCheck =
  | { ok: true; items: CheckedItem[]; total: number }
  | { ok: false; message: string };

/** Server-side check before payment: every line must exist and be within stock. */
export function validateCart(lines: CartLine[], stock: StockMap): CartCheck {
  if (lines.length === 0) return { ok: false, message: "Votre panier est vide." };
  const items: CheckedItem[] = [];
  for (const line of lines) {
    const product = getProduct(line.slug);
    if (!product || !product.sizes.includes(line.size) || !Number.isInteger(line.qty) || line.qty < 1) {
      return { ok: false, message: "Un article de votre panier n'est plus disponible." };
    }
    const available = stockFor(stock, line.slug, line.size);
    if (available === 0) {
      return { ok: false, message: `${product.name} (${line.size}) est épuisé.` };
    }
    if (line.qty > available) {
      return {
        ok: false,
        message: `Il ne reste que ${available} ${product.name} en taille ${line.size}.`,
      };
    }
    items.push({ slug: line.slug, size: line.size, qty: line.qty, name: product.name, price: product.price });
  }
  return { ok: true, items, total: items.reduce((s, i) => s + i.price * i.qty, 0) };
}
