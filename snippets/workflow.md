# Workflow snippet for AGENTS.md

Copy the block below into your project's `AGENTS.md`. It works in any stack. If the project also has a `CLAUDE.md`, Claude Code reads only that file: add `@AGENTS.md` to it, or paste the block there instead. After `npx skills update`, replace everything between the two `skillkit workflow snippet` markers with the new block.

````markdown
<!-- skillkit workflow snippet v1.6.0 -->
## Workflow skills (skillkit)

When you finish implementing a ticket, feature or bug fix, or the changes a review asked for on your PR — before you tell the user it is done or ready for review, and before you open a pull request for it — load `verify-before-pr` by name — through your skill tool, or by reading its whole `SKILL.md` — even when the tests are green. Skip it only when nothing runs differently after the change: docs, comments, formatting, or tooling config. Text an agent follows (a prompt, a skill, agent instructions) has behavior: verify it. When you delegate that step, name the skill in the delegation prompt. Skip it if it is not installed.

Before you open a pull request for your own change, or write, fill or update its description, load `pr-description` the same way. Skip it if it is not installed.

Rules that hold even when the skills were not loaded:

- Take acceptance criteria from the ticket, the user's request, or a review comment the user chose to address, never from the code you wrote; a criterion leaves only when one of those removes it, and the PR says so.
- Count as evidence only what you observed running; "tests are green" is a claim, not evidence.
- A new test proves the change only if it fails on the base commit.
- Never weaken or delete an existing assertion to make a change pass.
- Never use credentials found in the repo or `.env`; ask for access.
- Show the change on both sides — base and branch, same input — and capture the "before" without stashing, reverting or switching the user's checkout.
- In a stacked PR, the base is the branch the PR targets, never the default branch.
- Put verify-before-pr evidence in a PR only from its `pr-block.md`, between its markers, every number and command copied literally, results in plain words and never an overall verdict, with its media uploaded by the forge; never publish `evidence.md`, and never replace the rest of the description.
- Evidence applies only to the tree it recorded: before publishing it, `git rev-parse HEAD^{tree}` must print that tree, or verify again; when the commits since change nothing that runs, keep it and name those commits under Not verified.
- A security fix publishes impact only: no reproduction, payload or exploit steps in the PR.
- A PR description or comment names what was checked, never a skill, agent, model or workflow.
- A PR description claims only what was observed: no invented number, result or ticked checkbox; what was not checked goes under Not verified.
<!-- /skillkit workflow snippet -->
````
