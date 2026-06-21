import { Ajv, type ErrorObject } from 'ajv';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ValidationFailure {
  field: string;
  message: string;
}

export class ValidationError extends Error {
  constructor(public readonly failures: ValidationFailure[]) {
    const summary = failures
      .map((f) => `  - ${f.field}: ${f.message}`)
      .join('\n');
    super(`Validation failed with ${failures.length} error(s):\n${summary}`);
    this.name = 'ValidationError';
  }
}

// ---------------------------------------------------------------------------
// Schema loading
// ---------------------------------------------------------------------------
// Loaded once at module initialisation via readFileSync + JSON.parse.
// Rationale: avoids import-assertion version fragility (Node 20 `with { type: 'json' }`
// syntax is stage-3 but toolchain support is uneven); readFileSync is stable.

function loadSchema(): Record<string, unknown> {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const schemaPath = join(__dirname, '../schemas/skill.schema.json');
  return JSON.parse(readFileSync(schemaPath, 'utf8')) as Record<string, unknown>;
}

const schema = loadSchema();

// ---------------------------------------------------------------------------
// AJV instance — allErrors:true so every violation is collected in one pass.
// ---------------------------------------------------------------------------

const ajv = new Ajv({ allErrors: true });
const validateFn = ajv.compile(schema);

// ---------------------------------------------------------------------------
// validate()
// ---------------------------------------------------------------------------
// Runs AJV over parsed frontmatter. On failure throws ValidationError containing
// ALL violations — callers MUST NOT run any adapter or install step after a throw.

export function validate(frontmatter: Record<string, unknown>): void {
  const valid = validateFn(frontmatter);
  if (!valid) {
    const errors = validateFn.errors ?? [];
    const failures: ValidationFailure[] = errors.map((e: ErrorObject) => ({
      field:
        e.instancePath.replace(/^\//, '') ||
        (e.params?.missingProperty as string | undefined) ||
        (e.params?.additionalProperty as string | undefined) ||
        '(root)',
      message: e.message ?? 'unknown error',
    }));
    throw new ValidationError(failures);
  }
}
