import { Hono } from "hono";
import { db } from "../storage.js";

const route = new Hono();

route.get("/", (c) => {
  const platform = c.req.query("platform");
  const rows = platform
    ? db.prepare("SELECT * FROM drafts WHERE platform = ? ORDER BY updated_at DESC").all(platform)
    : db.prepare("SELECT * FROM drafts ORDER BY updated_at DESC").all();
  return c.json(rows);
});

route.get("/:id", (c) => {
  const id = Number(c.req.param("id"));
  const draft = db.prepare("SELECT * FROM drafts WHERE id = ?").get(id);
  if (!draft) return c.json({ error: "not found" }, 404);
  const versions = db.prepare("SELECT * FROM draft_versions WHERE draft_id = ? ORDER BY created_at DESC").all(id);
  return c.json({ ...draft, versions });
});

route.post("/", async (c) => {
  const b = await c.req.json<{ platform: string; language: string; agent: string; title?: string; body: string; source_url?: string; media_path?: string }>();
  if (!b?.platform || !b?.language || !b?.agent || !b?.body) {
    return c.json({ error: "platform, language, agent, body required" }, 400);
  }
  const charCount = b.body.length;
  const info = db.prepare(
    "INSERT INTO drafts (platform, language, agent, title, body, source_url, media_path, char_count) VALUES (?,?,?,?,?,?,?,?)"
  ).run(b.platform, b.language, b.agent, b.title ?? null, b.body, b.source_url ?? null, b.media_path ?? null, charCount);
  const id = Number(info.lastInsertRowid);
  db.prepare("INSERT INTO draft_versions (draft_id, body) VALUES (?,?)").run(id, b.body);
  return c.json({ id });
});

route.put("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const b = await c.req.json<{ body?: string; title?: string; status?: string; media_path?: string; source_url?: string }>();
  const existing = db.prepare("SELECT * FROM drafts WHERE id = ?").get(id) as any;
  if (!existing) return c.json({ error: "not found" }, 404);
  const body = b.body ?? existing.body;
  db.prepare(
    "UPDATE drafts SET body=?, title=COALESCE(?,title), status=COALESCE(?,status), media_path=COALESCE(?,media_path), source_url=COALESCE(?,source_url), char_count=?, updated_at=datetime('now') WHERE id=?"
  ).run(body, b.title ?? null, b.status ?? null, b.media_path ?? null, b.source_url ?? null, body.length, id);
  if (b.body && b.body !== existing.body) {
    db.prepare("INSERT INTO draft_versions (draft_id, body) VALUES (?,?)").run(id, b.body);
  }
  return c.json({ ok: true });
});

route.delete("/:id", (c) => {
  const id = Number(c.req.param("id"));
  db.prepare("DELETE FROM drafts WHERE id = ?").run(id);
  return c.json({ ok: true });
});

export default route;