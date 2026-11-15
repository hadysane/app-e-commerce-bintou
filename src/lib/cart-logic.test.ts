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
