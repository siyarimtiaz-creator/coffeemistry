import { describe, expect, it } from "vitest";
import { choosePrimaryImageFallback, defaultProductAlt, isSupportedProductImageMime, validateProductImageDataUrl } from "./productMedia";

describe("product media policy", () => {
  it("creates concise, product-specific Coffeemistry alt text", () => {
    expect(defaultProductAlt("Spanish Latte")).toBe("Spanish Latte at Coffeemistry in Islamabad");
  });

  it("permits only requested owner photo formats", () => {
    expect(isSupportedProductImageMime("image/jpeg")).toBe(true);
    expect(isSupportedProductImageMime("image/png")).toBe(true);
    expect(isSupportedProductImageMime("image/webp")).toBe(true);
    expect(isSupportedProductImageMime("image/gif")).toBe(false);
    expect(isSupportedProductImageMime("application/pdf")).toBe(false);
  });

  it("chooses the earliest remaining gallery item after a primary photo is deleted", () => {
    expect(choosePrimaryImageFallback([{ id: 8, sortOrder: 2 }, { id: 6, sortOrder: 0 }, { id: 7, sortOrder: 1 }])).toEqual({ id: 6, sortOrder: 0 });
    expect(choosePrimaryImageFallback([])).toBeNull();
  });

  it("verifies image bytes and retains server-measured dimensions", () => {
    const onePixelPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL7WAAAAABJRU5ErkJggg==";
    expect(validateProductImageDataUrl({ dataUrl: onePixelPng, width: 999, height: 999 })).toMatchObject({ mimeType: "image/png", width: 1, height: 1 });
    expect(() => validateProductImageDataUrl({ dataUrl: "data:image/png;base64,QUJDRA==" })).toThrow("not a valid image");
    expect(() => validateProductImageDataUrl({ dataUrl: onePixelPng.replace("image/png", "image/webp") })).toThrow("not a valid image");
  });
});
