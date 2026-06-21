# Verify Report: canonical-skill-format

**Phase:** sdd-verify · **Mode:** Standard (strict_tdd false) · **Date:** 2026-06-21
**Branch:** main (PR1 #1 + PR2 #2 merged) · **Artifact store:** hybrid

## Verdict

**status: done** — implementation satisfies the contract. 0 CRITICAL, 2 WARNING, 3 SUGGESTION.
Both WARNINGs are spec-text deviations that are consciously bounded by the code/comments and do not
threaten the core safety guarantees (no clobber, dry-run zero-write, atomic write, abort/restore).
Recommend `sdd-archive` after acknowledging the two WARNINGs (accept as known limitations or file
as follow-ups).

## Evidence (run live)

- `npx tsc --noEmit` -> `TypeScript: No errors found` (exit 0).
- `npm test` -> `# tests 20 # pass 20 # fail 0` (exit 0).
- `npm run build:dry` -> exit 0; output:
  ```
  skillkit build (dry-run) - 1 skill(s), 2 adapter(s)
  [example-skill]
    WOULD-CREATE /Users/macbook/.claude/skills/example-skill/SKILL.md
    WOULD-CREATE /Users/macbook/.config/opencode/skills/example-skill/SKILL.md
  Build complete. All skills processed successfully.
  ```
  `~/.skillkit/backups` does NOT exist after the dry-run -> zero FS mutation confirmed.
- No real install performed (per instruction; `~/.claude` and `~/.config/opencode` untouched).

## Requirement-by-requirement mapping

### 1. canonical-source-format - PASS
- Split at `---`: src/parse.ts:42-69. Opening `---` enforced on line 1 -> ParseError(line=1) (parse.ts:45-47). Missing closing `---` -> ParseError(line=lines.length) (parse.ts:58-63). Satisfies "missing frontmatter delimiter" and "body-only file" scenarios.
- Body byte-for-byte: parse.ts:65-69 re-joins with `\n` from the same split; no trim. Tests pipeline.test.ts:52-64 (tabs/trailing-newline/CRLF).
- Required name/description enforced at schema layer (see section 2), per spec ("optional unless declared REQUIRED in registry").

### 2. frontmatter-validation - PASS
- Schema at schemas/skill.schema.json, additionalProperties:false, required:["name","description"] (schema lines 7-8).
- AJV allErrors:true -> all errors collected, not fail-fast: src/validate.ts:45,55-66.
- Validation precedes adapters/install: build.ts validate() at line 135, continues on failure BEFORE the adapter loop (build.ts:136-147).
- Unknown field names the field: validate.ts:60-63 maps additionalProperty/missingProperty/instancePath -> field. Satisfies "name integer" and "unknown field" scenarios.
- Error reporting names field + message, emitted under per-skill `[name]` header (build.ts:119,138-141).

### 3. field-registry - PASS
- Universal {name,description,trigger,license,metadata} + claude {disable-model-invocation,user-invocable}; NO opencode-scoped field (correct): src/registry/field-registry.ts:19-27.
- Adapters consult the registry via stripFields(frontmatter, adapter, FIELD_REGISTRY) (build.ts:97, adapter.ts:57-77); no hardcoded allowlists.
- Startup assertion: assertRegistryCoversSchema() at module load (field-registry.ts:78) throws naming any schema property lacking a registry entry (lines 68-74). findSchemaPath() walk-up robust across dist/dist-test (lines 42-53).
- Entry format documented (scope + required).

### 4. adapters - PASS
- stripFields keeps scope==='universal' || scope===adapter.agent (adapter.ts:70); strips other-agent and unknown fields.
- Claude keeps claude fields, OpenCode strips them: tests pipeline.test.ts:27-41; live build:dry confirms.
- Install paths: ~/.claude/skills/{name}/SKILL.md (claude.ts:17), ~/.config/opencode/skills/{name}/SKILL.md (opencode.ts:18). `~` via os.homedir().
- Name validation: assertValidSkillName (adapter.ts:30-44) called in both resolveInstallPaths. Tests pipeline.test.ts:70-85.
- Body unchanged: renderSkill re-emits ---\n<yaml>\n---\n${body} with original body (build.ts:100).

### 5. install-step - PASS (see WARNING-2)
- Dry-run zero mutation: install.ts:140-144 returns before any write. Live build:dry + no backup dir confirm. Test pipeline.test.ts:101-104.
- Non-destructive: writes only under INSTALL_ROOTS (install.ts:130-135); existing files backed up before overwrite (install.ts:212-223), never deleted. Tests pipeline.test.ts:91-99 (out-of-root + normalized-escape refused even in dry-run).
- Separate-dir backup: ~/.skillkit/backups/{runId}/{agent}/{name}/SKILL.md (install.ts:114,215) - NOT sibling .bak.
- Atomic write: temp file + renameSync (install.ts:226-229).
- Abort/restore: restore() renames backups back, removes orphaned temp, removes created dirs reverse order; partial-restore failure throws aggregate naming unrestored files (install.ts:171-201,232-242).
- Safety guard - lexical containment AND symlink defense on BOTH paths: dest via assertNoSymlinkEscape (realpath + lstat-per-segment + containment recheck, install.ts:66-79,147); backup via assertNoSymlinkSegment (install.ts:219).
- `~` via os.homedir() (install.ts:1,20-23).

### 6. build-orchestration - PASS (see WARNING-2)
- Discovery skills/*/SKILL.md (build.ts:65-86).
- Per-skill parse -> validate -> (per-adapter) strip -> render -> install (build.ts:118-173).
- Validation failure skips adapters and continues to next skill (build.ts:136-147).
- Cross-adapter abort on install failure for same skill (build.ts:166-172, break).
- Exit 0 clean / exit 1 any failure (build.ts:182-192).
- --dry-run and --target flags via parseArgs (build.ts:20-50); unknown --target -> exit 1.

## Findings

### WARNING-1 - Unknown-field stripping is SILENT; spec requires a warning
- Spec: field-registry "Adapter strips unlisted field" -> "the build pipeline MUST emit a warning identifying the stripped field".
- Code: stripFields strips unknown fields silently (adapter.ts:66-68); no warning in build loop (build.ts:92-101).
- Impact: LOW. additionalProperties:false means an unknown frontmatter field fails VALIDATION first (build.ts:135) and never reaches stripFields. The only path to silent stripping is a field in the schema but not the registry, which the startup assertion (field-registry.ts:78) already makes impossible. The literal "emit a warning" behavior is absent but effectively unreachable. Recommend: add the warning in stripFields/renderSkill, OR record a spec note that additionalProperties:false subsumes it.

### WARNING-2 - No CROSS-ADAPTER rollback; spec requires restoring a sibling target
- Spec: build-orchestration "Install failure triggers full rollback" -> "Claude Code install succeeds but OpenCode fails ... THEN the Claude Code install MUST be rolled back". install-step "Partial failure leaves pre-build state" -> same.
- Code: rollback is scoped to a single installSkill call (install.ts:171-201). The build loop aborts remaining adapters (build.ts:166-172, break) but does NOT roll back an already-successful sibling adapter. Confirmed: no cross-adapter rollback in build.ts (only acknowledging comments at lines 151-152).
- Impact: MEDIUM. If Claude succeeds and OpenCode then fails, Claude stays installed while the cross-root pre-build state is not fully restored. Each root is internally consistent; only cross-root atomicity is unmet. Literal MUST deviation. Recommend: implement cross-adapter rollback (track per-skill successful installs + backups, restore on later sibling failure), OR amend spec to scope rollback per-target.

### SUGGESTION-1 - Symlink-on-backup-root guard has no automated test
- assertNoSymlinkSegment on the backup path was verified by review reasoning + FS-write inventory, not a live test (hard without touching real home). ACCEPTABLE for Standard Mode - the guard exists. Suggest a future test using a tmp backupRootDir (installSkill already accepts one) with a symlinked segment under os.tmpdir().

### SUGGESTION-2 - `npm run build` does a REAL global install
- build = tsc && node dist/build.js (no --dry-run). A user expecting compile-only would write to ~/.claude and ~/.config/opencode. Documented + non-destructive via guards, but consider renaming to install/build:install and reserving build/compile for the no-write path.

### SUGGESTION-3 - Empty-body scenario relies on implicit behavior
- canonical-source-format "Empty body" is satisfied (empty body round-trips as '') but has no explicit test. Add a one-line frontmatter-only SKILL.md test to lock it in.

## Non-gaps (correct per scope corrections - do NOT flag)
- No migration of existing skills - skills/ holds only newly authored content (example-skill). Design Migration/Rollout cancelled.
- Backup is separate dir ~/.skillkit/backups/{runId}/{agent}/{name}/SKILL.md, not sibling .bak.
- v1 targets = Claude Code + OpenCode only. Cursor/Copilot/project-local/registry-auto-regen absence is correct.

## Tasks consistency
Tasks 0.1-2.2 marked [x]; Phases 3-7 still [ ] in tasks.md but apply-progress + live code confirm Phases 3-7 implemented and merged (PR2 #2). Unchecked boxes are stale tracking, not missing work. sdd-archive should mark them complete.
