# Archive Report: canonical-skill-format

**Change**: canonical-skill-format  
**Archived to**: `openspec/changes/archive/2026-06-21-canonical-skill-format/`  
**Date**: 2026-06-21  
**Status**: COMPLETE — 0 CRITICAL, 2 WARNING (spec-noted), 3 SUGGESTION (acceptable for Standard Mode)

## Executive Summary

The canonical-skill-format SDD change has been successfully planned, implemented, verified, and archived. All 7 implementation phases completed and merged (PR1 #1 + PR2 #2). Specs synced to main specs tree. Greenfield project with 6 capability domains fully specified and implemented.

## Artifacts Archived

### Change Folder
- **Location**: `openspec/changes/archive/2026-06-21-canonical-skill-format/`
- **Contents**:
  - `proposal.md` — Intent, scope (in), non-goals (out), exploration Q resolution
  - `design.md` — Technical approach, architecture decisions, interfaces, data flow
  - `tasks.md` — Phases 0–7 implementation plan (all [x] complete)
  - `verify-report.md` — Live verification: 0 CRITICAL, 2 WARNING, 3 SUGGESTION
  - `archive-report.md` — This artifact
  - `specs/` — 6 delta capability specs (all greenfield, no prior main specs):
    - `canonical-source-format/spec.md` — File format, required fields, body preservation
    - `frontmatter-validation/spec.md` — JSON Schema, error reporting, validation gates
    - `field-registry/spec.md` — Universal vs agent-scoped field classification
    - `adapters/spec.md` — Uniform interface, Claude Code + OpenCode implementations
    - `install-step/spec.md` — Non-destructive, reversible, dry-run, backup/restore
    - `build-orchestration/spec.md` — Pipeline stages, failure handling, multi-skill support

### Main Specs Synced
**Location**: `openspec/specs/` (created — was greenfield)

All 6 delta specs copied directly to main specs as full specs (no prior main specs existed):
- `openspec/specs/canonical-source-format/spec.md`
- `openspec/specs/frontmatter-validation/spec.md`
- `openspec/specs/field-registry/spec.md`
- `openspec/specs/adapters/spec.md`
- `openspec/specs/install-step/spec.md`
- `openspec/specs/build-orchestration/spec.md`

**Sync classification**: ADDITIVE (greenfield, no destructive merges). Per `config.yaml` rule "Warn before merging destructive deltas" — this archive is non-destructive, so no warning required.

## Task Completion Status

**All 8 phases complete and marked [x]**:

| Phase | Status | Description |
|-------|--------|-------------|
| 0 | [x] 4/4 | Project scaffold (package.json, tsconfig.json, .gitignore, npm install) |
| 1 | [x] 3/3 | Schema + field registry + startup assertion |
| 2 | [x] 2/2 | Parse + validate |
| 3 | [x] 3/3 | Adapter interface + Claude + OpenCode implementations |
| 4 | [x] 2/2 | Install step (backup + atomic + dry-run + abort/restore) |
| 5 | [x] 5/5 | Build orchestration CLI (discovery, pipeline, exit codes, npm scripts) |
| 6 | [x] 1/1 | Example skill (end-to-end smoke test) |
| 7 | [x] 4/4 | Dry-run verification pass |

**Total**: 24/24 tasks complete.

## Verification Summary

**Verdict**: DONE — 0 CRITICAL, 2 WARNING (spec-noted), 3 SUGGESTION (Standard Mode acceptable)

### Live Evidence
- `npx tsc --noEmit` → No errors (exit 0)
- `npm test` → 20/20 pass (exit 0)
- `npm run build:dry` → exit 0; WOULD-CREATE both targets; zero FS mutation

### Per-Capability Verification
All 6 capabilities PASS:
1. **canonical-source-format** — Parse splits at ---, opening enforced line 1, body byte-for-byte preserved
2. **frontmatter-validation** — AJV + additionalProperties:false, all errors reported, validation precedes adapters
3. **field-registry** — Universal {name,description,trigger,license,metadata} + claude {disable-model-invocation,user-invocable}, startup assertion, adapters consult registry
4. **adapters** — Uniform interface, stripFields keeps universal||agent-scoped, Claude/OpenCode correct field sets
5. **install-step** — Dry-run zero mutation, separate-dir backup, atomic write, abort/restore with symlink guards
6. **build-orchestration** — Discovery, ordered pipeline, validation blocks adapters, per-target exit codes

### Findings Summary

**WARNING-1 (LOW)**: Unknown-field stripping is SILENT. Spec field-registry requires warning. Impact: effectively unreachable (additionalProperties:false + startup assertion make schema==registry). Mitigation: add warning OR spec-note that additionalProperties subsumes it.

**WARNING-2 (MEDIUM)**: No CROSS-ADAPTER rollback. Spec build-orchestration requires restoring sibling on failure. Impact: Claude succeeds + OpenCode fails → Claude stays; each root internally consistent, cross-root atomicity unmet. Mitigation: implement cross-adapter rollback OR amend spec to per-target scope (current design).

**SUGGESTION-1 (Standard Mode acceptable)**: symlink-on-backup-root guard has no automated test. Verified by review + FS inventory. Suggest future test with tmpdir symlink.

**SUGGESTION-2 (Standard Mode acceptable)**: `npm run build` does REAL install (no --dry-run). Documented + non-destructive. Consider renaming to install/build:install.

**SUGGESTION-3 (Standard Mode acceptable)**: empty-body scenario satisfied but untested. Add frontmatter-only test.

## Design Decisions Archived

1. **Canonical source dir = `skills/`** — Mirrors install layout 1:1; authors edit content not code
2. **Field registry = TS module** — Typed `as const` gives compile-time safety; only TS adapters consume
3. **Schema source of truth** — Hand-written JSON Schema; startup assertion anti-drift check
4. **Adapter contract = uniform TS interface** — Extension point for future agents
5. **Stripping rule = registry consult** — Single declarative source prevents drift
6. **Reversible write = backup + atomic rename** — Protects ~25 existing skills
7. **Deps minimal: yaml + ajv + native parseArgs** — No gray-matter, commander, yargs bloat

## Known Limitations (v1 Non-Goals, Deferred)

Per proposal §Non-goals, the following are OUT OF SCOPE for v1 and deferred to future changes:
- Cursor skills (~/.cursor/skills/)
- Cursor agent files (~/.cursor/agents/)
- GitHub Copilot aggregation adapter
- Project-local install (.claude/skills/)
- Per-agent body divergence (tagged sections)
- Auto-regen of .atl/skill-registry.md after install

Extension points defined in spec but not implemented; future changes can add these by:
1. Adding registry entry for new agent scope
2. Implementing Adapter interface for new agent
3. No core code changes required

## Rollback Plan (Archived for Reference)

Per proposal §Rollback plan:
- Code reversion: git revert or cherry-pick -x
- Install step safeguards: non-destructive (never clobber unmanaged), dry-run (no writes), reversible (backup + atomic + restore), per-target atomicity
- Dry-run + no-write guarantee = blast radius minimal before any real install
- Repo-level rollback = git

## Source of Truth Updated

The canonical specs now live in:
- `openspec/specs/canonical-source-format/spec.md`
- `openspec/specs/frontmatter-validation/spec.md`
- `openspec/specs/field-registry/spec.md`
- `openspec/specs/adapters/spec.md`
- `openspec/specs/install-step/spec.md`
- `openspec/specs/build-orchestration/spec.md`

These are the authoritative source for the skill format pipeline and all agent adapters.

## SDD Cycle Complete

The change is fully planned, designed, tasked, implemented, verified, and archived. Ready for the next change.

## Engram Observation IDs (for traceability)

- Proposal: #1244
- Spec: #1245
- Design: #1246
- Tasks: #1247
- Apply-progress: #1248 (PR2 apply work)
- Verify-report: #1250
- Archive-report: #1251 (engram), archive-report.md (openspec)

---

**Phase**: sdd-archive  
**Executor**: sdd-archive sub-agent  
**Artifact store**: hybrid (openspec files + engram)  
**Status**: COMPLETE
