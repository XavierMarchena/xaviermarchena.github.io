---
description: Publish an explicitly approved X post via scripts/post-to-x.ts. Pass the approved draft or index as args.
agent: x-social
---
Publish to X ONLY because the user has explicitly approved.

Approved content: $ARGUMENTS

Rules (AGENTS.md §5.4, §6.7):
- Publishing is approval-gated and non-negotiable. If approval is not unambiguous in this request, STOP and ask for confirmation before doing anything.
- Use `scripts/post-to-x.ts` (or the documented equivalent). Never invent tokens; credentials come from environment variables.
- Media: upload first, then attach `media_ids`.
- Rate discipline: no high-volume posting unless asked.
- Do not commit secrets or print token values.

Steps:
1. Confirm approval is explicit. If not, ask one short question and stop.
2. Verify `scripts/post-to-x.ts` exists; if not, report that publishing is blocked.
3. Run the script with the approved content, capturing output.
4. Report the result (success/failure, tweet id if returned) and any rate-limit or billing notes. Do not retry automatically on failure.