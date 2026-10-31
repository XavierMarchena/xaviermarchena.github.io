# Social Agent Dashboard

Local control center for the portfolio's social-media agent harness. A web app that runs on your machine and lets you trigger the OpenCode orchestrator + sub-agents, visualize and redact drafts, upload media, gate publishing behind explicit approval, and schedule posts.

## Quick start

```bash
cd social-dashboard
npm install
npm run dev        # server (4321) + client (5173) concurrently
```

- Server API: http://localhost:4321
- Client (Vite dev): http://localhost:5173 (proxies `/api` to the server)
- Production build: `npm run build` then `npm start`

## Stack

- **Backend**: Node.js + Hono + `@opencode/sdk` (embedded OpenCode instance) + `better-sqlite3`
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Realtime**: SSE (planned)
- **Storage**: SQLite at `data/dashboard.db` (gitignored) + media files under `data/media/`

## Environment variables

| Var | Default | Purpose |
|---|---|---|
| `PORT` | `4321` | Server port |
| `DATA_DIR` | `./data` | SQLite + media location |
| `PORTFOLIO_REPO_PATH` | `C:\Users\xavim\xaviermarchena.github.io` | Path to the portfolio repo (agents, knowledge, publish scripts) |

## API routes

| Route | Method | Description |
|---|---|---|
| `/api/health` | GET | Health check; returns data dir + portfolio repo path |
| `/api/agents/list` | GET | List available agents (from `.opencode/agents/`) |
| `/api/agents/run` | POST | Run an agent `{ agent, prompt }` → `{ sessionId, output }` |
| `/api/drafts` | GET | List drafts (optional `?platform=x\|linkedin`) |
| `/api/drafts/:id` | GET | Get a draft + its version history |
| `/api/drafts` | POST | Create draft `{ platform, language, agent, body, title?, source_url?, media_path? }` |
| `/api/drafts/:id` | PUT | Update draft (body change creates a new version) |
| `/api/drafts/:id` | DELETE | Delete draft |
| `/api/media/upload` | POST | Upload a file (multipart `file`) → `{ path, name, size, type }` |
| `/api/media/list` | GET | List uploaded media |
| `/api/polls` | GET | List poll items |
| `/api/polls` | POST | Create poll item `{ source, title, url?, summary? }` |
| `/api/polls/:id` | DELETE | Delete poll item |
| `/api/publish/preview` | POST | Dry-run preview `{ draft_id }` |
| `/api/publish/publish` | POST | Publish `{ draft_id, approved: true }` |
| `/api/publish/log` | GET | Publish history |
| `/api/scheduler` | GET | List scheduled posts |
| `/api/scheduler` | POST | Create schedule `{ draft_id, cron_expr }` |
| `/api/scheduler/:id` | PATCH | Toggle enabled `{ enabled }` |
| `/api/scheduler/:id` | DELETE | Delete schedule |

## Database schema

- `drafts` — id, platform, language, agent, title, body, source_url, media_path, status, char_count, timestamps
- `draft_versions` — id, draft_id, body, created_at (one row per edit)
- `poll_items` — id, source, title, url, summary, fetched_at
- `publish_log` — id, draft_id, platform, status, payload, result, created_at

## Project layout

```
social-dashboard/
  server/
    index.ts          # Hono app + static serving + route wiring
    agents.ts         # OpenCode SDK integration (session create + prompt + context)
    storage.ts        # SQLite setup + DATA_DIR export
    routes/
      agents.ts       # /api/agents
      drafts.ts       # /api/drafts
      media.ts        # /api/media
  client/
    src/
      App.tsx         # Main UI (agent runner + drafts board)
      main.tsx
      index.css
    vite.config.ts
    index.html
  data/             # gitignored — sqlite + media
  README.md
```

## Cross-repo contract

The dashboard reads from and invokes scripts in the sibling portfolio repo (`PORTFOLIO_REPO_PATH`):

- `.opencode/agents/*.md` — agent roster & roles
- `knowledge/*.md` — profile, location, voice/brand context
- `scripts/post-to-x.ts` — X publish entrypoint (exists)
- `scripts/post-to-linkedin.ts` — LinkedIn publish entrypoint (to be scaffolded)

## Modules

| Module | Status |
|---|---|
| Agent runner (SDK) | ✅ Working |
| Drafts board (CRUD + versioning) | ✅ Working |
| Media manager (upload + list) | ✅ Working |
| Storage layer (SQLite) | ✅ Working |
| Live poll feed | ✅ Working |
| Publish gate (approval + dry-run) | ✅ Working |
| Scheduler (cron) | ✅ Working |
| History / log view | ✅ Working |
| `scripts/post-to-linkedin.ts` | ✅ Scaffolded (env-gated) |

## Notes

- Drafts are stored locally in SQLite; `data/` is gitignored.
- Publishing requires explicit user approval naming the variant (per AGENTS.md). The publish gate is not yet implemented; `scripts/post-to-x.ts` exists in the portfolio repo and can be invoked manually.
- The OpenCode SDK is loaded via dynamic `import()` because the package is ESM-only with top-level await.