/**
 * Import scanning behind the architecture fitness checks (TV1).
 *
 * ponytail: specifiers are found with a regex, not with a TypeScript parse.
 * It misses a path assembled at runtime (`import('./' + name)`) and can be
 * fooled by a `from '...'` inside a string. Replace with `ts.createSourceFile`
 * if a violation ever slips past it.
 */
import { posix } from 'node:path';

export interface SourceFile {
  /** Repo-relative path with forward slashes, e.g. `src/ui/app.ts`. */
  readonly path: string;
  readonly source: string;
}

export interface Violation {
  /** Rule id as it appears in the failure message. */
  readonly rule: string;
  readonly file: string;
  /** The import specifier or identifier that broke the rule. */
  readonly detail: string;
}

const SPECIFIER_PATTERN = /\b(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g;
const LINE_COMMENT = /\/\/.*$/gm;
const BLOCK_COMMENT = /\/\*[\s\S]*?\*\//g;
const DOM_REFERENCE = /\b(document|window)\s*[.[(]/;

/** Import specifiers in source order, including `import type` and `export … from`. */
export function importsOf(source: string): string[] {
  return [...source.matchAll(SPECIFIER_PATTERN)].map((match) => match[1]!);
}

/** The repo-relative file a relative specifier points at; `null` for a package. */
export function importTarget(fromPath: string, specifier: string): string | null {
  if (!specifier.startsWith('.')) return null;
  return posix.normalize(posix.join(posix.dirname(fromPath), specifier));
}

/**
 * Checks the rules from `docs/architecture.md` §2 against a set of sources.
 * Returns every violation instead of the first, so one run shows the whole
 * drift.
 */
export function checkArchitecture(files: readonly SourceFile[]): Violation[] {
  const violations: Violation[] = [];

  for (const file of files) {
    const imports = importsOf(file.source);

    if (file.path.startsWith('src/ui/')) {
      for (const specifier of imports) {
        const target = importTarget(file.path, specifier);
        if (target?.startsWith('src/simulations/')) {
          violations.push({ rule: 'ui-does-not-import-simulation', file: file.path, detail: specifier });
        }
      }
    }

    if (file.path === 'src/main.ts') {
      for (const specifier of imports) {
        const target = importTarget(file.path, specifier);
        if (
          specifier === 'three'
          || specifier.startsWith('three/')
          || target?.startsWith('src/simulations/')
        ) {
          violations.push({ rule: 'main-does-not-import-backend', file: file.path, detail: specifier });
        }
      }
    }

    if (!file.path.startsWith('src/core/')) continue;

    for (const specifier of imports) {
      if (specifier === 'three' || specifier.startsWith('three/')) {
        violations.push({ rule: 'core-does-not-import-three', file: file.path, detail: specifier });
      }
    }

    // Comments talk about the DOM freely; only code that reaches for it counts.
    const code = file.source.replace(BLOCK_COMMENT, '').replace(LINE_COMMENT, '');
    const dom = DOM_REFERENCE.exec(code);
    if (dom) {
      violations.push({ rule: 'core-does-not-touch-dom', file: file.path, detail: dom[1]! });
    }
  }

  return violations;
}
