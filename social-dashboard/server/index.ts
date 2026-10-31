import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 4321);
const DATA_DIR = process.env.DATA_DIR ?? join(__dirname, "..", "data");
const PORTFOLIO_REPO = process.env.PORTFOLIO_REPO_PATH ?? "C:\\Users\\xavim\\xaviermarchena.github.io";

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
if (!existsSync(join(DATA_DIR, "media"))) mkdirSync(join(DATA_DIR, "media"), { recursive: true });

const app = new Hono();
app.use("*", cors());

// Health
app.get("/api/health", (c) => c.json({ ok: true, dataDir: DATA_DIR, portfolioRepo: PORTFOLIO_REPO }));

import agentsRoute from "./routes/agents.js";
import draftsRoute from "./routes/drafts.js";
import mediaRoute from "./routes/media.js";
import pollsRoute from "./routes/polls.js";
import publishRoute from "./routes/publish.js";
import schedulerRoute from "./routes/scheduler.js";
app.route("/api/agents", agentsRoute);
app.route("/api/drafts", draftsRoute);
app.route("/api/media", mediaRoute);
app.route("/api/polls", pollsRoute);
app.route("/api/publish", publishRoute);
app.route("/api/scheduler", schedulerRoute);

// Serve client build in production
const clientDist = join(__dirname, "..", "client", "dist");
if (existsSync(clientDist)) {
  const MIME: Record<string, string> = {
  ".html": "text/html; charset=UTF-8",
  ".js": "application/javascript; charset=UTF-8",
  ".css": "text/css; charset=UTF-8",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};
app.get("*", async (c) => {
    const fs = await import("node:fs/promises");
    const ext = (c.req.path.match(/\.[a-z0-9]+$/i)?.[0] ?? "").toLowerCase();
    const filePath = c.req.path === "/" ? "index.html" : c.req.path;
    const resolvedExt = filePath === "index.html" ? ".html" : ext;
    const path = join(clientDist, filePath);
    try {
      const buf = await fs.readFile(path);
      return c.body(buf, 200, { "Content-Type": MIME[resolvedExt] ?? "application/octet-stream" });
    } catch {
      const idx = await fs.readFile(join(clientDist, "index.html"));
      return c.body(idx, 200, { "Content-Type": "text/html; charset=UTF-8" });
    }
  });
}

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`[dashboard] listening on http://localhost:${info.port}`);
  console.log(`[dashboard] data dir: ${DATA_DIR}`);
  console.log(`[dashboard] portfolio repo: ${PORTFOLIO_REPO}`);
});