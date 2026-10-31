import { Hono } from "hono";
import { db } from "../storage.js";

const route = new Hono();

route.get("/", (c) => {
  const rows = db.prepare("SELECT * FROM poll_items ORDER BY fetched_at DESC").all();
  return c.json(rows);
});

route.post("/", async (c) => {
  const b = await c.req.json<{ source: string; title: string; url?: string; summary?: string }>();
  if (!b?.source || !b?.title) return c.json({ error: "source and title required" }, 400);
  const info = db.prepare("INSERT INTO poll_items (source, title, url, summary) VALUES (?,?,?,?)").run(b.source, b.title, b.url ?? null, b.summary ?? null);
  return c.json({ id: Number(info.lastInsertRowid) });
});

route.delete("/:id", (c) => {
  db.prepare("DELETE FROM poll_items WHERE id = ?").run(Number(c.req.param("id")));
  return c.json({ ok: true });
});

export default route;