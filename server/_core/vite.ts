import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export function getPublicShellDelivery(pathname: string) {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  const isKnownRoute = normalizedPath === "/" || ["/menu", "/checkout", "/admin", "/admin/orders", "/about", "/experience", "/reviews", "/visit", "/privacy", "/terms", "/404"].includes(normalizedPath) || /^\/menu\/[^/]+$/.test(normalizedPath) || /^\/order\/[^/]+$/.test(normalizedPath);
  const isPrivateRoute = normalizedPath === "/checkout" || normalizedPath === "/admin" || normalizedPath === "/admin/orders" || normalizedPath.startsWith("/order/");
  return { isKnownRoute, isPrivateRoute };
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.get("/index.html", (_req, res) => res.redirect(301, "/"));
  app.use(express.static(distPath, {
    index: false,
    redirect: false,
    setHeaders(res, filePath) {
      if (filePath.includes(`${path.sep}assets${path.sep}`)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else {
        res.setHeader("Cache-Control", "public, max-age=14400");
      }
    },
  }));

  // The SPA shell is shared and contains no customer-specific data, so edge caches can
  // revalidate it briefly while hashed build assets remain immutable for a year.
  app.use("*", (req, res) => {
    const { isKnownRoute, isPrivateRoute } = getPublicShellDelivery(new URL(req.originalUrl, "http://coffeemistry.local").pathname);
    if (isPrivateRoute || !isKnownRoute) res.setHeader("X-Robots-Tag", "noindex, nofollow");
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=300, stale-while-revalidate=86400");
    if (!isKnownRoute) res.status(404);
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
