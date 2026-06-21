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

If the build fails at any point after the install step has begun writing, all written targets MUST be restored to their pre-build state. The post-failure system state MUST be identical to the pre-build system state.

#### Scenario: Install failure triggers full rollback

- GIVEN the Claude Code install succeeds but the OpenCode install fails
- WHEN the pipeline handles the failure
- THEN the Claude Code install MUST be rolled back
- AND the error MUST be reported with the rollback status

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
