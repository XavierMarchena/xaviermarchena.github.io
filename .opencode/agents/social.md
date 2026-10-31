---
description: DEPRECATED — split into x-social (sociotechnical X posts) and linkedin-social (technical/educational LinkedIn posts). Kept as a notice only.
mode: subagent
model: opencode/beam-free
temperature: 0.5
tools:
  read: true
  write: true
  edit: true
  bash: true
  grep: true
  glob: true
---

# REEMPLAZADO / Deprecated — Social (split)

This agent has been replaced. Use the two specialized agents instead:

- **`x-social`** (`.opencode/agents/x-social.md`) — sociotechnical conversations on X: tech culture,
  work, AI in society, careers, leadership. Publishes to X only after explicit approval via
  `scripts/post-to-x.ts`.
- **`linkedin-social`** (`.opencode/agents/linkedin-social.md`) — technical & educational content on
  LinkedIn: coding, frameworks, courses, professional development. Draft-only; no LinkedIn publish
  path exists yet.

Do not route new work to this agent. Keep this file as a pointer only.
