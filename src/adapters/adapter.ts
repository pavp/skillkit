import type { FieldRegistry } from '../registry/field-registry.js';

// ---------------------------------------------------------------------------
// Adapter interface
// ---------------------------------------------------------------------------
// Each supported agent (Claude Code, OpenCode) implements this interface.
// Adapters are pure value objects — they carry no mutable state.

export interface Adapter {
  /** Agent identifier — used for scope filtering in the field registry. */
  readonly agent: 'claude' | 'opencode';

  /**
   * Returns the absolute install path for a skill by name.
   * The returned path MUST end with `SKILL.md`.
   * `~` is expanded to os.homedir() — callers MUST NOT expand it again.
   */
  resolveInstallPath(name: string): string;
}

// ---------------------------------------------------------------------------
// stripFields()
// ---------------------------------------------------------------------------
// Shared field-filtering engine used by all adapters.
//
// Keep a field when:
//   registry[field].scope === 'universal'   (present on every agent)
//   registry[field].scope === adapter.agent (this adapter's exclusive fields)
//
// Unknown fields (not in registry) are always stripped — additive safety.

export function stripFields(
  frontmatter: Record<string, unknown>,
  adapter: Adapter,
  registry: FieldRegistry,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(frontmatter)) {
    const def = registry[key as keyof FieldRegistry];
    if (!def) {
      // Unknown field — strip silently.
      continue;
    }
    if (def.scope === 'universal' || def.scope === adapter.agent) {
      out[key] = value;
    }
    // else: field is scoped to a different agent — strip.
  }

  return out;
}
