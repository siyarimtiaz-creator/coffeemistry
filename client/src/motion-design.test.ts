import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Coffeemistry motion design system", () => {
  const css = readFileSync(new URL("./index.css", import.meta.url), "utf8");
  const primitives = readFileSync(new URL("./components/motion/CinematicMotion.tsx", import.meta.url), "utf8");
  const productModal = readFileSync(new URL("./components/ProductModal.tsx", import.meta.url), "utf8");
  const productImage = readFileSync(new URL("./components/ProductImage.tsx", import.meta.url), "utf8");
  const productModalGallery = readFileSync(new URL("./components/ProductModal.tsx", import.meta.url), "utf8");
  const mediaManager = readFileSync(new URL("./components/ProductMediaManager.tsx", import.meta.url), "utf8");
  const layout = readFileSync(new URL("./components/CafeLayout.tsx", import.meta.url), "utf8");
  const home = readFileSync(new URL("./pages/Home.tsx", import.meta.url), "utf8");
  const checkout = readFileSync(new URL("./pages/Checkout.tsx", import.meta.url), "utf8");

  it("defines centralized timing tokens and honors reduced-motion preferences", () => {
    expect(css).toContain("--motion-fast");
    expect(css).toContain("--motion-cinematic");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain(".steam-layer { display: none; }");
  });

  it("keeps the ambient signature on composited transform and opacity animations", () => {
    expect(css).toContain("@keyframes cinematic-steam");
    expect(css).toContain("translate3d");
    expect(css).toContain("opacity");
  });

  it("uses a reduced-motion-safe parallax primitive and modal presence transition", () => {
    expect(primitives).toContain("export function Parallax");
    expect(primitives).toContain("reducedMotion ? [0, 0]");
    expect(productModal).toContain("<AnimatePresence>");
    expect(productModal).toContain("exit={{ opacity: 0");
  });

  it("uses owner photography first and only an honest branded image placeholder", () => {
    expect(productImage).toContain("product.images?.find");
    expect(productImage).toContain("Product image placeholder");
    expect(productImage).not.toContain("ProductArt");
  });

  it("keeps public galleries and the owner replacement workflow available without changing order components", () => {
    expect(productModalGallery).toContain("onTouchStart");
    expect(productModalGallery).toContain("fullscreen");
    expect(productModalGallery).toContain("Previous product photo");
    expect(mediaManager).toContain("replaceMutation.mutateAsync");
    expect(mediaManager).toContain("reorderProductImages");
  });

  it("defines the luxury dark-glass system and applies it to shared navigation plus public conversion surfaces", () => {
    expect(css).toContain(".glass-panel");
    expect(css).toContain("backdrop-filter: blur(20px)");
    expect(css).toContain(".cafe-shell");
    expect(layout).toContain("glass-panel sticky top-3");
    expect(home).toContain("glass-panel-soft");
    expect(checkout).toContain("Order via WhatsApp");
  });
});
