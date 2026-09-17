import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const { createOrder, getOrderForCustomer, getCheckoutQuote } = vi.hoisted(() => ({
  createOrder: vi.fn(),
  getOrderForCustomer: vi.fn(),
  getCheckoutQuote: vi.fn(),
}));

vi.mock("./db", () => ({
  createOrder,
  getOrderForCustomer,
  getPublicMenu: vi.fn(),
  getCheckoutQuote,
  getAdminOrders: vi.fn(),
  advanceOrderStatus: vi.fn(),
}));

import { appRouter } from "./routers";

function guestContext(): TrpcContext {
  return { user: null, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("public order procedures", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a valid guest pickup order with a generated public reference", async () => {
    createOrder.mockResolvedValue({ orderId: 7, orderNumber: "CFM-A1B2C3", subtotalPkr: 750, totalPkr: 750, status: "new" });
    const result = await appRouter.createCaller(guestContext()).order.create({
      customerName: "Ada Lovelace", phone: "+923001234567", whatsapp: "+923001234567", orderType: "pickup", items: [{ productId: 8, quantity: 1 }],
    });
    expect(result).toEqual({ orderId: 7, orderNumber: "CFM-A1B2C3", subtotalPkr: 750, totalPkr: 750, status: "new" });
    expect(createOrder).toHaveBeenCalledWith(expect.objectContaining({ customerName: "Ada Lovelace", orderType: "pickup", orderNumber: expect.stringMatching(/^CFM-/) }));
  });

  it("keeps order creation independent of image-enriched client product data", async () => {
    createOrder.mockResolvedValue({ orderId: 8, orderNumber: "CFM-Z9Y8X7", subtotalPkr: 630, totalPkr: 630, status: "new" });
    await appRouter.createCaller(guestContext()).order.create({ customerName: "Grace Hopper", phone: "+923001234568", whatsapp: "+923001234568", orderType: "pickup", items: [{ productId: 11, quantity: 1 }] });
    expect(createOrder).toHaveBeenCalledWith(expect.objectContaining({ items: [{ productId: 11, quantity: 1 }] }));
  });

  it("returns an order summary only when the submitted phone number matches", async () => {
    getOrderForCustomer.mockResolvedValue({ order: { orderNumber: "CFM-A1B2C3", status: "new" }, items: [{ productName: "Spanish Latte", quantity: 1 }], estimatedOrderTime: null });
    const result = await appRouter.createCaller(guestContext()).order.track({ orderNumber: "CFM-A1B2C3", phone: "+923001234567" });
    expect(getOrderForCustomer).toHaveBeenCalledWith("CFM-A1B2C3", "+923001234567");
    expect(result?.order.orderNumber).toBe("CFM-A1B2C3");
  });

  it("creates a WhatsApp / Pay on Confirmation order without customer payment input", async () => {
    createOrder.mockResolvedValue({ orderId: 9, orderNumber: "CFM-WHATS", subtotalPkr: 750, totalPkr: 750, status: "new" });
    const result = await appRouter.createCaller(guestContext()).order.create({ customerName: "Sadia", phone: "+923001234567", whatsapp: "+923001234567", orderType: "pickup", items: [{ productId: 1, quantity: 1 }] });
    expect(result).toMatchObject({ orderNumber: "CFM-WHATS", status: "new" });
    expect(createOrder).toHaveBeenCalledWith(expect.objectContaining({ whatsapp: "+923001234567", orderType: "pickup", items: [{ productId: 1, quantity: 1 }] }));
  });

  it("returns a server-calculated pickup quote for the selected cart lines", async () => {
    getCheckoutQuote.mockResolvedValue({ subtotalPkr: 1450, totalPkr: 1450, currency: "PKR" });
    const result = await appRouter.createCaller(guestContext()).order.quote({ orderType: "pickup", items: [{ productId: 1, quantity: 2 }] });
    expect(getCheckoutQuote).toHaveBeenCalledWith({ orderType: "pickup", items: [{ productId: 1, quantity: 2 }] });
    expect(result).toEqual({ subtotalPkr: 1450, totalPkr: 1450, currency: "PKR" });
  });
});
