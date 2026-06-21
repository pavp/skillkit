# Proposal: canonical-skill-format

## Intent

### Problem
skillkit's purpose is to maintain AI agent skills as a single agent-agnostic source of truth that compiles to per-agent outputs. Today there is no source of truth at all: skills are authored and installed manually, directly into each agent's per-agent folder (`~/.claude/skills/`, `~/.config/opencode/skills/`, etc.). The repo itself is near-greenfield — it has SDD/registry tooling files but no canonical skill source, no schema, no adapters, and no build pipeline. Around 25 skills already exist as manually-placed `SKILL.md` files spread across these agent directories.

Maintaining a skill means editing N copies by hand, one per agent. There is nothing enforcing that a skill installed for Claude Code stays consistent with the same skill installed for OpenCode, and nothing validating that frontmatter is well-formed before it lands in an agent's load path. As more agents are supported, this manual duplication cost grows linearly and silently drifts.

### Why now
The repo was just bootstrapped for exactly this purpose, and exploration confirmed a key enabling fact: the `SKILL.md` format (YAML frontmatter + markdown body) is **already converged** across Claude Code and OpenCode — both consume an identical file. That makes the first slice cheap: the canonical source can BE the `SKILL.md` we already write, and the build pipeline's real work is frontmatter normalization plus install-path routing, not body translation. Building the pipeline now, while the surface is small and the format is converged, establishes the architecture before more divergent targets (Cursor agents, Copilot) force harder decisions.

### Success looks like
- A single canonical `SKILL.md` per skill is the only thing an author edits.
- Running the build validates frontmatter against a schema and installs each skill, correctly normalized, to the global Claude Code and OpenCode skill directories.
- Universal vs. agent-scoped frontmatter fields are formally registered, so adapters cannot silently drift.
- Existing installed skills are never clobbered or corrupted by the install step; the operation is reversible.

## Scope

### In scope (v1)
1. **Canonical format = markdown-first frontmatter superset (Approach A).** The canonical source is a single `SKILL.md`-style file: YAML frontmatter + markdown body. The body is copied unchanged to every target. The build's job is frontmatter normalization + install-path routing.
2. **Targets: Claude Code + OpenCode only.** Two adapters. Each: copy body unchanged, strip frontmatter fields not in that agent's allowlist, route to the agent's install path. Both already consume an identical format, so adapters are near-trivial.
3. **Install scope: GLOBAL.**
   - Claude Code → `~/.claude/skills/{name}/SKILL.md`
   - OpenCode → `~/.config/opencode/skills/{name}/SKILL.md`
   This matches how skills are installed today.
4. **Frontmatter validation via JSON Schema + formal field registry.** A JSON Schema validates the canonical frontmatter. A formal field registry / allowlist distinguishes **universal** fields (e.g. `name`, `description`, `trigger`, `license`, `metadata.*`) from **agent-scoped** fields (e.g. `disable-model-invocation`, `user-invocable` for Claude Code). The registry is the single source that adapters consult when stripping, which prevents silent drift.
5. **Clean, documented extension points** for future targets (new adapter interface, new field-registry entries) — defined but NOT implemented for deferred targets.
6. **Non-destructive, reversible install step** (see Rollback plan).

### Out of scope — Non-goals (v1)
These are explicitly deferred to a future change. The architecture should leave clean extension points for them but MUST NOT implement them now:
- **Cursor skills** (`~/.cursor/skills/{name}/SKILL.md`) — no v1 adapter.
- **Cursor agent files** (`~/.cursor/agents/{name}.md`) — different frontmatter schema (`model`, `readonly`, `background`); deferred.
- **GitHub Copilot aggregation adapter** (`.github/copilot-instructions.md`) — Copilot has no per-skill format; aggregation is the highest-risk unknown and is deferred.
- **Project-local install** (`.claude/skills/`, repo-level) — v1 is global install only.
- **Per-agent body divergence** (tagged sections / per-agent bodies) — v1 ships one shared body for all targets.
- Auto-regeneration of `.atl/skill-registry.md` after install — not required for v1.

## Approach

High-level pipeline:

```
canonical SKILL.md (frontmatter superset + body)
        │
        ▼
  [1] Schema validation  ── JSON Schema over frontmatter
        │                   + field registry (universal vs agent-scoped)
        ▼
  [2] Adapter (per target) ── strip non-allowlisted frontmatter
        │                      copy body unchanged
        ▼
  [3] Install (per target) ── route to global path, non-destructive write
        │
        ▼
  ~/.claude/skills/{name}/SKILL.md
  ~/.config/opencode/skills/{name}/SKILL.md
```

