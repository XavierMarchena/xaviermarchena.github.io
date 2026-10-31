---
description: Regenerate or refresh the four portfolio agents from AGENTS.md, keeping frontmatter and roles aligned.
agent: orchestrator
---
Refresh the agent definitions under `.opencode/agents/` so they match the contract in `AGENTS.md`.

Steps:
1. Read `AGENTS.md` fully — it is the source of truth for roles, routing, tools, and safety.
2. For each of `orchestrator`, `developer`, `designer`, `x-social`, `linkedin-social`, create or update `.opencode/agents/<name>.md` with valid YAML frontmatter per §3 and the role body per §5.
3. Ensure `opencode.jsonc` keeps `model: opencode/beam-free` and `default_agent: orchestrator`; do not duplicate full agent prompts there.
4. Optionally scaffold `knowledge/*.md` stubs from §7 only if missing and the user wants them; never invent personal data.
5. If `scripts/post-to-x.ts` is missing, note in `x-social.md` that publishing is blocked until it exists.
6. Report what was created/updated and how to invoke each agent.

Do not invent extra primary agents. Prefer improving existing files over replacing them. Keep agent prompts in English.