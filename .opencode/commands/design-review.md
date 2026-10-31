---
description: Visual/interaction design review of a page or component. Pass the file path or area as args.
agent: designer
---
Perform a visual and interaction design review for: $ARGUMENTS

Focus (AGENTS.md §5.3):
- Visual hierarchy, spacing, typography, color, motion.
- Accessibility: contrast, focus visibility, reduced-motion friendliness.
- Design tokens / CSS variables / component-level UI polish.
- Responsive behavior.
- Avoid generic "AI slop" layouts; aim for distinctive but credible.

Deliverables:
1. Findings grouped by severity (blocker / major / minor / nit).
2. Concrete file-level UI changes recommended, noting which need `developer` to wire data/logic.
3. Any token/CSS variable additions or changes.
4. Handoff notes for `developer`.

Do not change site design system without a design task; this command is a review by default. Only edit files if the user explicitly asks to apply changes. Prefer `knowledge/voice-and-brand.md` for visual/tone constraints when present. Keep diffs minimal.