import { Hono } from "hono";
import { db } from "../storage.js";
import cron from "node-cron";
import { spawn } from "node:child_process";
import { join } from "node:path";

const PORTFOLIO_REPO = process.env.PORTFOLIO_REPO_PATH ?? "C:\\Users\\xavim\\xaviermarchena.github.io";
const jobs = new Map<number, cron.ScheduledTask>();

function runPublish(draftId: number) {
  const draft = db.prepare("SELECT * FROM drafts WHERE id = ?").get(draftId) as any;
  if (!draft) return;
  const script = draft.platform === "linkedin" ? "post-to-linkedin.ts" : "post-to-x.ts";
  const args = ["--text", draft.body];
  if (draft.media_path) args.push("--media", draft.media_path);
  const child = spawn("npx", ["tsx", join(PORTFOLIO_REPO, "scripts", script), ...args], { cwd: PORTFOLIO_REPO, shell: true });
  let out = "";
  child.stdout.on("data", (d) => (out += d.toString()));
  child.stderr.on("data", (d) => (out += d.toString()));
  child.on("close", (code) => {
    db.prepare("INSERT INTO publish_log (draft_id, platform, status, payload, result) VALUES (?,?,?,?,?)").run(
      draft.id, draft.platform, code === 0 ? "published" : "failed", JSON.stringify({ text: draft.body }), out
    );
    db.prepare("UPDATE scheduled_posts SET last_run=datetime('now') WHERE draft_id=?").run(draftId);
  });
}

function loadJobs() {
  const rows = db.prepare("SELECT * FROM scheduled_posts WHERE enabled=1").all() as any[];
  for (const r of rows) {
    if (jobs.has(r.id)) continue;
    if (!cron.validate(r.cron_expr)) continue;
    const task = cron.schedule(r.cron_expr, () => runPublish(r.draft_id));
    jobs.set(r.id, task);
  }
}

// Load on startup
loadJobs();

const route = new Hono();

route.get("/", (c) => {
  const rows = db.prepare("SELECT s.*, d.platform, d.language, d.body FROM scheduled_posts s JOIN drafts d ON d.id=s.draft_id ORDER BY s.created_at DESC").all();
  return c.json(rows);
});

route.post("/", (c) => {
  return c.req.json().then((b: any) => {
    if (!b?.draft_id || !b?.cron_expr) return c.json({ error: "draft_id and cron_expr required" }, 400);
    if (!cron.validate(b.cron_expr)) return c.json({ error: "invalid cron expression" }, 400);
    const info = db.prepare("INSERT INTO scheduled_posts (draft_id, cron_expr) VALUES (?,?)").run(b.draft_id, b.cron_expr);
    const id = Number(info.lastInsertRowid);
    const task = cron.schedule(b.cron_expr, () => runPublish(b.draft_id));
    jobs.set(id, task);
    return c.json({ id });
  });
});

route.patch("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const b = await c.req.json<{ enabled?: boolean }>();
  db.prepare("UPDATE scheduled_posts SET enabled=? WHERE id=?").run(b.enabled ? 1 : 0, id);
  const job = jobs.get(id);
  if (b.enabled === false && job) { job.stop(); jobs.delete(id); }
  if (b.enabled === true) {
    const row = db.prepare("SELECT * FROM scheduled_posts WHERE id=?").get(id) as any;
    if (row && cron.validate(row.cron_expr)) {
      const task = cron.schedule(row.cron_expr, () => runPublish(row.draft_id));
      jobs.set(id, task);
    }
  }
  return c.json({ ok: true });
});

route.delete("/:id", (c) => {
  const id = Number(c.req.param("id"));
  const job = jobs.get(id);
  if (job) { job.stop(); jobs.delete(id); }
  db.prepare("DELETE FROM scheduled_posts WHERE id=?").run(id);
  return c.json({ ok: true });
});

export default route;