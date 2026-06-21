# Field Registry Specification

## Purpose

Defines the formal registry that classifies frontmatter fields as universal (valid for all adapters) or agent-scoped (valid only for a specific target), and how adapters consume it.

## Requirements

### Requirement: Universal vs Agent-Scoped Classification

The field registry MUST classify every known frontmatter field as either `universal` or `agent-scoped`. A universal field (e.g. `name`, `description`, `trigger`, `license`, `metadata.*`) MUST be preserved in all adapter outputs. An agent-scoped field (e.g. `disable-model-invocation`, `user-invocable`) MUST only be emitted by the adapter it is registered to.

#### Scenario: Universal field preserved by all adapters

- GIVEN the field `license` is registered as universal
- WHEN both the Claude Code adapter and OpenCode adapter process a skill
- THEN both outputs MUST contain `license` in their frontmatter

#### Scenario: Agent-scoped field stripped by non-owning adapter

- GIVEN the field `disable-model-invocation` is registered as agent-scoped to `claude-code`
- WHEN the OpenCode adapter processes a skill containing that field
- THEN the OpenCode output MUST NOT contain `disable-model-invocation`

#### Scenario: Agent-scoped field preserved by owning adapter

- GIVEN the field `disable-model-invocation` is registered as agent-scoped to `claude-code`
- WHEN the Claude Code adapter processes a skill containing that field
- THEN the Claude Code output MUST contain `disable-model-invocation`

### Requirement: Registry as Anti-Drift Source

The field registry MUST be the single source of truth that adapters consult to determine which fields to include. Adapters MUST NOT hardcode field allowlists independently. Adding support for a new field MUST require only a registry edit.

#### Scenario: New field added to registry

- GIVEN a new field `model-preference` is added to the registry as universal
- WHEN both adapters run
- THEN both MUST include `model-preference` in their output without code changes to the adapter logic

#### Scenario: Adapter strips unlisted field

- GIVEN a canonical SKILL.md contains a field `unknown-field` not present in the registry
- WHEN any adapter processes the skill
- THEN `unknown-field` MUST NOT appear in the adapter output

> NOTE (implementation): the adapter strips unlisted fields silently. The
> originally-specified "emit a warning identifying the stripped field" is
> subsumed by an earlier gate: the canonical schema uses
> `additionalProperties: false`, and a startup assertion guarantees every
> schema property has a registry entry. An unknown field therefore FAILS
> validation (with the field named, per the frontmatter-validation spec) before
> it can ever reach `stripFields`. The strip path is effectively unreachable for
> unknown fields, so a separate warning there would be dead code. If
> `additionalProperties` is ever relaxed, restore the warning requirement here.

### Requirement: Extension Points

The registry MUST define a documented entry format that supports adding future agent targets (e.g. Cursor, Copilot) via registry edits only. The extension point MUST be defined but no implementation for deferred targets is required in v1.

#### Scenario: Registry entry format is documented

- GIVEN the field registry source file
- WHEN a developer reads it
- THEN each entry MUST specify at minimum: field name, classification (universal or agent-scoped), and owning agent (if agent-scoped)
