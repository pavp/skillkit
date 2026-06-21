---
name: example-skill
description: Demonstrates the canonical SkillKit format. Use as a reference when authoring new skills.
trigger: /example
license: Apache-2.0
disable-model-invocation: false
user-invocable: true
metadata:
  author: skillkit-project
  version: "1.0"
---

## Purpose

This skill exists to validate the full skillkit pipeline: parse → validate → adapt → install.
It is a reference template, not a real tool — but it is written as if it were one.

## When to Use

Load this skill when you want to see how a well-formed `SKILL.md` looks end-to-end.

Reference it when:

- Starting a new skill from scratch.
- Verifying that the pipeline correctly strips adapter-specific fields.
- Checking that the body is preserved byte-for-byte after install.

## Format Rules

| Section | Required | Notes |
|---------|----------|-------|
| Frontmatter | Yes | Must have `name` and `description` at minimum |
| Trigger | Recommended | Slash command or natural-language phrase |
| Body | Yes | Markdown; preserved verbatim; no adapter may modify it |

## Example Usage

When a user invokes `/example`, the agent loads this skill and follows the instructions below.

1. Explain what the skill is for.
2. Show the frontmatter fields that survive for each target agent.
3. Remind the user that the body is never modified by the pipeline.

## Notes

- `disable-model-invocation` and `user-invocable` are Claude-only fields. They are stripped when installing to OpenCode.
- Universal fields (`name`, `description`, `trigger`, `license`, `metadata`) appear in all installed copies.
