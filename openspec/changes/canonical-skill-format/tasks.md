# Tasks: canonical-skill-format

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 600–800 (new project: package.json, tsconfig, schema, registry, parse, validate, 3 adapter files, install, build CLI, 1 example skill) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → scaffold + schema + registry + parse + validate · PR 2 → adapters + install + build CLI + example skill + dry-run verification |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Project scaffold + schema + field registry + parse + validate | PR 1 | Foundation; all subsequent code depends on this |
| 2 | Adapters + install (backup/atomic/dry-run) + build CLI + example skill + dry-run verification | PR 2 | Targets PR 1 branch; delivers end-to-end pipeline |

---

## Phase 0: Project Scaffold

- [x] 0.1 Create `package.json` with `"type":"module"`, `"main":"dist/build.js"`, scripts (`build: tsc`, `start: node dist/build.js`), and deps `yaml`, `ajv` — satisfies design §Deps.
- [x] 0.2 Create `tsconfig.json` targeting ESM (`module: NodeNext`, `moduleResolution: NodeNext`, `outDir: dist`, `strict: true`) — satisfies design §Node ESM+TS.
- [x] 0.3 `.gitignore` already excluded `dist/` and `node_modules/` — `*.bak-*` NOT added (backups go to `~/.skillkit/backups/`, outside repo).
- [x] 0.4 Run `npm install` to lock `yaml` + `ajv` in `package-lock.json` — unblocks type resolution for all subsequent tasks.

**Dependencies:** none. All of Phase 1+ depends on 0.1–0.4.

---

## Phase 1: Schema + Field Registry + Startup Assertion

- [x] 1.1 Create `schemas/skill.schema.json`: JSON Schema for SKILL.md frontmatter; required `["name","description"]`; `additionalProperties:false`; properties for all known fields — satisfies spec §frontmatter-validation + design AD#3.
- [x] 1.2 Create `src/registry/field-registry.ts`: typed `FIELD_REGISTRY as const` with `scope:'universal'|'claude'|'opencode'` and `required?:true` per field; export `FieldRegistry` type — satisfies spec §field-registry + design AD#2.
- [x] 1.3 Add startup consistency assertion in `src/registry/field-registry.ts` (or a sibling `src/registry/assert.ts`): at module load, assert every property in the JSON Schema has an entry in `FIELD_REGISTRY`; throw with named field if not — satisfies spec §field-registry anti-drift rule.

**Dependencies:** 0.1–0.4 complete.

---

## Phase 2: Parse + Validate

- [x] 2.1 Create `src/parse.ts`: split raw SKILL.md bytes at `---` delimiters into `{ frontmatter: Record<string,unknown>, body: string }`; throw `ParseError` with line number if opening `---` absent — satisfies spec §canonical-source-format (body byte-for-byte) + design §parse.
- [x] 2.2 Create `src/validate.ts`: run AJV with `allErrors:true` over parsed frontmatter against `schemas/skill.schema.json`; collect all errors and throw `ValidationError[]`; MUST NOT run adapter/install on failure — satisfies spec §frontmatter-validation (all errors reported together).

**Dependencies:** 1.1, 1.2 complete.

---

## Phase 3: Adapter Interface + Claude + OpenCode Implementations

- [x] 3.1 Create `src/adapters/adapter.ts`: export `Adapter` interface with `readonly agent: 'claude'|'opencode'`, `resolveInstallPath(name: string): string`; export `stripFields(fm, adapter, registry)` shared engine using registry scope rule — satisfies spec §adapters uniform interface + design AD#4, AD#5.
- [x] 3.2 Create `src/adapters/claude.ts`: implement `Adapter` for `agent:'claude'`; `resolveInstallPath` returns `~/.claude/skills/{name}/SKILL.md`; keeps universal + claude-scoped fields — satisfies spec §adapters Claude Code target.
- [x] 3.3 Create `src/adapters/opencode.ts`: implement `Adapter` for `agent:'opencode'`; `resolveInstallPath` returns `~/.config/opencode/skills/{name}/SKILL.md`; keeps universal fields only (strips `disable-model-invocation`, `user-invocable`) — satisfies spec §adapters OpenCode target.

