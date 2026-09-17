import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const { getAdminProductsWithImages, uploadProductImage, replaceProductImage, updateProductImage, reorderProductImages, removeProductImage } = vi.hoisted(() => ({
  getAdminProductsWithImages: vi.fn(), uploadProductImage: vi.fn(), replaceProductImage: vi.fn(), updateProductImage: vi.fn(), reorderProductImages: vi.fn(), removeProductImage: vi.fn(),
}));

vi.mock("./db", () => ({ getPublicMenu: vi.fn(), createOrder: vi.fn(), getOrderForCustomer: vi.fn(), getAdminOrders: vi.fn(), advanceOrderStatus: vi.fn() }));
vi.mock("./productMedia", () => ({ getAdminProductsWithImages, uploadProductImage, replaceProductImage, updateProductImage, reorderProductImages, removeProductImage }));

import { appRouter } from "./routers";

function context(role: "user" | "admin"): TrpcContext {
  return { user: { id: 1, openId: "photo-test", name: "Photo Test", email: null, loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

function anonymousContext(): TrpcContext { return { user: null, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] }; }

describe("product media administration", () => {
  beforeEach(() => vi.clearAllMocks());

  it("exposes product media only to the owner role", async () => {
    getAdminProductsWithImages.mockResolvedValue([{ id: 1, name: "Spanish Latte", images: [] }]);
    await expect(appRouter.createCaller(context("user")).admin.products()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(anonymousContext()).admin.products()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context("admin")).admin.products()).resolves.toEqual([{ id: 1, name: "Spanish Latte", images: [] }]);
  });

  it("accepts an owner-managed WebP upload contract", async () => {
    uploadProductImage.mockResolvedValue(16);
    const dataUrl = `data:image/webp;base64,${"A".repeat(48)}`;
    await expect(appRouter.createCaller(context("admin")).admin.uploadProductImage({ productId: 1, image: { dataUrl, width: 1200, height: 900 }, altText: "Spanish Latte at Coffeemistry in Islamabad", setPrimary: true })).resolves.toEqual({ id: 16 });
    expect(uploadProductImage).toHaveBeenCalledWith(expect.objectContaining({ productId: 1, setPrimary: true }));
  });

  it("routes primary selection, gallery ordering, and deletion only through owner procedures", async () => {
    updateProductImage.mockResolvedValue(5); reorderProductImages.mockResolvedValue(undefined); removeProductImage.mockResolvedValue(undefined);
    const owner = appRouter.createCaller(context("admin"));
    await expect(owner.admin.updateProductImage({ id: 5, productId: 1, altText: "Spanish Latte at Coffeemistry in Islamabad", isPrimary: true })).resolves.toEqual({ id: 5 });
    await expect(owner.admin.reorderProductImages({ productId: 1, imageIds: [7, 5, 8] })).resolves.toEqual({ success: true });
    await expect(owner.admin.deleteProductImage({ productId: 1, imageId: 5 })).resolves.toEqual({ success: true });
    expect(updateProductImage).toHaveBeenCalledWith(expect.objectContaining({ isPrimary: true }));
    expect(reorderProductImages).toHaveBeenCalledWith(1, [7, 5, 8]);
    expect(removeProductImage).toHaveBeenCalledWith(1, 5);
  });

  it("rejects excessively large encoded image payloads before storage", async () => {
    const hugeDataUrl = `data:image/webp;base64,${"A".repeat(15_000_001)}`;
    await expect(appRouter.createCaller(context("admin")).admin.uploadProductImage({ productId: 1, image: { dataUrl: hugeDataUrl } })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(uploadProductImage).not.toHaveBeenCalled();
  });

  it("rejects unsupported payloads and runs replacement as an owner-only atomic contract", async () => {
    replaceProductImage.mockResolvedValue(22);
    const owner = appRouter.createCaller(context("admin"));
    await expect(owner.admin.uploadProductImage({ productId: 1, image: { dataUrl: "data:image/gif;base64,QUJDREVGRw==" } })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(owner.admin.replaceProductImage({ productId: 1, imageId: 5, image: { dataUrl: `data:image/webp;base64,${"A".repeat(48)}` } })).resolves.toEqual({ id: 22 });
    expect(replaceProductImage).toHaveBeenCalledWith(expect.objectContaining({ productId: 1, imageId: 5 }));
  });

  it("rejects malformed image data URLs before reaching the storage helper", async () => {
    await expect(appRouter.createCaller(context("admin")).admin.uploadProductImage({ productId: 1, image: { dataUrl: "data:image/webp;base64,not valid base64!?" } })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(uploadProductImage).not.toHaveBeenCalled();
  });

  it("rejects a filename that could imply an unsafe storage path", async () => {
    await expect(appRouter.createCaller(context("admin")).admin.uploadProductImage({ productId: 1, originalFilename: "../not-an-image.webp", image: { dataUrl: `data:image/webp;base64,${"A".repeat(48)}` } })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(uploadProductImage).not.toHaveBeenCalled();
  });
});
