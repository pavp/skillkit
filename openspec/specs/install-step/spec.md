# Install Step Specification

## Purpose

Defines the non-destructive, reversible install behavior that writes adapter outputs to global agent directories without clobbering existing skills.

## Requirements

### Requirement: Non-Destructive Write

The install step MUST NOT delete or overwrite any file it did not originally create as part of a prior install from this pipeline. Existing manually-installed skills (the ~25 currently in global dirs) MUST be left untouched unless the build produced an updated version of that exact skill name.

#### Scenario: Unmanaged skill untouched

- GIVEN `~/.claude/skills/existing-skill/SKILL.md` was manually installed and is not in the canonical source set
- WHEN the install step runs for any skill
- THEN `~/.claude/skills/existing-skill/SKILL.md` MUST remain unchanged

#### Scenario: Managed skill updated

- GIVEN a canonical skill `my-skill` was previously installed by this pipeline
- WHEN the install step runs with a new version of `my-skill`
- THEN the existing `~/.claude/skills/my-skill/SKILL.md` MAY be overwritten with the new adapter output

### Requirement: Dry-Run Mode

The install step MUST support a dry-run mode that reports all would-be file operations (create, overwrite) without writing to disk. Dry-run MUST be activatable via a CLI flag.

#### Scenario: Dry-run reports create operation

- GIVEN a skill not yet installed in the target dir
- WHEN the install step runs with the dry-run flag
- THEN the output MUST report `would-create: ~/.claude/skills/{name}/SKILL.md`
- AND no file MUST be written to disk

#### Scenario: Dry-run reports overwrite operation

- GIVEN a skill already present at the target path
- WHEN the install step runs with the dry-run flag
- THEN the output MUST report `would-overwrite: ~/.claude/skills/{name}/SKILL.md`
- AND the existing file MUST remain unchanged

#### Scenario: Dry-run covers all adapters

- GIVEN two adapters (Claude Code, OpenCode) are configured
- WHEN the install step runs in dry-run mode
- THEN operations for BOTH target directories MUST be reported in the same dry-run output

### Requirement: Reversible Writes

The install step MUST be reversible. Before overwriting an existing file, the pipeline MUST preserve the prior content such that the previous state can be restored. A failed mid-install MUST leave all targets in their pre-build state.

#### Scenario: Pre-overwrite backup

- GIVEN `~/.claude/skills/my-skill/SKILL.md` already exists
- WHEN the install step overwrites it
- THEN the prior content MUST have been backed up before the write occurs

#### Scenario: Partial failure leaves pre-build state

- GIVEN the install step successfully writes the Claude Code output but fails before writing the OpenCode output
- WHEN the pipeline handles the failure
- THEN the Claude Code target MUST be restored to its pre-build state
- AND no partial install MUST be left in place

### Requirement: Target Directory Creation

The install step MUST create the skill subdirectory (`~/.claude/skills/{name}/`) if it does not exist. Directory creation MUST be treated as a reversible operation — if the full install fails, newly created directories MUST be removed.

#### Scenario: Missing directory created

- GIVEN `~/.claude/skills/new-skill/` does not exist
- WHEN the install step runs for `new-skill`
- THEN the directory MUST be created before the file is written

#### Scenario: Newly created directory removed on failure

- GIVEN the install step created `~/.claude/skills/new-skill/` but the write failed
- WHEN the pipeline handles the failure
- THEN `~/.claude/skills/new-skill/` MUST be removed (rollback)