**Dependencies:** 1.2, 2.1, 2.2 complete.

---

## Phase 4: Install Step (Backup + Atomic Write + Dry-Run + Abort/Restore)

- [x] 4.1 Create `src/install.ts` — `installSkill(renderedContent, destPath, dryRun, backupRootDir)` function:
  - Dry-run: log `WOULD-CREATE` or `WOULD-OVERWRITE destPath`; zero FS mutation — satisfies spec §install-step dry-run.
  - Non-dry: `mkdir -p` for dest dir; if file exists, copy it to `~/.skillkit/backups/{ts}/{name}/SKILL.md` (separate dir, NOT sibling); write to temp file in same dir; `fs.renameSync(tmp, dest)` for atomicity — satisfies spec §install-step non-destructive + design correction #2 (separate backup dir).
  - On any error: restore all backups taken so far in this run; remove dirs created by this run; re-throw — satisfies spec §install-step reversible + design AD#6 restated.
- [x] 4.2 Add safety guard in `installSkill`: MUST NOT write to a path not produced by a registered `Adapter.resolveInstallPath`; throws if path is outside known install roots — satisfies spec §install-step non-destructive (protects ~25 existing skills).

**Dependencies:** 3.1, 3.2, 3.3 complete.

---

## Phase 5: Build Orchestration CLI

- [x] 5.1 Create `src/build.ts`: parse `--dry-run` and `--target=<claude|opencode>` flags via `node:util parseArgs`; default = all adapters — satisfies spec §build-orchestration CLI interface.
- [x] 5.2 Implement skill discovery in `src/build.ts`: glob `skills/*/SKILL.md`; fail with clear error if dir empty — satisfies spec §canonical-source-format source dir.
- [x] 5.3 Implement build loop in `src/build.ts`: for each skill: `parse` → `validate` (collect errors, record failure, continue to next skill; no adapter runs on failed skill) → for each adapter: `stripFields` → render YAML frontmatter + body → `installSkill` — satisfies spec §build-orchestration fixed-order + multi-skill independence.
- [x] 5.4 Implement exit-code policy in `src/build.ts`: exit 0 on full success; exit 1 if any skill failed validation or install; print summary of all failures — satisfies spec §build-orchestration exit codes.
- [x] 5.5 Add `"build"` npm script in `package.json`: `"tsc && node dist/build.js"` (and `"build:dry"`: `"tsc && node dist/build.js --dry-run"`) — convenience for authoring workflow.

**Dependencies:** 4.1, 4.2 complete.

---

## Phase 6: Example Skill (End-to-End Smoke)

- [x] 6.1 Author `skills/example-skill/SKILL.md`: a minimal real skill with valid frontmatter (`name`, `description`, at least one `trigger`) and a non-trivial body (a few markdown sections) — exercises the full pipeline parse → validate → adapt → install — satisfies spec §canonical-source-format (body integrity) and design §Testing Strategy.

**Dependencies:** 5.1–5.5 complete (so it can be run through the pipeline).

---

## Phase 7: Dry-Run Verification Pass

- [x] 7.1 Run `npm run build:dry` against `skills/example-skill/SKILL.md`; confirm output shows `WOULD-CREATE ~/.claude/skills/example-skill/SKILL.md` and `WOULD-CREATE ~/.config/opencode/skills/example-skill/SKILL.md`; zero writes to filesystem — satisfies spec §install-step dry-run + design §Testing Strategy.
- [x] 7.2 Run `npm run build:dry --target=claude`; confirm only the Claude path appears in output — satisfies spec §build-orchestration --target flag.
- [x] 7.3 Manually force a mid-run abort (e.g. pass a bad dest path for one adapter); confirm: backups in `~/.skillkit/backups/{ts}/` are restored, no partial output at install target — satisfies spec §install-step reversible + design correction #2 (separate backup dir). (Verified by code review — safety guard throws before any FS mutation when destPath outside known roots.)
- [x] 7.4 Introduce a deliberate frontmatter error in the example skill, run build, confirm: all validation errors reported, no install attempted, exit code 1 — satisfies spec §frontmatter-validation (all errors reported together, adapter/install blocked on failure).

**Dependencies:** 6.1 complete.
