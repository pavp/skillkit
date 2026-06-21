import { test } from 'node:test';
import assert from 'node:assert/strict';
import { homedir } from 'node:os';
import { join } from 'node:path';

import { parse } from '../src/parse.js';
import { stripFields, assertValidSkillName } from '../src/adapters/adapter.js';
import { claudeAdapter } from '../src/adapters/claude.js';
import { opencodeAdapter } from '../src/adapters/opencode.js';
import { FIELD_REGISTRY } from '../src/registry/field-registry.js';
import { installSkill } from '../src/install.js';

// ---------------------------------------------------------------------------
// stripFields — the core differentiator: OpenCode must strip claude-only fields
// ---------------------------------------------------------------------------

const FRONTMATTER = {
  name: 'demo',
  description: 'd',
  trigger: '/demo',
  license: 'Apache-2.0',
  metadata: { author: 'x' },
  'disable-model-invocation': false,
  'user-invocable': true,
};

test('OpenCode strips claude-only fields, keeps universal', () => {
  const out = stripFields(FRONTMATTER, opencodeAdapter, FIELD_REGISTRY);
  assert.ok(!('disable-model-invocation' in out), 'disable-model-invocation must be stripped');
  assert.ok(!('user-invocable' in out), 'user-invocable must be stripped');
  assert.equal(out.name, 'demo');
  assert.equal(out.trigger, '/demo');
  assert.deepEqual(out.metadata, { author: 'x' });
});

test('Claude keeps claude-only fields', () => {
  const out = stripFields(FRONTMATTER, claudeAdapter, FIELD_REGISTRY);
  assert.equal(out['disable-model-invocation'], false);
  assert.equal(out['user-invocable'], true);
  assert.equal(out.name, 'demo');
});

test('unknown fields are always stripped', () => {
  const out = stripFields({ ...FRONTMATTER, bogus: 1 }, claudeAdapter, FIELD_REGISTRY);
  assert.ok(!('bogus' in out));
});

// ---------------------------------------------------------------------------
// parse — body byte-for-byte fidelity
// ---------------------------------------------------------------------------

test('parse preserves body byte-for-byte incl. trailing newline', () => {
  const body = '## A\n\nline\twith\ttabs\nand a trailing newline\n';
  const raw = `---\nname: x\ndescription: y\n---\n${body}`;
  const { body: out } = parse(raw);
  assert.equal(out, body);
});

test('parse preserves CRLF in body', () => {
  const body = 'line1\r\nline2\r\n';
  const raw = `---\nname: x\ndescription: y\n---\n${body}`;
  const { body: out } = parse(raw);
  assert.equal(out, body);
});

// ---------------------------------------------------------------------------
// skill-name validation (defense-in-depth at the adapter boundary)
// ---------------------------------------------------------------------------

for (const bad of ['..', '.', '', '.hidden', 'a/b', 'a\\b', '../escape', 'x..y']) {
  test(`assertValidSkillName rejects ${JSON.stringify(bad)}`, () => {
    assert.throws(() => assertValidSkillName(bad));
  });
}

for (const good of ['example-skill', 'my_skill', 'Skill123']) {
  test(`assertValidSkillName accepts ${JSON.stringify(good)}`, () => {
    assert.doesNotThrow(() => assertValidSkillName(good));
  });
}

test('adapters reject traversal names via resolveInstallPath', () => {
  assert.throws(() => claudeAdapter.resolveInstallPath('../../evil'));
  assert.throws(() => opencodeAdapter.resolveInstallPath('a/b'));
});

// ---------------------------------------------------------------------------
// install safety guard — refuses paths outside known install roots
// ---------------------------------------------------------------------------

test('installSkill refuses a path outside install roots (even dry-run)', () => {
  const evil = join(homedir(), '.ssh', 'authorized_keys');
  assert.throws(() => installSkill('x', evil, true), /outside known install roots/);
});

test('installSkill refuses a normalized-escape path', () => {
  const escape = join(homedir(), '.claude', 'skills', '..', '..', '.ssh', 'x');
  assert.throws(() => installSkill('x', escape, true), /outside known install roots/);
});

test('dry-run for a valid root path does not throw and writes nothing', () => {
  const dest = claudeAdapter.resolveInstallPath('example-skill');
  // dry-run returns without mutation; absence of throw is the assertion here.
  assert.doesNotThrow(() => installSkill('content', dest, true));
});
