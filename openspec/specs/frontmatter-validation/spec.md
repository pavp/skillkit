# Frontmatter Validation Specification

## Purpose

Defines the JSON Schema validation behavior over canonical SKILL.md frontmatter, including pass/fail rules and error reporting.

## Requirements

### Requirement: Schema-Driven Validation

The build pipeline MUST validate canonical frontmatter against a JSON Schema located at `schemas/skill.schema.json`. Validation MUST run before any adapter step. A skill that fails schema validation MUST NOT be adapted or installed.

#### Scenario: Valid frontmatter passes schema

- GIVEN a SKILL.md whose frontmatter contains only fields declared in `schemas/skill.schema.json`
- WHEN schema validation runs
- THEN validation passes and the pipeline continues

#### Scenario: Invalid field type fails schema

- GIVEN a SKILL.md where `name` is an integer instead of a string
- WHEN schema validation runs
- THEN validation MUST fail with an error naming the field and expected type

#### Scenario: Unknown field present

- GIVEN a SKILL.md with an unrecognized frontmatter field not in the schema
- WHEN schema validation runs
- THEN validation MUST fail (additionalProperties: false enforced) and MUST report the offending field name

### Requirement: Error Reporting

Validation errors MUST be human-readable. Each error MUST report: the field path, the violation type (missing required, wrong type, unknown field), and the expected value or constraint.

#### Scenario: Multiple errors reported together

- GIVEN a SKILL.md with two invalid fields
- WHEN schema validation runs
- THEN ALL errors MUST be reported in a single output, not just the first

#### Scenario: Error output format

- GIVEN any validation failure
- WHEN the error is emitted
- THEN it MUST include the skill name (or file path if name is absent), the field path, and the reason

### Requirement: Validation Precedes Adapter Steps

Validation MUST be the first stage of the build pipeline. No adapter transformation or install step SHALL execute if schema validation has not passed.

#### Scenario: Adapter skipped on validation failure

- GIVEN a SKILL.md that fails schema validation
- WHEN the build pipeline runs
- THEN the Claude Code adapter MUST NOT execute
- AND the OpenCode adapter MUST NOT execute
- AND no install path MUST be written
