# Adapters Specification

## Purpose

Defines the transformation contract for the Claude Code and OpenCode adapters — the two v1 targets.

## Requirements

### Requirement: Uniform Adapter Interface

Every adapter MUST implement the same four-step contract: validate-input → transform-frontmatter → resolve-install-path → write. Future adapters MUST be addable by implementing this interface without modifying existing adapters.

#### Scenario: Adapter interface satisfied

- GIVEN a new adapter implementation
- WHEN it is registered in the build pipeline
- THEN it MUST expose all four interface steps: validate-input, transform-frontmatter, resolve-install-path, write

### Requirement: Claude Code Adapter Transform

The Claude Code adapter MUST produce a SKILL.md whose frontmatter contains only fields classified as universal or agent-scoped to `claude-code` in the field registry. The body MUST be identical to the canonical body.

#### Scenario: Claude Code output includes only allowlisted fields

- GIVEN a canonical SKILL.md with fields `name`, `description`, `disable-model-invocation`, `user-invocable`, and an OpenCode-scoped field
- WHEN the Claude Code adapter runs
- THEN the output frontmatter MUST contain `name`, `description`, `disable-model-invocation`, `user-invocable`
- AND MUST NOT contain the OpenCode-scoped field

#### Scenario: Claude Code install path

- GIVEN a skill with `name: my-skill`
- WHEN the Claude Code adapter resolves its install path
- THEN the resolved path MUST be `~/.claude/skills/my-skill/SKILL.md`

### Requirement: OpenCode Adapter Transform

The OpenCode adapter MUST produce a SKILL.md whose frontmatter contains only fields classified as universal or agent-scoped to `opencode` in the field registry. The body MUST be identical to the canonical body.

#### Scenario: OpenCode output includes only allowlisted fields

- GIVEN a canonical SKILL.md with fields `name`, `description`, `disable-model-invocation`, and an OpenCode-scoped field
- WHEN the OpenCode adapter runs
- THEN the output frontmatter MUST contain `name`, `description`, and the OpenCode-scoped field
- AND MUST NOT contain `disable-model-invocation`

#### Scenario: OpenCode install path

- GIVEN a skill with `name: my-skill`
- WHEN the OpenCode adapter resolves its install path
- THEN the resolved path MUST be `~/.config/opencode/skills/my-skill/SKILL.md`

### Requirement: Body Unchanged by Adapters

Neither adapter MAY alter the markdown body. This requirement reinforces the canonical source format contract at the adapter execution boundary.

#### Scenario: Body content identical post-transform

- GIVEN a canonical SKILL.md body containing multi-line code fences and Unicode characters
- WHEN either adapter produces output
- THEN a byte-for-byte comparison of input body and output body MUST show no difference
