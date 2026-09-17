import { describe, expect, it } from "vitest";
import { getPublicMenu } from "./db";
import { CAFE_PRODUCTS } from "./cafeSeed";

describe("persisted Coffeemistry menu catalog", () => {
  it("returns the exact six categories and 24 distinct persisted products", async () => {
    const categories = await getPublicMenu();
    const products = categories.flatMap(category => category.products);

    expect(categories.map(category => category.slug)).toEqual([
      "espresso-based", "slow-bar", "sandwiches", "desserts", "beverages", "bakery-items",
    ]);
    expect(products).toHaveLength(24);
    expect(new Set(products.map(product => product.slug)).size).toBe(24);
    expect(products.find(product => product.slug === "spanish-latte")).toMatchObject({
      name: "Spanish Latte", pricePkr: 750, size: "8 Oz.", description: "A sweeter & creamier latte",
    });
    expect(products.map(product => ({ slug: product.slug, name: product.name, pricePkr: product.pricePkr, description: product.description })).sort((a, b) => a.slug.localeCompare(b.slug))).toEqual(
      CAFE_PRODUCTS.map(product => ({ slug: product.slug, name: product.name, pricePkr: product.pricePkr, description: product.description })).sort((a, b) => a.slug.localeCompare(b.slug)),
    );
    expect(products.every(product => Array.isArray(product.images))).toBe(true);
    expect(products.every(product => product.images.length === 1)).toBe(true);
    expect(products.every(product => product.images[0]?.isPrimary)).toBe(true);
    expect(products.every(product => product.images[0]?.url.startsWith("/manus-storage/coffeemistry-"))).toBe(true);
    expect(products.every(product => product.imageUrl === product.images[0]?.url)).toBe(true);
    expect(products.every(product => product.imageAlt === `${product.name} at Coffeemistry, F-8/1, Islamabad`)).toBe(true);
  });
});
