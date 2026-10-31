/**
 * post-to-x.ts — Programmatic X (Twitter) publish entrypoint.
 *
 * Posts a tweet via the X API v2 using user-context OAuth 1.0a.
 *
 * Required environment variables (never hardcoded; set in your shell or .env loader):
 *   X_API_KEY              - Consumer key (API key)
 *   X_API_SECRET           - Consumer secret (API secret)
 *   X_ACCESS_TOKEN         - User access token
 *   X_ACCESS_TOKEN_SECRET  - User access token secret
 *
 * Usage:
 *   npx tsx scripts/post-to-x.ts --text "Hello world"
 *   npx tsx scripts/post-to-x.ts "Hello world" --media ./image.png
 *   npx tsx scripts/post-to-x.ts --text "Hello" --dry-run
 *
 * Notes:
 *   - OAuth 1.0a user context is required to post as the user. App-only bearer
 *     tokens cannot create tweets.
 *   - Media is uploaded first via the v1.1 media/upload endpoint, then the
 *     returned media_id is attached to the tweet.
 *   - No secrets are stored in this file or committed to the repo.
 */

import { readFileSync } from "node:fs";
import { basename, extname } from "node:path";
import crypto from "node:crypto";

const TWEET_URL = "https://api.x.com/2/tweets";
const MEDIA_UPLOAD_URL = "https://upload.twitter.com/1.1/media/upload.json";

const REQUIRED_ENV = [
  "X_API_KEY",
  "X_API_SECRET",
  "X_ACCESS_TOKEN",
  "X_ACCESS_TOKEN_SECRET",
] as const;

type Env = {
  X_API_KEY: string;
  X_API_SECRET: string;
  X_ACCESS_TOKEN: string;
  X_ACCESS_TOKEN_SECRET: string;
};

function rfc3986Encode(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (c) => {
    return "%" + c.charCodeAt(0).toString(16).toUpperCase();
  });
}

function getEnv(): Env | null {
  const missing = REQUIRED_ENV.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    console.error("Missing required environment variables:");
    for (const name of missing) {
      console.error(`  - ${name}`);
    }
    console.error(
      "Set them in your environment (or a local .env not committed) and retry."
    );
    return null;
  }
  return {
    X_API_KEY: process.env.X_API_KEY as string,
    X_API_SECRET: process.env.X_API_SECRET as string,
    X_ACCESS_TOKEN: process.env.X_ACCESS_TOKEN as string,
    X_ACCESS_TOKEN_SECRET: process.env.X_ACCESS_TOKEN_SECRET as string,
  };
}

function oauthHeader(
  method: string,
  url: string,
  env: Env,
  extraParams: Record<string, string> = {}
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: env.X_API_KEY,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: env.X_ACCESS_TOKEN,
    oauth_version: "1.0",
  };

  const allParams: Record<string, string> = { ...oauthParams, ...extraParams };
  const paramString = Object.keys(allParams)
    .sort()
    .map((k) => `${rfc3986Encode(k)}=${rfc3986Encode(allParams[k])}`)
    .join("&");

  const baseString = `${method.toUpperCase()}&${rfc3986Encode(url)}&${rfc3986Encode(paramString)}`;
  const signingKey = `${rfc3986Encode(env.X_API_SECRET)}&${rfc3986Encode(env.X_ACCESS_TOKEN_SECRET)}`;
  const signature = crypto
    .createHmac("sha1", signingKey)
    .update(baseString)
    .digest("base64");

  oauthParams.oauth_signature = signature;

  return (
    "OAuth " +
    Object.keys(oauthParams)
      .sort()
      .map((k) => `${rfc3986Encode(k)}="${rfc3986Encode(oauthParams[k])}"`)
      .join(", ")
  );
}

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
};

function mimeForPath(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}

async function uploadMedia(filePath: string, env: Env): Promise<string> {
  const buffer = readFileSync(filePath);
  const mime = mimeForPath(filePath);
  const form = new FormData();
  form.append("media", new Blob([buffer], { type: mime }), basename(filePath));

  const res = await fetch(MEDIA_UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: oauthHeader("POST", MEDIA_UPLOAD_URL, env),
    },
    body: form,
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Media upload failed (${res.status}): ${text}`);
  }
  const data = JSON.parse(text) as { media_id_string?: string };
  if (!data.media_id_string) {
    throw new Error(`Media upload response missing media_id_string: ${text}`);
  }
  return data.media_id_string;
}

type Args = {
  text: string;
  media?: string;
  dryRun: boolean;
};

function parseArgs(argv: string[]): Args {
  const args: Args = { text: "", dryRun: false };
  const positional: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--text" || a === "-t") {
      args.text = argv[++i] ?? "";
    } else if (a === "--media" || a === "-m") {
      args.media = argv[++i];
    } else if (a === "--dry-run") {
      args.dryRun = true;
    } else if (a === "--help" || a === "-h") {
      console.log(
        "Usage: post-to-x.ts [--text \"...\"] [positional text] [--media path] [--dry-run]"
      );
      process.exit(0);
    } else {
      positional.push(a);
    }
  }
  if (!args.text && positional.length > 0) {
    args.text = positional.join(" ");
  }
  return args;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (!args.text) {
    console.error("Error: tweet text is required (--text or positional).");
    process.exit(1);
  }
  if (args.text.length > 280) {
    console.error(`Error: tweet text is ${args.text.length} chars (max 280).`);
    process.exit(1);
  }

  const env = getEnv();
  if (!env) {
    process.exit(1);
  }

  let mediaId: string | undefined;
  if (args.media) {
    if (args.dryRun) {
      console.log(`[dry-run] would upload media: ${args.media}`);
    } else {
      mediaId = await uploadMedia(args.media, env);
      console.log(`Uploaded media: ${mediaId}`);
    }
  }

  const payload: Record<string, unknown> = { text: args.text };
  if (mediaId) {
    payload.media = { media_ids: [mediaId] };
  }
  // In dry-run with media, reflect intended attachment without an id.
  if (args.dryRun && args.media && !mediaId) {
    payload.media = { media_ids: ["<uploaded-media-id>"] };
  }

  if (args.dryRun) {
    console.log("[dry-run] POST", TWEET_URL);
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const res = await fetch(TWEET_URL, {
    method: "POST",
    headers: {
      Authorization: oauthHeader("POST", TWEET_URL, env),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`Tweet failed (${res.status}): ${text}`);
    process.exit(1);
  }

  const data = JSON.parse(text) as { data?: { id?: string } };
  const id = data.data?.id;
  if (!id) {
    console.error(`Unexpected response: ${text}`);
    process.exit(1);
  }
  console.log(`Tweet posted: https://x.com/i/web/status/${id}`);
  console.log(`Tweet id: ${id}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
