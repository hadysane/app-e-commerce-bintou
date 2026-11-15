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
