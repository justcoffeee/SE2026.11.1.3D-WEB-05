/**
 * Architecture fitness checks (TV1).
 *
 * The dependency rules in `docs/architecture.md` §2 are written down; this test
 * is what makes them fail the build. A rule that only exists in a diagram is a
 * suggestion — the first import written in a hurry deletes it.
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkArchitecture, type SourceFile } from '../fitness/imports.ts';

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url));

/** Every TypeScript file under `src/`, keyed by its repo-relative path. */
function readSources(dir: string): SourceFile[] {
  const files: SourceFile[] = [];
  for (const entry of readdirSync(join(REPO_ROOT, dir), { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.ts')) continue;
    const absolute = join(entry.parentPath, entry.name);
    files.push({
      path: relative(REPO_ROOT, absolute).replaceAll('\\', '/'),
      source: readFileSync(absolute, 'utf8'),
    });
  }
  return files;
}

const source = (path: string, body: string): SourceFile => ({ path, source: body });

test('fitness: the UI does not import the simulation directly', () => {
  const violations = checkArchitecture([
    source('src/ui/app.ts', "import { step } from '../simulations/simulation.ts';"),
  ]);

  assert.equal(violations.length, 1);
  assert.equal(violations[0]?.rule, 'ui-does-not-import-simulation');
});

test('fitness: core stays free of three', () => {
  const violations = checkArchitecture([
    source('src/core/renderer/adapter.ts', "import { WebGPURenderer } from 'three/webgpu';"),
  ]);

  assert.equal(violations.length, 1);
  assert.equal(violations[0]?.rule, 'core-does-not-import-three');
});

test('fitness: core does not touch document or window', () => {
  const violations = checkArchitecture([
    source('src/core/renderer/adapter.ts', 'const canvas = document.createElement("canvas");'),
    source('src/core/measurement/aggregate.ts', 'const size = window.innerWidth;'),
  ]);

  assert.deepEqual(
    violations.map((violation) => violation.rule),
    ['core-does-not-touch-dom', 'core-does-not-touch-dom'],
  );
});

test('fitness: a comment that mentions the DOM is not a violation', () => {
  const violations = checkArchitecture([
    source('src/core/renderer/Port.ts', '// The port is DOM-free: no document, no window.\nexport interface Port {}'),
  ]);

  assert.deepEqual(violations, []);
});

test('fitness: allowed imports and package imports stay clean', () => {
  const violations = checkArchitecture([
    source('src/ui/app.ts', "import type { LabConfig } from '../presets/preset.ts';"),
    source('src/core/measurement/hash.ts', "import { createHash } from 'node:crypto';"),
    source('src/main.ts', "import { mountLabUI } from './ui/app.ts';"),
  ]);

  assert.deepEqual(violations, []);
});

test('fitness: the composition root does not import a concrete backend', () => {
  const violations = checkArchitecture([
    source('src/main.ts', "import { ThreeRendererAdapter } from './simulations/rendererAdapter.ts';"),
    source('src/main.ts', "import { WebGPURenderer } from 'three/webgpu';"),
  ]);

  assert.deepEqual(
    violations.map((violation) => violation.rule),
    ['main-does-not-import-backend', 'main-does-not-import-backend'],
  );
});

test('fitness: the repository itself follows the rules', () => {
  assert.deepEqual(checkArchitecture(readSources('src')), []);
});
