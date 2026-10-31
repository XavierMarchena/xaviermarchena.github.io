import { Hono } from "hono";
import { db } from "../storage.js";
import { spawn } from "node:child_process";
import { join } from "node:path";

const PORTFOLIO_REPO = process.env.PORTFOLIO_REPO_PATH ?? "C:\\Users\\xavim\\xaviermarchena.github.io";
const route = new Hono();

function runScript(script: string, args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn("npx", ["tsx", join(PORTFOLIO_REPO, "scripts", script), ...args], {
      cwd: PORTFOLIO_REPO,
      shell: true,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("close", (code) => resolve({ code: code ?? -1, stdout, stderr }));
  });
}

// Dry-run preview
route.post("/preview", async (c) => {
  const b = await c.req.json<{ draft_id: number }>();
  const draft = db.prepare("SELECT * FROM drafts WHERE id = ?").get(b.draft_id) as any;
  if (!draft) return c.json({ error: "draft not found" }, 404);
  const script = draft.platform === "linkedin" ? "post-to-linkedin.ts" : "post-to-x.ts";
  const args = ["--dry-run", "--text", draft.body];
  if (draft.media_path) args.push("--media", draft.media_path);
  const res = await runScript(script, args);
  db.prepare("INSERT INTO publish_log (draft_id, platform, status, payload, result) VALUES (?,?,?,?,?)").run(
    draft.id, draft.platform, "preview", JSON.stringify({ text: draft.body, media: draft.media_path }), res.stdout || res.stderr
  );
  return c.json({ script, ...res });
});

// Publish (requires explicit approval flag)
route.post("/publish", async (c) => {
  const b = await c.req.json<{ draft_id: number; approved: boolean }>();
  if (!b?.approved) return c.json({ error: "explicit approval required (approved: true)" }, 403);
  const draft = db.prepare("SELECT * FROM drafts WHERE id = ?").get(b.draft_id) as any;
  if (!draft) return c.json({ error: "draft not found" }, 404);
  const script = draft.platform === "linkedin" ? "post-to-linkedin.ts" : "post-to-x.ts";
  const args = ["--text", draft.body];
  if (draft.media_path) args.push("--media", draft.media_path);
  const res = await runScript(script, args);
  const status = res.code === 0 ? "published" : "failed";
  db.prepare("INSERT INTO publish_log (draft_id, platform, status, payload, result) VALUES (?,?,?,?,?)").run(
    draft.id, draft.platform, status, JSON.stringify({ text: draft.body, media: draft.media_path }), res.stdout || res.stderr
  );
  if (status === "published") {
    db.prepare("UPDATE drafts SET status='published', updated_at=datetime('now') WHERE id=?").run(draft.id);
  }
  return c.json({ status, ...res });
});

route.get("/log", (c) => {
  const rows = db.prepare("SELECT * FROM publish_log ORDER BY created_at DESC LIMIT 50").all();
  return c.json(rows);
});

export default route;