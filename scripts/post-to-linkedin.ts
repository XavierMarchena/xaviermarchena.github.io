/**
 * Programmatic LinkedIn publish entrypoint.
 *
 * Env vars (all required unless noted):
 *   LINKEDIN_CLIENT_ID          - OAuth 2.0 app client id
 *   LINKEDIN_CLIENT_SECRET       - OAuth 2.0 app client secret
 *   LINKEDIN_ACCESS_TOKEN        - User access token with w_member_social scope
 *   LINKEDIN_PERSON_URN          - urn:li:person:XXXX (the author)
 *
 * Usage:
 *   npx tsx scripts/post-to-linkedin.ts --text "..." [--media path] [--dry-run]
 *
 * LinkedIn API: POST https://api.linkedin.com/v2/ugcPosts
 * Docs: https://learn.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/ugc-post-api
 */

const args = process.argv.slice(2);
function getArg(name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}
const dryRun = args.includes("--dry-run");
const text = getArg("--text");
const mediaPath = getArg("--media");

const required = ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET", "LINKEDIN_ACCESS_TOKEN", "LINKEDIN_PERSON_URN"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error("Missing env vars:", missing.join(", "));
  process.exit(1);
}
if (!text) {
  console.error("Usage: npx tsx scripts/post-to-linkedin.ts --text \"...\" [--media path] [--dry-run]");
  process.exit(1);
}

const payload = {
  author: process.env.LINKEDIN_PERSON_URN,
  lifecycleState: "PUBLISHED",
  specificContent: {
    "com.linkedin.ugc.ShareContent": {
      shareCommentary: { text },
      shareMediaCategory: mediaPath ? "IMAGE" : "NONE",
      ...(mediaPath ? { media: [{ status: "READY", media: mediaPath }] } : {}),
    },
  },
  visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
};

if (dryRun) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(0);
}

(async () => {
  try {
    const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.LINKEDIN_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(payload),
    });
    const body = await res.text();
    if (!res.ok) {
      console.error("LinkedIn API error:", res.status, body);
      process.exit(1);
    }
    console.log("Posted. Response:", body);
  } catch (e: any) {
    console.error("Failed:", e?.message ?? e);
    process.exit(1);
  }
})();