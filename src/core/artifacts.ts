import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { type Run, runPath, updateStage, writeJsonAtomic } from './run';

export type ArtifactName = 'scope' | 'flows' | 'brief' | 'theme' | 'screens' | 'contract' | 'matrix';
export type ArtifactRef = { version: number; hash: string };
export type Envelope<T> = {
  meta: {
    artifact: ArtifactName;
    version: number;
    hash: string;
    inputs: Partial<Record<ArtifactName, ArtifactRef>>;
    stage: string;
    model: string | null;
    rounds: number;
    createdAt: string;
  };
  data: T;
};
export type ArtifactMeta = { stage: string; model: string | null; rounds: number; inputs: ArtifactName[] };

export const FILE_OF: Record<ArtifactName, string> = {
  scope: '01-scope.json',
  flows: '01-flows.json',
  brief: '02-brief.json',
  theme: '02-theme.json',
  screens: '02-screens.json',
  contract: '03-contract.json',
  matrix: '04-matrix.json',
};

/** JSON with keys sorted at every level and no whitespace, so equal data hashes equal. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value === null || typeof value !== 'object') return value;
  const record = value as Record<string, unknown>;
  return Object.fromEntries(
    Object.keys(record)
      .sort()
      .map((key) => [key, sortKeys(record[key])]),
  );
}

export function hashOf(value: unknown): string {
  return createHash('sha256').update(canonicalJson(value)).digest('hex');
}

export function hasArtifact(run: Run, name: ArtifactName): boolean {
  return existsSync(runPath(run, FILE_OF[name]));
}

export function readArtifact<T>(run: Run, name: ArtifactName): Envelope<T> {
  const file = runPath(run, FILE_OF[name]);
  if (!existsSync(file)) {
    throw new Error(`Run ${run.id} has no ${name} artifact (${FILE_OF[name]}); run its stage first`);
  }
  return JSON.parse(readFileSync(file, 'utf8')) as Envelope<T>;
}

export function writeArtifact<T>(run: Run, name: ArtifactName, data: T, meta: ArtifactMeta): Envelope<T> {
  const previous = hasArtifact(run, name) ? readArtifact<unknown>(run, name).meta.version : 0;
  const inputs: Envelope<T>['meta']['inputs'] = {};
  for (const input of meta.inputs) {
    const { version, hash } = readArtifact<unknown>(run, input).meta;
    inputs[input] = { version, hash };
  }
  const envelope: Envelope<T> = {
    meta: {
      artifact: name,
      version: previous + 1,
      hash: hashOf(data),
      inputs,
      stage: meta.stage,
      model: meta.model,
      rounds: meta.rounds,
      createdAt: new Date().toISOString(),
    },
    data,
  };
  writeJsonAtomic(runPath(run, FILE_OF[name]), envelope);
  const { version, hash } = envelope.meta;
  updateStage(run, meta.stage, { status: 'done', version, hash, rounds: meta.rounds });
  return envelope;
}

/** True when any input artifact was rewritten with different data since this one was made. */
export function isStale(run: Run, name: ArtifactName): boolean {
  const { inputs } = readArtifact<unknown>(run, name).meta;
  return Object.entries(inputs).some(([input, ref]) => {
    const current = input as ArtifactName;
    return !hasArtifact(run, current) || readArtifact<unknown>(run, current).meta.hash !== ref?.hash;
  });
}
