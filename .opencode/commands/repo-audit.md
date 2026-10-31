---
description: Audit the repo (structure, a11y, performance, content) without making changes unless asked.
agent: orchestrator
---
Audit the portfolio repository. Scope: $ARGUMENTS (default: full repo).

Steps:
1. Explore the tree (HTML/CSS/assets/config) without drive-by refactors.
2. Delegate specifics: implementation/bugs/perf → `developer`; visual/a11y presentation → `designer`.
3. Report:
   - Structure overview and key entry points.
   - Accessibility issues (contrast, focus, semantic HTML, reduced motion).
   - Performance concerns (images, bundle, unnecessary client JS).
   - Content/SEO gaps.
   - Suggested next steps ordered by impact.
4. Do not modify files unless the user explicitly asks to apply fixes. Prefer minimal, reviewable changes later.

Truthfulness: do not invent repo structure, metrics, or bio facts — read the tree or ask. Match the user's language for conversation; agent prompts in English.