import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "../server/_core/oauth";
import { registerStorageProxy } from "../server/_core/storageProxy";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import { getPublicMenu } from "../server/db";

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Health check endpoints for cloud monitoring & testing
app.get(["/health", "/api/health"], (_req, res) => {
  res.status(200).json({ status: "ok", service: "coffeemistry-api", timestamp: new Date().toISOString() });
});

// Direct REST catalog endpoint for testing and verified responses
app.get(["/api/menu", "/api/menu/list", "/api/catalog"], async (_req, res) => {
  try {
    const menu = await getPublicMenu();
    res.status(200).json(menu);
  } catch (error) {
    console.error("[API menu] error:", error);
    res.status(500).json({ error: "Failed to load catalog" });
  }
});

// Storage and OAuth proxies
registerStorageProxy(app);
registerOAuthRoutes(app);

// tRPC API - mounted at both /api/trpc and /trpc to match any Vercel routing path
const trpcMiddleware = createExpressMiddleware({
  router: appRouter,
  createContext,
});

app.use("/api/trpc", trpcMiddleware);
app.use("/trpc", trpcMiddleware);

export default app;
