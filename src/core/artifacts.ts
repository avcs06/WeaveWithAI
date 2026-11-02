import { existsSync, readFileSync } from 'node:fs';
import { type Run, runPath, updateStage } from './run';
import { hashOf, writeJsonAtomic } from './utils';

export type ArtifactName =
  | 'flows-scope'
  | 'flows-catalog'
  | 'flows-expand'
  | 'design-theme'
  | 'design-architect'
  | 'contract'
  | 'code-contract';
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
export type ArtifactMeta = {
  stage: string;
  model: string | null;
  rounds: number;
  inputs: ArtifactName[];
};

/** Each artifact's file in the run, in a folder per stage group like the agents' own (01-flows/01-scope.json). */
export const FILE_OF: Record<ArtifactName, string> = {
  'flows-scope': '01-flows/01-scope.json',
  'flows-catalog': '01-flows/02-catalog.json',
  'flows-expand': '01-flows/03-expand.json',
  'design-theme': '02-design/01-theme.json',
  'design-architect': '02-design/02-architect.json',
  contract: '03-contract.json',
  'code-contract': '04-code/02-contract.json',
};

/** The markdown an artifact is rendered to, beside it. */
export const markdownOf = (name: ArtifactName): string =>
  FILE_OF[name].replace(/\.json$/, '.md');

export function hasArtifact(run: Run, name: ArtifactName): boolean {
  return existsSync(runPath(run, FILE_OF[name]));
}

export function readArtifact<T>(run: Run, name: ArtifactName): Envelope<T> {
  const file = runPath(run, FILE_OF[name]);
  if (!existsSync(file)) {
    throw new Error(
      `Run ${run.id} has no ${name} artifact (${FILE_OF[name]}); run its stage first`,
    );
  }
  return JSON.parse(readFileSync(file, 'utf8')) as Envelope<T>;
}

export function writeArtifact<T>(
  run: Run,
  name: ArtifactName,
  data: T,
  meta: ArtifactMeta,
): Envelope<T> {
  const previous = hasArtifact(run, name)
    ? readArtifact<unknown>(run, name).meta.version
    : 0;
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
  updateStage(run, meta.stage, {
    status: 'done',
    version,
    hash,
    rounds: meta.rounds,
  });
  return envelope;
}

/** True when any input artifact was rewritten with different data since this one was made. */
export function isStale(run: Run, name: ArtifactName): boolean {
  const { inputs } = readArtifact<unknown>(run, name).meta;
  return Object.entries(inputs).some(([input, ref]) => {
    const current = input as ArtifactName;
    return (
      !hasArtifact(run, current) ||
      readArtifact<unknown>(run, current).meta.hash !== ref?.hash
    );
  });
}
