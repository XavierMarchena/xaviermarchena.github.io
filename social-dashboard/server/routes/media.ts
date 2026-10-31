import { Hono } from "hono";
import { existsSync, mkdirSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { DATA_DIR } from "../storage.js";

const MEDIA_DIR = join(DATA_DIR, "media");
if (!existsSync(MEDIA_DIR)) mkdirSync(MEDIA_DIR, { recursive: true });

const route = new Hono();

route.post("/upload", async (c) => {
  const formData = await c.req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return c.json({ error: "file required" }, 400);
  const buf = Buffer.from(await file.arrayBuffer());
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const fullPath = join(MEDIA_DIR, safeName);
  writeFileSync(fullPath, buf);
  return c.json({ path: fullPath, name: safeName, size: buf.length, type: file.type });
});

route.get("/list", (c) => {
  const files = readdirSync(MEDIA_DIR).map((f: string) => ({
    name: f,
    path: join(MEDIA_DIR, f),
    size: statSync(join(MEDIA_DIR, f)).size,
  }));
  return c.json(files);
});

export default route;