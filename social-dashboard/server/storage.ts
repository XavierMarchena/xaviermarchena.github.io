import Database from "better-sqlite3";
import { join } from "node:path";
import { existsSync, mkdirSync } from "node:fs";

export const DATA_DIR = process.env.DATA_DIR ?? "C:\\Users\\xavim\\xaviermarchena.github.io\\social-dashboard\\data";
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(join(DATA_DIR, "dashboard.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS drafts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform TEXT NOT NULL,
    language TEXT NOT NULL,
    agent TEXT NOT NULL,
    title TEXT,
    body TEXT NOT NULL,
    source_url TEXT,
    media_path TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    char_count INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS draft_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    draft_id INTEGER NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (draft_id) REFERENCES drafts(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS poll_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    title TEXT NOT NULL,
    url TEXT,
    summary TEXT,
    fetched_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS publish_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    draft_id INTEGER,
    platform TEXT NOT NULL,
    status TEXT NOT NULL,
    payload TEXT,
    result TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS scheduled_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    draft_id INTEGER NOT NULL,
    cron_expr TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    last_run TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (draft_id) REFERENCES drafts(id) ON DELETE CASCADE
  );
`);

export { db };