Rationale per locked decision:
- **Markdown-first (A)** because the body format is already identical across both v1 targets; authoring stays "write one SKILL.md, it works everywhere," and there is zero body translation to build or maintain.
- **Field registry as the anti-drift mechanism**: rather than each adapter hardcoding "which fields do I keep," there is one declarative registry mapping each known field to `universal` or a specific agent. An adapter strips everything not universal-or-mine. Adding a target or a field is a registry edit, not adapter surgery — this is the primary extension point.
- **Adapter interface as extension point**: each adapter implements a small uniform contract (validate-input → transform-frontmatter → resolve-install-path → write). Future Cursor/Copilot adapters slot into the same contract; Copilot's aggregation differs but conforms to the same "produce output from canonical sources" shape. The interface is defined in v1; only Claude Code and OpenCode implementations ship.
- **Global install** matches current reality and avoids introducing a project-local resolution concern in the first slice.

Concrete affected areas (greenfield — these are new files the spec/design/tasks phases will detail):
- `schemas/skill.schema.json` — JSON Schema for canonical frontmatter.
- field registry (e.g. `schemas/field-registry.*` or a TS module) — universal vs agent-scoped field map.
- `src/adapters/` — adapter interface + `claude` and `opencode` implementations.
- `src/build.ts` (or equivalent entry) — orchestrates validate → adapt → install.
- canonical source directory (name to be decided in spec/design; candidates `skills/` or `src/skills/`).

## Rollback plan

This is a greenfield build pipeline, so the code itself is trivially reversible (revert the change / delete generated `src`). The real risk is the **install step mutating the user's existing global skill directories** where ~25 skills already live. Rollback / safety requirements:

1. **Non-destructive by default.** The install step MUST NOT delete or overwrite skill directories it did not produce. Writing a skill that does not exist in the canonical source MUST NOT touch unrelated existing skills.
2. **Reversible writes.** Before overwriting an existing `SKILL.md` at a target path, the install step MUST be able to restore the prior state — e.g. back up the previous file, or operate via a dry-run + atomic replace that can be undone. A failed or aborted build MUST leave the target directories in their pre-build state.
3. **Dry-run capability.** The pipeline SHOULD support a no-write mode that reports exactly which paths it would create/overwrite, so a user can verify nothing unexpected is clobbered before committing to disk.
4. **Repo-level rollback.** Since artifacts live in git (hybrid store), reverting the change removes the pipeline; combined with (1)–(3) the user's installed skills remain intact.

The spec phase should encode these as testable requirements (MUST/SHOULD) for the install step.

## Risks

1. **Existing ~25 installed skills must not be clobbered.** The global install paths already contain hand-placed skills. Highest-priority safety constraint; addressed by the Rollback plan (non-destructive, reversible, dry-run). The spec MUST make these guarantees explicit.
2. **Frontmatter superset drift.** Without the formal field registry, adapters would silently diverge on which fields to keep/strip. Mitigation is in scope: the registry is the single declarative source adapters consult; adding it is a v1 requirement, not optional.
3. **Greenfield = no tests yet.** `strict_tdd: false`, no test runner configured. The pipeline mutates the user's home directory, which is exactly where untested code is dangerous. Mitigation: the dry-run mode and non-destructive guarantees reduce blast radius; the design/tasks phases should consider at least a lightweight verification path (e.g. dry-run output assertions) even absent a formal test framework.
4. **Source directory naming / discoverability** is an open decision (`skills/` vs `src/skills/` vs `canonical/`) — deferred to spec/design, low risk.

## Resolution of exploration open questions
- Q1 Copilot target → **out of scope (non-goal).**
- Q2 per-agent body divergence → **out of scope (non-goal); one shared body.**
- Q3 Cursor agents → **out of scope (non-goal).**
- Q4 frontmatter universal vs agent-scoped → **resolved: formal field registry / allowlist (in scope).**
- Q5 install strategy → **resolved: global install only; project-local is a non-goal.**
- Q6 source directory name → **deferred to spec/design (low-risk naming decision).**
- Q7 auto-regenerate registry after install → **out of scope for v1.**
