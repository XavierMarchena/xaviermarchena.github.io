import { useState, useEffect } from "react";

type Health = { ok: boolean; dataDir: string; portfolioRepo: string };
type Agent = { id: string; mode: string };
type Draft = { id: number; platform: string; language: string; agent: string; title: string | null; body: string; source_url: string | null; media_path: string | null; status: string; char_count: number; updated_at: string };
type Poll = { id: number; source: string; title: string; url: string | null; summary: string | null; fetched_at: string };
type LogEntry = { id: number; draft_id: number | null; platform: string; status: string; result: string; created_at: string };

export default function App() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selected, setSelected] = useState("orchestrator");
  const [prompt, setPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState("");

  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [newDraft, setNewDraft] = useState({ platform: "x", language: "EN", agent: "x-social", body: "" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editBody, setEditBody] = useState("");

  const [polls, setPolls] = useState<Poll[]>([]);
  const [newPoll, setNewPoll] = useState({ source: "", title: "", url: "", summary: "" });

  const [publishDraftId, setPublishDraftId] = useState<number | null>(null);
  const [publishPreview, setPublishPreview] = useState<string>("");
  const [publishResult, setPublishResult] = useState<string>("");
  const [publishApproved, setPublishApproved] = useState(false);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [newSchedule, setNewSchedule] = useState({ draft_id: 0, cron_expr: "0 9 * * *" });

  useEffect(() => {
    fetch("/api/health").then((r) => r.json()).then(setHealth).catch((e) => setError(String(e)));
    fetch("/api/agents/list").then((r) => r.json()).then(setAgents).catch(() => {});
    loadDrafts();
    loadPolls();
    loadLogs();
    loadSchedules();
  }, []);

  function loadDrafts() { fetch("/api/drafts").then((r) => r.json()).then(setDrafts).catch(() => {}); }
  function loadPolls() { fetch("/api/polls").then((r) => r.json()).then(setPolls).catch(() => {}); }
  function loadLogs() { fetch("/api/publish/log").then((r) => r.json()).then(setLogs).catch(() => {}); }
  function loadSchedules() { fetch("/api/scheduler").then((r) => r.json()).then(setSchedules).catch(() => {}); }
  async function createSchedule() {
    if (!newSchedule.draft_id || !newSchedule.cron_expr.trim()) return;
    await fetch("/api/scheduler", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newSchedule) });
    loadSchedules();
  }
  async function removeSchedule(id: number) {
    await fetch(`/api/scheduler/${id}`, { method: "DELETE" });
    loadSchedules();
  }
  async function toggleSchedule(id: number, enabled: boolean) {
    await fetch(`/api/scheduler/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled }) });
    loadSchedules();
  }

  async function run() {
    setRunning(true); setOutput("");
    try {
      const r = await fetch("/api/agents/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agent: selected, prompt }) });
      const data = await r.json();
      setOutput(data.output ?? data.error ?? JSON.stringify(data));
    } catch (e: any) { setOutput(String(e?.message ?? e)); }
    finally { setRunning(false); }
  }

  async function createDraft() {
    if (!newDraft.body.trim()) return;
    await fetch("/api/drafts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newDraft) });
    setNewDraft({ ...newDraft, body: "" });
    loadDrafts();
  }

  async function saveEdit(id: number) {
    await fetch(`/api/drafts/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: editBody }) });
    setEditingId(null); loadDrafts();
  }

  async function removeDraft(id: number) {
    await fetch(`/api/drafts/${id}`, { method: "DELETE" });
    loadDrafts();
  }

  async function createPoll() {
    if (!newPoll.source.trim() || !newPoll.title.trim()) return;
    await fetch("/api/polls", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newPoll) });
    setNewPoll({ source: "", title: "", url: "", summary: "" });
    loadPolls();
  }

  async function removePoll(id: number) {
    await fetch(`/api/polls/${id}`, { method: "DELETE" });
    loadPolls();
  }

  async function previewPublish() {
    if (!publishDraftId) return;
    setPublishPreview("loading…");
    const r = await fetch("/api/publish/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ draft_id: publishDraftId }) });
    const data = await r.json();
    setPublishPreview(data.stdout || data.stderr || JSON.stringify(data));
  }

  async function doPublish() {
    if (!publishDraftId || !publishApproved) return;
    setPublishResult("publishing…");
    const r = await fetch("/api/publish/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ draft_id: publishDraftId, approved: true }) });
    const data = await r.json();
    setPublishResult(data.status === "published" ? "✅ published" : `❌ ${data.status}\n${data.stderr || data.stdout}`);
    loadDrafts(); loadLogs();
  }

  const card = "rounded-xl border border-slate-800 bg-slate-900/60 p-5";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Social Agent Dashboard</h1>
          <p className="text-xs text-slate-400">Orchestrator control center · portfolio social media</p>
        </div>
        <span className="text-xs px-2 py-1 rounded bg-emerald-900/40 text-emerald-300 border border-emerald-800">
          {health?.ok ? "online" : "connecting…"}
        </span>
      </header>

      <main className="p-6 space-y-6">
        <section className={card}>
          <h2 className="font-medium mb-3">Agent Runner</h2>
          <div className="flex gap-3 mb-3">
            <select value={selected} onChange={(e) => setSelected(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm">
              {agents.map((a) => (<option key={a.id} value={a.id}>{a.id} ({a.mode})</option>))}
            </select>
            <button onClick={run} disabled={running || !prompt.trim()} className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-sm font-medium">
              {running ? "Running…" : "Run"}
            </button>
          </div>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Prompt for the agent…" className="w-full h-28 bg-slate-800 border border-slate-700 rounded p-3 text-sm font-mono" />
          {output && <pre className="mt-3 p-3 bg-slate-950 border border-slate-800 rounded text-xs whitespace-pre-wrap max-h-96 overflow-auto">{output}</pre>}
        </section>

        <section className={card}>
          <h2 className="font-medium mb-3">Drafts Board</h2>
          <div className="grid gap-3 md:grid-cols-4 mb-4">
            <select value={newDraft.platform} onChange={(e) => setNewDraft({ ...newDraft, platform: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm">
              <option value="x">X</option>
              <option value="linkedin">LinkedIn</option>
            </select>
            <select value={newDraft.language} onChange={(e) => setNewDraft({ ...newDraft, language: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm">
              <option value="EN">EN</option>
              <option value="ES">ES</option>
            </select>
            <select value={newDraft.agent} onChange={(e) => setNewDraft({ ...newDraft, agent: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm">
              <option value="x-social">x-social</option>
              <option value="linkedin-social">linkedin-social</option>
            </select>
            <button onClick={createDraft} disabled={!newDraft.body.trim()} className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-sm font-medium">Save Draft</button>
          </div>
          <textarea value={newDraft.body} onChange={(e) => setNewDraft({ ...newDraft, body: e.target.value })} placeholder="Draft body…" className="w-full h-24 bg-slate-800 border border-slate-700 rounded p-3 text-sm font-mono mb-4" />
          <div className="space-y-3">
            {drafts.map((d) => (
              <div key={d.id} className="border border-slate-700 rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-700">{d.platform.toUpperCase()} · {d.language} · {d.agent} · {d.char_count} chars · {d.status}</span>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingId(d.id); setEditBody(d.body); }} className="text-xs text-indigo-400 hover:underline">edit</button>
                    <button onClick={() => removeDraft(d.id)} className="text-xs text-red-400 hover:underline">delete</button>
                  </div>
                </div>
                {editingId === d.id ? (
                  <div>
                    <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} className="w-full h-24 bg-slate-800 border border-slate-700 rounded p-3 text-sm font-mono" />
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => saveEdit(d.id)} className="px-3 py-1 rounded bg-indigo-600 text-xs">Save</button>
                      <button onClick={() => setEditingId(null)} className="px-3 py-1 rounded bg-slate-700 text-xs">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <pre className="text-sm whitespace-pre-wrap text-slate-200">{d.body}</pre>
                )}
              </div>
            ))}
            {drafts.length === 0 && <p className="text-sm text-slate-500">No drafts yet.</p>}
          </div>
        </section>

        <section className={card}>
          <h2 className="font-medium mb-3">Live Poll Feed</h2>
          <div className="grid gap-3 md:grid-cols-4 mb-4">
            <input value={newPoll.source} onChange={(e) => setNewPoll({ ...newPoll, source: e.target.value })} placeholder="Source (e.g. Latinometrics)" className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm" />
            <input value={newPoll.title} onChange={(e) => setNewPoll({ ...newPoll, title: e.target.value })} placeholder="Title / trend" className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm" />
            <input value={newPoll.url} onChange={(e) => setNewPoll({ ...newPoll, url: e.target.value })} placeholder="URL" className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm" />
            <button onClick={createPoll} disabled={!newPoll.source.trim() || !newPoll.title.trim()} className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-sm font-medium">Add</button>
          </div>
          <textarea value={newPoll.summary} onChange={(e) => setNewPoll({ ...newPoll, summary: e.target.value })} placeholder="Summary / notes…" className="w-full h-20 bg-slate-800 border border-slate-700 rounded p-3 text-sm font-mono mb-4" />
          <div className="space-y-2">
            {polls.map((p) => (
              <div key={p.id} className="border border-slate-700 rounded p-3 flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="text-xs text-slate-400 mb-1">{p.source} · {p.fetched_at}</div>
                  <div className="text-sm font-medium">{p.title}</div>
                  {p.url && <a href={p.url} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:underline">{p.url}</a>}
                  {p.summary && <p className="text-xs text-slate-400 mt-1">{p.summary}</p>}
                </div>
                <button onClick={() => removePoll(p.id)} className="text-xs text-red-400 hover:underline">delete</button>
              </div>
            ))}
            {polls.length === 0 && <p className="text-sm text-slate-500">No poll items yet.</p>}
          </div>
        </section>

        <section className={card}>
          <h2 className="font-medium mb-3">Publish Gate</h2>
          <p className="text-xs text-slate-400 mb-3">Approval required. Preview runs <code className="text-indigo-300">--dry-run</code> first; publish only after explicit approval.</p>
          <div className="flex gap-3 mb-3">
            <select value={publishDraftId ?? ""} onChange={(e) => { setPublishDraftId(Number(e.target.value) || null); setPublishPreview(""); setPublishResult(""); setPublishApproved(false); }} className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm flex-1">
              <option value="">Select a draft…</option>
              {drafts.map((d) => (<option key={d.id} value={d.id}>#{d.id} {d.platform.toUpperCase()} {d.language} — {d.body.slice(0, 40)}…</option>))}
            </select>
            <button onClick={previewPublish} disabled={!publishDraftId} className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-sm font-medium">Preview (dry-run)</button>
          </div>
          {publishPreview && <pre className="mb-3 p-3 bg-slate-950 border border-slate-800 rounded text-xs whitespace-pre-wrap max-h-48 overflow-auto">{publishPreview}</pre>}
          <label className="flex items-center gap-2 text-sm mb-3">
            <input type="checkbox" checked={publishApproved} onChange={(e) => setPublishApproved(e.target.checked)} />
            I explicitly approve publishing this draft
          </label>
          <button onClick={doPublish} disabled={!publishDraftId || !publishApproved} className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 disabled:opacity-50 text-sm font-medium">Publish</button>
          {publishResult && <pre className="mt-3 p-3 bg-slate-950 border border-slate-800 rounded text-xs whitespace-pre-wrap">{publishResult}</pre>}
        </section>

        <section className={card}>
          <h2 className="font-medium mb-3">Scheduler (cron)</h2>
          <p className="text-xs text-slate-400 mb-3">Schedule drafts to publish on a cron expression. Format: <code className="text-indigo-300">min hour day month weekday</code> (e.g. <code className="text-indigo-300">0 9 * * *</code> = daily 9am).</p>
          <div className="flex gap-3 mb-3">
            <select value={newSchedule.draft_id} onChange={(e) => setNewSchedule({ ...newSchedule, draft_id: Number(e.target.value) })} className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm flex-1">
              <option value={0}>Select a draft…</option>
              {drafts.map((d) => (<option key={d.id} value={d.id}>#{d.id} {d.platform.toUpperCase()} {d.language}</option>))}
            </select>
            <input value={newSchedule.cron_expr} onChange={(e) => setNewSchedule({ ...newSchedule, cron_expr: e.target.value })} placeholder="0 9 * * *" className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm w-40" />
            <button onClick={createSchedule} disabled={!newSchedule.draft_id || !newSchedule.cron_expr.trim()} className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-sm font-medium">Schedule</button>
          </div>
          <div className="space-y-2">
            {schedules.map((s: any) => (
              <div key={s.id} className="border border-slate-700 rounded p-3 flex items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="text-xs text-slate-400 mb-1">#{s.id} · draft #{s.draft_id} ({s.platform} {s.language}) · {s.cron_expr} · {s.enabled ? "enabled" : "disabled"} · last run: {s.last_run ?? "never"}</div>
                  <div className="text-sm text-slate-300 truncate">{s.body?.slice(0, 60)}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleSchedule(s.id, !s.enabled)} className="text-xs text-indigo-400 hover:underline">{s.enabled ? "disable" : "enable"}</button>
                  <button onClick={() => removeSchedule(s.id)} className="text-xs text-red-400 hover:underline">delete</button>
                </div>
              </div>
            ))}
            {schedules.length === 0 && <p className="text-sm text-slate-500">No scheduled posts yet.</p>}
          </div>
        </section>

        <section className={card}>
          <h2 className="font-medium mb-3">Publish History</h2>
          <div className="space-y-2">
            {logs.map((l) => (
              <div key={l.id} className="border border-slate-700 rounded p-3">
                <div className="text-xs text-slate-400 mb-1">#{l.id} · {l.platform} · {l.status} · {l.created_at}</div>
                <pre className="text-xs whitespace-pre-wrap text-slate-300 max-h-24 overflow-auto">{l.result}</pre>
              </div>
            ))}
            {logs.length === 0 && <p className="text-sm text-slate-500">No publish history yet.</p>}
          </div>
        </section>
      </main>

      <footer className="px-6 py-4 text-xs text-slate-500 border-t border-slate-800">
        {health ? <>data: {health.dataDir} · repo: {health.portfolioRepo}</> : error ? <span className="text-red-400">{error}</span> : "loading…"}
      </footer>
    </div>
  );
}