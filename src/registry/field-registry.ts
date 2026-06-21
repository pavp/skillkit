import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

// ---------------------------------------------------------------------------
// Field Registry
// ---------------------------------------------------------------------------
// Single source of truth for every known SKILL.md frontmatter field.
// Adapters MUST NOT hardcode allowlists — they consult this registry.
// Extension point: add a new field or Scope value here; no adapter changes needed.

export type Scope = 'universal' | 'claude' | 'opencode';

export interface FieldDefinition {
  readonly scope: Scope;
  readonly required?: true;
}

export const FIELD_REGISTRY = {
  name:                       { scope: 'universal', required: true  },
  description:                { scope: 'universal', required: true  },
  trigger:                    { scope: 'universal'                  },
  license:                    { scope: 'universal'                  },
  metadata:                   { scope: 'universal'                  },
  'disable-model-invocation': { scope: 'claude'                    },
  'user-invocable':           { scope: 'claude'                    },
} as const satisfies Record<string, FieldDefinition>;

export type FieldRegistry = typeof FIELD_REGISTRY;
export type KnownField = keyof FieldRegistry;

// ---------------------------------------------------------------------------
// Startup consistency assertion
// ---------------------------------------------------------------------------
// At module load, assert every property in the JSON Schema has a FIELD_REGISTRY
// entry. Throws with the offending field name if any schema property is missing.
// This prevents schema/registry drift without a test runner.

function assertRegistryCoversSchema(): void {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const schemaPath = join(__dirname, '../../schemas/skill.schema.json');

  let schema: { properties?: Record<string, unknown> };
  try {
    schema = JSON.parse(readFileSync(schemaPath, 'utf8')) as typeof schema;
  } catch (err) {
    throw new Error(
      `field-registry: cannot read schema at ${schemaPath}: ${String(err)}`
    );
  }

  const schemaProperties = Object.keys(schema.properties ?? {});
  for (const field of schemaProperties) {
    if (!(field in FIELD_REGISTRY)) {
      throw new Error(
        `field-registry: schema property "${field}" has no FIELD_REGISTRY entry. ` +
        `Add it to FIELD_REGISTRY before shipping.`
      );
    }
  }
}

assertRegistryCoversSchema();
