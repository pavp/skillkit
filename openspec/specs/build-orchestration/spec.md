# Build Orchestration Specification

## Purpose

Defines the ordered pipeline that validates, adapts, and installs canonical skills, and how the pipeline handles failures at each stage.

## Requirements

### Requirement: Ordered Pipeline Stages

The build pipeline MUST execute stages in this fixed order: (1) schema validation, (2) per-target adapter transform, (3) install. Stage N MUST NOT begin if stage N-1 produced any error for the current skill.

#### Scenario: Full pipeline success

- GIVEN a valid canonical SKILL.md
- WHEN the build runs
- THEN stages execute in order: validate → adapt (Claude Code) → adapt (OpenCode) → install (Claude Code) → install (OpenCode)
- AND all outputs are written to their target paths

#### Scenario: Validation failure aborts pipeline

- GIVEN a SKILL.md that fails schema validation
- WHEN the build runs
- THEN neither adapter runs
- AND no install paths are written
- AND the build exits with a non-zero status code

#### Scenario: Adapter failure aborts install

- GIVEN schema validation passes but the Claude Code adapter encounters an error
- WHEN the build runs
- THEN the install step MUST NOT execute for any target
- AND all targets MUST remain in their pre-build state

### Requirement: Pre-Build State Preservation on Failure

Rollback is scoped per target (per `installSkill` call), NOT across targets. If a single target's install fails partway through writing, that target MUST be restored to its pre-write state (the per-call backup + atomic rename + abort/restore guarantees this). Targets are independent install roots (`~/.claude/skills`, `~/.config/opencode/skills`); a successfully written target is valid and usable on its own, so it is NOT rolled back when a *later* target fails.

Rationale for per-target (not cross-target) atomicity: the agents are independent consumers. A completed Claude Code install is correct and consistent within its own root regardless of whether the OpenCode install later fails. Reverting an already-successful, internally-consistent install adds risk (mutating something that works) without protecting any invariant — no root is left corrupt or partially written by the per-target guarantee. Cross-root atomicity was considered and explicitly rejected as over-strict.

#### Scenario: A target's own install failure is rolled back for that target

- GIVEN an install to a single target fails partway through writing
- WHEN the pipeline handles the failure
- THEN that target MUST be restored to its pre-write state (backup restored / newly-created files removed)
- AND the error MUST be reported with the rollback status

#### Scenario: Later target failure does not roll back an earlier successful target

- GIVEN the Claude Code install succeeds but the OpenCode install then fails
- WHEN the pipeline handles the failure
- THEN the pipeline MUST abort the remaining targets for that skill (no further installs)
- AND the already-successful Claude Code install MUST remain in place (NOT rolled back)
- AND the build MUST exit non-zero, reporting which target failed

### Requirement: Multi-Skill Build

The pipeline MUST support building multiple canonical skills in a single invocation. Each skill MUST be validated, adapted, and installed independently. A failure in one skill MUST NOT prevent other skills from being processed, but the overall build MUST exit with a non-zero status code if any skill failed.

#### Scenario: One skill fails, others succeed

- GIVEN three canonical skills where skill B has an invalid frontmatter field
- WHEN the build runs for all three
- THEN skills A and C MUST be fully installed
- AND skill B MUST NOT be installed
- AND the build output MUST report which skills succeeded and which failed

### Requirement: Build Exit Codes

The build MUST exit with code `0` when all skills are processed successfully. The build MUST exit with a non-zero code when any validation, adapter, or install error occurs.

#### Scenario: Clean build exits 0

- GIVEN all skills pass validation, adaptation, and install
- WHEN the build completes
- THEN the process exits with code `0`

#### Scenario: Any failure exits non-zero

- GIVEN at least one skill fails at any pipeline stage
- WHEN the build completes
- THEN the process MUST exit with a non-zero code
