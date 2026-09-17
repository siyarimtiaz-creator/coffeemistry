import { describe, expect, it } from "vitest";
import { CAFE_CATEGORIES, CAFE_PRODUCTS } from "./cafeSeed";
import { isAllowedStatusTransition } from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(user: TrpcContext["user"]): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Coffeemistry confirmed seed catalog", () => {
  it("has exactly six unique categories and 24 unique products", () => {
    expect(CAFE_CATEGORIES).toHaveLength(6);
    expect(new Set(CAFE_CATEGORIES.map(category => category.slug)).size).toBe(6);
    expect(CAFE_PRODUCTS).toHaveLength(24);
    expect(new Set(CAFE_PRODUCTS.map(product => product.slug)).size).toBe(24);
  });

  it("preserves the supplied Spanish Latte and signature cookie source data", () => {
    expect(CAFE_PRODUCTS.find(product => product.slug === "spanish-latte")).toMatchObject({
      name: "Spanish Latte", description: "A sweeter & creamier latte", size: "8 Oz.", pricePkr: 750,
    });
    expect(CAFE_PRODUCTS.find(product => product.slug === "signature-cookies")).toMatchObject({
      name: "Signature Cookies", description: "Nutella, Lotus and Marshmellows", pricePkr: 350,
    });
  });
});

describe("order workflow safeguards", () => {
  it("requires the owner-confirmed lifecycle to advance sequentially from new through ready", () => {
    expect(isAllowedStatusTransition("new", "preparing")).toBe(false);
    expect(isAllowedStatusTransition("confirmed", "preparing")).toBe(true);
    expect(isAllowedStatusTransition("preparing", "ready")).toBe(true);
    expect(isAllowedStatusTransition("confirmed", "ready")).toBe(false);
    expect(isAllowedStatusTransition("ready", "preparing")).toBe(false);
  });

  it("rejects a delivery order without a delivery address before persistence", async () => {
    const caller = appRouter.createCaller(createContext(null));
    await expect(caller.order.create({
      customerName: "Ada Lovelace", phone: "+923001234567", whatsapp: "+923001234567", orderType: "delivery", items: [{ productId: 1, quantity: 1 }],
    })).rejects.toMatchObject({ code: "BAD_REQUEST", message: "A delivery address is required for delivery orders." });
  });

  it("forbids a non-owner account from the administrative order queue", async () => {
    const caller = appRouter.createCaller(createContext({
      id: 1, openId: "customer-1", name: "Customer", email: "customer@example.com", loginMethod: "manus", role: "user",
      createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
    }));
    await expect(caller.admin.orders()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
