# Design: Canonical Skill Format

## Technical Approach

Single canonical `SKILL.md` (frontmatter + body) is the only authored artifact. Build pipeline: **parse → validate → adapt → install**, run per skill. Validation is JSON Schema over frontmatter (`schemas/skill.schema.json`, `additionalProperties: false`) and runs first; on failure no adapter or write executes (per frontmatter-validation spec). Adapters strip non-allowlisted fields using a declarative field registry, copy the body byte-for-byte (per canonical-source-format spec), and route to a global install path. Install is non-destructive, atomic, reversible, with dry-run.

## Architecture Decisions

| # | Decision | Choice | Alternatives rejected | Rationale |
|---|----------|--------|-----------------------|-----------|
| 1 | Canonical source dir | **`skills/`** at repo root | `src/skills/` (mixes content with code), `canonical/` (jargon) | Authors edit content, not code; `src/` is TS pipeline only. `skills/{name}/SKILL.md` mirrors the install layout 1:1, lowest cognitive load. |
| 2 | Field registry representation | **TS module** `src/registry/field-registry.ts` | JSON file | Registry is consumed only by TS adapters; a typed module gives compile-time safety, `as const` literal types, and lets the schema be derived from it. No external consumer needs JSON. |
| 3 | Schema source of truth | Hand-written `schemas/skill.schema.json`; registry asserts consistency at startup | Generate schema from registry; generate registry from schema | Spec pins schema path and `additionalProperties:false`. Keep schema canonical for validation; a startup assertion guarantees every schema property has a registry scope (anti-drift). |
| 4 | Adapter contract | **Uniform TS interface** all adapters implement | Per-agent ad-hoc functions | One contract = predictable extension point; future adapters slot in by implementing it, not editing the orchestrator. |
| 5 | Frontmatter stripping | Adapter keeps fields where `scope === 'universal' || scope === adapter.agent` | Each adapter hardcodes its allowlist | Single declarative source prevents silent divergence (proposal risk #2). |
| 6 | Reversible write | Backup existing file to sibling `SKILL.md.bak-{ts}`, then atomic temp-write + rename | In-place overwrite; git-only rollback | Protects ~25 hand-placed skills (risk #1); atomic rename prevents partial writes; abort restores from backup. |
| 7 | Dependencies | `yaml`, `ajv`, native `node:util parseArgs` | gray-matter (bundles md parser we don't need), commander/yargs (heavier) | Minimal surface: `yaml` for frontmatter, `ajv` for JSON Schema, zero-dep CLI parsing. |

## Field Registry & Adapter Contract

```ts
// src/registry/field-registry.ts
type Scope = 'universal' | 'claude' | 'opencode';
export const FIELD_REGISTRY = {
  name:        { scope: 'universal', required: true },
  description: { scope: 'universal', required: true },
  trigger:     { scope: 'universal' },
  license:     { scope: 'universal' },
  metadata:    { scope: 'universal' },
  'disable-model-invocation': { scope: 'claude' },
  'user-invocable':           { scope: 'claude' },
} as const;
// EXTENSION POINT 1: add a field or a new Scope value here — no adapter code changes.

// src/adapters/adapter.ts
export interface Adapter {
  readonly agent: Scope;                    // its own scope tag
  resolveInstallPath(name: string): string; // global path for this agent
}
// Shared engine does: validate → strip (registry, keep universal|agent) → render → install.
// EXTENSION POINT 2: a Cursor/Copilot adapter implements this same interface.
```

Claude adapter: `agent:'claude'`, path `~/.claude/skills/{name}/SKILL.md`, keeps universal + claude (so `disable-model-invocation`, `user-invocable` survive). OpenCode adapter: `agent:'opencode'`, path `~/.config/opencode/skills/{name}/SKILL.md`, keeps universal only (strips the two Claude fields — the drift today is exactly that these leak into OpenCode). A future Cursor adapter adds `cursor` to `Scope`, registry entries, and an `Adapter` impl — no engine change.

## Data Flow

    skills/{name}/SKILL.md
        │  parse(yaml+body)
        ▼  validate(ajv)──fail──▶ collect errors, skip skill, exit non-zero
        ▼
    for each Adapter: strip(registry) → render(frontmatter+body) → install(path)

## Build & Install Sequence

```
CLI(build.ts) → discover skills/*/SKILL.md
  loop skill:
    parse → validate(ajv)        [fail → record error, continue, abort writes]
  if any error → print all, exit 1   (validation precedes adapter steps)
  loop skill × adapter:
    strip → render → resolveInstallPath
    if dry-run → report "CREATE|OVERWRITE path"; no FS write
    else: mkdir -p; if exists → backup .bak-{ts}; write tmp; rename(tmp,dest)
    on write error → restore backups written this run, exit 1
  print summary (created / overwritten / skipped)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `package.json`, `tsconfig.json` | Create | Node ESM + TS; deps `yaml`, `ajv`. |
| `skills/{name}/SKILL.md` | Create | Canonical sources (migrated from installed copies). |
| `schemas/skill.schema.json` | Create | Frontmatter JSON Schema, `additionalProperties:false`. |
| `src/registry/field-registry.ts` | Create | Universal-vs-agent field map + startup schema consistency assert. |
| `src/parse.ts` | Create | Split frontmatter/body; error if no `---` delimiter. |
| `src/validate.ts` | Create | ajv wrapper, multi-error human-readable reporting. |
| `src/adapters/{adapter,claude,opencode}.ts` | Create | Contract + two implementations. |
| `src/install.ts` | Create | Backup + atomic temp-rename + dry-run reporting. |
| `src/build.ts` | Create | CLI (`--dry-run`, `--target=claude|opencode`), orchestration, abort handling. |

## Interfaces / Contracts

CLI: `node dist/build.js [--dry-run] [--target=<agent>]`. Default builds all targets, all skills, real writes. `--dry-run` prints planned CREATE/OVERWRITE per path with zero FS mutation.

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Verification | Dry-run output | Assert dry-run reports expected paths and performs zero writes (greenfield, no test runner — manual/script check per risk #3). |
| Manual | Backup + abort | Force a mid-run failure, confirm `.bak` restore leaves dirs pre-build. |

## Migration / Rollout

One-time: copy the ~25 existing installed `SKILL.md` files into `skills/{name}/` as canonical sources, then run `--dry-run` to confirm no unexpected overwrites before the first real build.

## Open Questions

- [ ] Migration of existing skills into `skills/` — manual copy in v1 or a helper script? (low risk, tasks-phase call)
