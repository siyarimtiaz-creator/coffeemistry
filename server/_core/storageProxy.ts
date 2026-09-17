import fs from "node:fs";
import path from "node:path";
import type { Express } from "express";
import { ENV } from "./env";

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    // Check local static assets first (in public directory)
    const baseName = path.basename(key);
    const candidatePaths = [
      path.resolve(process.cwd(), "client", "public", "product", baseName),
      path.resolve(process.cwd(), "client", "public", "assets", "products", baseName),
      path.resolve(process.cwd(), "client", "public", "assets", "hero", baseName),
      path.resolve(process.cwd(), "client", "public", "product", key),
      path.resolve(process.cwd(), "dist", "public", "product", baseName),
      path.resolve(process.cwd(), "dist", "public", "assets", "products", baseName),
      path.resolve(process.cwd(), "dist", "public", "assets", "hero", baseName),
    ];

    for (const candidate of candidatePaths) {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        res.set("Cache-Control", "public, max-age=31536000, immutable");
        return res.sendFile(candidate);
      }
    }

    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(404).send("Asset not found");
      return;
    }

    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/",
      );
      forgeUrl.searchParams.set("path", key);

      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
      });

      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }

      const { url } = (await forgeResp.json()) as { url: string };
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }

      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}
