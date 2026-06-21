# Canonical Source Format Specification

## Purpose

Defines what constitutes a valid canonical SKILL.md file — the single agent-agnostic source of truth for a skill.

## Requirements

### Requirement: Canonical File Structure

A canonical skill MUST be a single file named `SKILL.md`. It MUST contain a YAML frontmatter block delimited by `---` as the first content of the file, followed by a markdown body.

#### Scenario: Valid canonical file

- GIVEN a file named `SKILL.md` with a `---`-delimited YAML block at the top followed by markdown
- WHEN the build pipeline reads the file
- THEN it is accepted as a valid canonical skill source

#### Scenario: Missing frontmatter delimiter

- GIVEN a `SKILL.md` file with no leading `---` delimiter
- WHEN the build pipeline reads the file
- THEN validation MUST fail with an error indicating frontmatter is absent

#### Scenario: Body-only file (no frontmatter)

- GIVEN a `SKILL.md` file that begins with markdown content and no YAML block
- WHEN the build pipeline reads the file
- THEN validation MUST fail; the file is not a valid canonical source

### Requirement: Required Frontmatter Fields

The frontmatter MUST contain at minimum: `name` (string) and `description` (string). All other fields are optional at the canonical level unless declared REQUIRED in the field registry.

#### Scenario: All required fields present

- GIVEN a canonical SKILL.md with `name` and `description` set in frontmatter
- WHEN validation runs
- THEN the file passes required-field validation

#### Scenario: Missing required field

- GIVEN a canonical SKILL.md with `description` present but `name` absent
- WHEN validation runs
- THEN validation MUST fail and MUST report which required field is missing

### Requirement: Body Preservation Contract

The markdown body of a canonical SKILL.md MUST be copied byte-for-byte to every adapter output. No adapter MAY modify, reformat, or truncate the body.

#### Scenario: Body round-trip

- GIVEN a canonical SKILL.md with a markdown body containing headers, code blocks, and lists
- WHEN any adapter produces its output
- THEN the body section of the output MUST be identical to the canonical body

#### Scenario: Empty body

- GIVEN a canonical SKILL.md with a valid frontmatter block and an empty body
- WHEN an adapter processes it
- THEN the adapter output MUST contain an empty body (no content injected)
