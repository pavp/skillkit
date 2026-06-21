import { homedir } from 'node:os';
import { join } from 'node:path';
import type { Adapter } from './adapter.js';
import { assertValidSkillName } from './adapter.js';

// ---------------------------------------------------------------------------
// Claude Code adapter
// ---------------------------------------------------------------------------
// Keeps universal + claude-scoped fields.
// Install root: ~/.claude/skills/{name}/SKILL.md

export const claudeAdapter: Adapter = {
  agent: 'claude',

  resolveInstallPath(name: string): string {
    assertValidSkillName(name);
    return join(homedir(), '.claude', 'skills', name, 'SKILL.md');
  },
} as const;
