import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const clientRoot = path.resolve(import.meta.dirname, "..");
const indexHtml = readFileSync(path.join(clientRoot, "index.html"), "utf8");
const robots = readFileSync(path.join(clientRoot, "public", "robots.txt"), "utf8");
const sitemap = readFileSync(path.join(clientRoot, "public", "sitemap.xml"), "utf8");
const visitPage = readFileSync(path.join(clientRoot, "src", "pages", "Visit.tsx"), "utf8");

describe("Coffeemistry crawl-visible technical SEO", () => {
  it("publishes canonical, social, and local-business metadata with the confirmed location", () => {
    expect(indexHtml).toContain('<link rel="canonical" href="https://coffeemenu-juytsaxg.manus.space/" />');
    expect(indexHtml).toContain('property="og:image"');
    expect(indexHtml).toContain('name="twitter:image"');
    expect(indexHtml).toContain('Shop 1 & 2, Block 8 Allahwali Market, F-8/1');
    expect(indexHtml).toContain('+92 307 8263333');
    expect(indexHtml).toContain('display=swap');
  });

  it("uses absolute sitemap and robots URLs for crawl discovery", () => {
    expect(robots).toContain('Sitemap: https://coffeemenu-juytsaxg.manus.space/sitemap.xml');
    expect(sitemap).toContain('<loc>https://coffeemenu-juytsaxg.manus.space/menu</loc>');
    expect(sitemap).not.toContain('<loc>/menu</loc>');
  });

  it("keeps the confirmed full address visible on the public visit page without unverified postal details", () => {
    expect(visitPage).toContain("Shop 1 & 2, Block 8 Allahwali Market, F-8/1, Islamabad, Pakistan");
    expect(visitPage).not.toContain("F-8/1, F-8, Islamabad, 44000");
  });
});
