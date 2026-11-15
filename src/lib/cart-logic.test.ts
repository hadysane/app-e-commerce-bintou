import { describe, expect, it } from "vitest";
import { addLine, cartCount, cartSubtotal, setLineQty } from "./cart-logic";

describe("panier", () => {
  it("ajouter deux fois le même article dans la même taille augmente la quantité", () => {
    const lines = addLine(addLine([], "robe-awa", "M"), "robe-awa", "M");
    expect(lines).toEqual([{ slug: "robe-awa", size: "M", qty: 2 }]);
  });

  it("une autre taille crée une ligne séparée", () => {
    const lines = addLine(addLine([], "robe-awa", "M"), "robe-awa", "L");
    expect(lines).toHaveLength(2);
  });

  it("mettre la quantité à 0 retire l'article", () => {
    const lines = setLineQty([{ slug: "robe-awa", size: "M", qty: 2 }], "robe-awa", "M", 0);
    expect(lines).toEqual([]);
  });

  it("calcule le nombre d'articles et le sous-total en euros", () => {
    const lines = [
      { slug: "robe-awa", size: "M", qty: 2 }, // 2 x 89
      { slug: "duo-dioula", size: "Taille unique", qty: 1 }, // 39
    ];
    expect(cartCount(lines)).toBe(3);
    expect(cartSubtotal(lines)).toBe(217);
  });
});

import { stockFor, validateCart } from "./cart-logic";

describe("stock", () => {
  const stock = { "robe-awa|M": 3, "jupe-ama|XL": 0 };

  it("une taille sans ligne de stock compte comme épuisée", () => {
    expect(stockFor(stock, "robe-awa", "L")).toBe(0);
  });

  it("refuse de commander plus que le stock disponible", () => {
    const r = validateCart([{ slug: "robe-awa", size: "M", qty: 4 }], stock);
    expect(r.ok).toBe(false);
  });

  it("refuse une taille épuisée", () => {
    const r = validateCart([{ slug: "jupe-ama", size: "XL", qty: 1 }], stock);
    expect(r).toEqual({ ok: false, message: "Jupe Ama (XL) est épuisé." });
  });

  it("accepte une commande dans la limite du stock, avec le prix du catalogue", () => {
    const r = validateCart([{ slug: "robe-awa", size: "M", qty: 3 }], stock);
    expect(r.ok && r.total).toBe(267);
  });
});
