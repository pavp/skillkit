import { homedir } from 'node:os';
import { join } from 'node:path';
import type { Adapter } from './adapter.js';
import { assertValidSkillName } from './adapter.js';

// ---------------------------------------------------------------------------
// OpenCode adapter
// ---------------------------------------------------------------------------
// Keeps universal fields only (strips claude-exclusive fields such as
// `disable-model-invocation` and `user-invocable`).
// Install root: ~/.config/opencode/skills/{name}/SKILL.md

export const opencodeAdapter: Adapter = {
  agent: 'opencode',

  resolveInstallPath(name: string): string {
    assertValidSkillName(name);
    return join(homedir(), '.config', 'opencode', 'skills', name, 'SKILL.md');
  },
} as const;
