---
description: Add a new case study section/page for a project. Pass the project name or brief as args.
agent: orchestrator
---
Add a case study for: $ARGUMENTS

Orchestrate per AGENTS.md routing:
1. Clarify with one short question if the brief is ambiguous (goals, audience, media assets, where it lives).
2. Delegate implementation to `developer` (page/section, content pipeline, routing, performance) and visual work to `designer` (layout, typography, spacing, a11y presentation) as needed.
3. Sequence: designer and/or developer first; then, if requested, hand off to `social` for an announcement draft (never auto-publish).
4. Keep changes small and reviewable; match existing architecture, naming, and patterns.
5. After non-trivial changes, run or clearly propose project scripts (install/build/test/lint as defined in the repo).
6. Summarize what was delegated and the resulting diff.

Scope guard: this is a portfolio repo. Reject or reframe requests that would turn it into an unrelated product. Do not commit secrets. Prefer English for agent prompts; social drafts may be ES/EN.