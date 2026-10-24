/**
 * Benchmark result file (TV1) — the artefact a reviewer reads instead of
 * trusting whoever ran the benchmark. Shape follows `docs/06-benchmark/README.md`.
 *
 * `toMarkdown` validates at this boundary: a result without an environment, a
 * hash, or any group is refused rather than rendered with blanks. Protocol
 * values that the team has not fixed yet stay "not fixed" — this module never
 * substitutes a sample count or duration.
 */
import type { LabConfig } from '../../presets/preset.ts';
import type { AggregateGroup, ValueSummary } from './aggregate.ts';

export interface BenchmarkEnvironment {
  readonly browser: string;
  readonly browserVersion: string;
  readonly os: string;
  readonly gpu: string;
  readonly driver: string;
  readonly commit: string;
  readonly sameHost: boolean;
}

/** Values `docs/01-requirements/mvp-acceptance.md` §2 leaves to TV5. */
export interface BenchmarkProtocol {
  readonly warmUpSeconds: number | null;
  readonly sampleCount: number | null;
  readonly durationSeconds: number | null;
}

export interface BenchmarkResult {
  readonly environment: BenchmarkEnvironment;
  readonly config: Readonly<LabConfig>;
  readonly configHash: string;
  readonly protocol: BenchmarkProtocol;
  readonly groups: readonly AggregateGroup[];
  readonly limitations: readonly string[];
}

const CONFIG_HASH_PATTERN = /^[0-9a-f]{64}$/;
const REQUIRED_ENVIRONMENT_FIELDS = ['browser', 'os', 'gpu', 'commit'] as const;

function requiredText(value: string, field: string): string {
  if (value.trim() === '') {
    throw new TypeError(`toMarkdown: environment.${field} is required`);
  }
  return value;
}

function formatProtocol(label: string, value: number | null): string {
  if (value === null) return `${label}: not fixed`;
  if (!Number.isFinite(value) || value < 0) {
    throw new TypeError(`toMarkdown: protocol ${label} must be a non-negative number or null`);
  }
  return `${label}: ${value}`;
}

function formatMetric(summary: ValueSummary | null): string {
  if (summary === null) return 'n/a';
  return `${summary.median} (${summary.min}–${summary.max}, n=${summary.count})`;
}

export function toMarkdown(result: BenchmarkResult): string {
  const { environment, protocol, groups } = result;

  if (!CONFIG_HASH_PATTERN.test(result.configHash)) {
    throw new TypeError('toMarkdown: configHash must be 64 lowercase hex characters');
  }
  if (groups.length === 0) {
    throw new TypeError('toMarkdown: a result needs at least one backend group');
  }
  for (const field of REQUIRED_ENVIRONMENT_FIELDS) requiredText(environment[field], field);
  for (const group of groups) {
    if (group.configHash !== result.configHash) {
      throw new TypeError('toMarkdown: every group must belong to the result configuration');
    }
  }

  const lines: string[] = [
    '# Benchmark result',
    '',
    '## Environment',
    `- Browser: ${environment.browser} ${environment.browserVersion}`.trimEnd(),
    `- OS: ${environment.os}`,
    `- GPU: ${environment.gpu} (driver ${environment.driver})`.trimEnd(),
    `- Commit: ${environment.commit}`,
    `- Same host for both backends: ${environment.sameHost ? 'yes' : 'no'}`,
    '',
    '## Configuration',
    `- configHash: ${result.configHash}`,
    `- Preset JSON: \`${JSON.stringify(result.config)}\``,
    `- ${formatProtocol('warm-up', protocol.warmUpSeconds)}`,
    `- ${formatProtocol('sample count', protocol.sampleCount)}`,
    `- ${formatProtocol('duration', protocol.durationSeconds)}`,
    '',
    '## Runs',
    '| actual backend | samples | fps median (min–max) | gpuTimeMs median (min–max) |',
    '|---|---|---|---|',
  ];

  for (const group of groups) {
    lines.push(
      `| ${group.actual} | ${group.count} | ${formatMetric(group.fps)} | ${formatMetric(group.gpuTimeMs)} |`,
    );
  }

  lines.push('', '## Limitations');
  if (result.limitations.length === 0) lines.push('- none recorded');
  else for (const limitation of result.limitations) lines.push(`- ${limitation}`);

  return `${lines.join('\n')}\n`;
}
