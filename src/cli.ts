import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import {
  type ArtifactName,
  FILE_OF,
  hasArtifact,
  isStale,
} from './core/artifacts';
import { BACKEND_NAMES, isBackendName, resolveBackend } from './core/backends';
import { type Config, config as loadConfig } from './core/env';
import { formatForTerminal, type Issue, splitIssues } from './core/issues';
import { createLlm, type Llm } from './core/llm';
import {
  createRun,
  DEFAULT_RUNS_DIR,
  openRun,
  readEvents,
  readState,
  type Run,
  runPath,
  totals,
} from './core/run';
import { PIPELINE, type StageContext, stages } from './stages/index';

export class UsageError extends Error {}

export type RunArgs = {
  idea: string;
  run?: string;
  from?: string;
  to?: string;
  interactive?: boolean;
  replay?: boolean;
  backend?: string;
};

/** Tests pass a temp folder, a hand-built config, a fake llm and an output sink. */
export type CliDeps = {
  runsDir?: string;
  config?: Config;
  llm?: Llm;
  out?: (line: string) => void;
};

const USAGE = `usage:
  weave run <idea.md> [--run <id>] [--from <stage>] [--to <stage>] [--interactive] [--no-replay] [--backend <name>]
  weave validate <runId> [stage]
  weave show <runId>
  weave golden <runId> <ideaName> [--stages scope,flows]
  weave ds
  weave bench <runId>`;

export async function runCommand(
  args: RunArgs,
  deps: CliDeps = {},
): Promise<Run> {
  const out = deps.out ?? console.log;
  const runsDir = deps.runsDir ?? DEFAULT_RUNS_DIR;
  const to = args.to ?? stages[stages.length - 1]?.name;
  for (const [flag, value] of [
    ['--to', to],
    ['--from', args.from],
  ] as const) {
    if (value !== undefined && !PIPELINE.includes(value)) {
      throw new UsageError(
        `${flag} ${value}: unknown stage. Known stages: ${PIPELINE.join(', ')}`,
      );
    }
  }

  if (args.backend !== undefined && !isBackendName(args.backend)) {
    throw new UsageError(
      `--backend ${args.backend}: unknown backend. Known backends: ${BACKEND_NAMES.join(', ')}`,
    );
  }

  const loaded = deps.config ?? loadConfig();
  const config: Config =
    args.replay === false ? { ...loaded, LLM_REPLAY: false } : loaded;
  const run = args.run
    ? openRun(args.run, runsDir)
    : createRun({ idea: args.idea, runsDir });
  const backend = resolveBackend(config, args.backend);

  const ctx: StageContext = {
    run,
    config,
    llm: deps.llm ?? createLlm({ config, backend }),
    interactive: args.interactive ?? false,
    backend: backend.name,
  };
  out(`run ${run.id} (${run.dir})`);

  let forced = false;
  for (const name of PIPELINE) {
    if (name === args.from) forced = true;
    const def = stages.find((stage) => stage.name === name);
    if (def) {
      const before = readState(run).stages[name];
      const upToDate =
        before?.status === 'done' &&
        def.produces.every(
          (artifact) => hasArtifact(run, artifact) && !isStale(run, artifact),
        );
      if (upToDate && !forced) {
        out(`${name}: up to date (v${before.version ?? '?'})`);
      } else {
        out(`${name}: running`);
        await def.run(ctx);
        const after = readState(run).stages[name];
        const version = after?.version ? ` v${after.version}` : '';
        const rounds = after?.rounds ? `, ${after.rounds} rounds` : '';
        const known = after?.known
          ? `, ${after.known} known ${after.known === 1 ? 'issue' : 'issues'}`
          : '';
        out(`${name}: ${after?.status ?? 'done'}${version}${rounds}${known}`);
      }
    }
    if (name === to) break;
  }
  return run;
}

/** Validators only, no model calls. Returns every issue found. */
export function validateCommand(
  runId: string,
  stage: string | undefined,
  deps: CliDeps = {},
): Issue[] {
  const out = deps.out ?? console.log;
  const run = openRun(runId, deps.runsDir ?? DEFAULT_RUNS_DIR);
  const targets =
    stage === undefined ? stages : stages.filter((def) => def.name === stage);
  if (targets.length === 0) {
    throw new UsageError(
      `${stage}: no such stage. Registered: ${stages.map((def) => def.name).join(', ')}`,
    );
  }
  const issues: Issue[] = [];
  for (const def of targets) {
    if (!def.validate) {
      out(`${def.name}: no validators registered`);
    } else if (!def.produces.every((artifact) => hasArtifact(run, artifact))) {
      out(`${def.name}: no artifact to validate`);
    } else {
      const found = def.validate(run);
      out(`${def.name}: ${formatForTerminal(found)}`);
      issues.push(...found);
    }
  }
  return issues;
}

export function showCommand(runId: string, deps: CliDeps = {}): string {
  const run = openRun(runId, deps.runsDir ?? DEFAULT_RUNS_DIR);
  const state = readState(run);
  const header = ['stage', 'status', 'version', 'rounds', 'known', 'updated'];
  const rows = PIPELINE.flatMap((name) => {
    const stage = state.stages[name];
    if (!stage) return [];
    return [
      [
        name,
        stage.status,
        String(stage.version ?? ''),
        String(stage.rounds ?? ''),
        String(stage.known ?? ''),
        stage.updatedAt,
      ],
    ];
  });
  const widths = header.map((cell, i) =>
    Math.max(cell.length, ...rows.map((row) => row[i]?.length ?? 0)),
  );
  const line = (cells: string[]) =>
    cells
      .map((cell, i) => cell.padEnd(widths[i] ?? 0))
      .join('  ')
      .trimEnd();
  const sums = totals(run);
  return [
    `run ${state.id}`,
    `idea ${state.idea}`,
    '',
    line(header),
    ...rows.map(line),
    '',
    `${sums.calls} calls, ${sums.input} tokens in, ${sums.output} out, $${sums.costUsd.toFixed(4)}`,
  ].join('\n');
}

const DEFAULT_GOLDEN_DIR = 'fixtures/golden';

/** Copies a run's accepted artifacts (and their markdown) to fixtures/golden/<idea>/ and prints rounds, tokens and cost per stage. */
export function goldenCommand(
  runId: string,
  ideaName: string,
  stageList: string | undefined,
  deps: CliDeps = {},
): string[] {
  const out = deps.out ?? console.log;
  const run = openRun(runId, deps.runsDir ?? DEFAULT_RUNS_DIR);
  const names = (stageList ?? 'scope,flows')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
  const dest = path.join(DEFAULT_GOLDEN_DIR, ideaName);
  mkdirSync(dest, { recursive: true });
  const copied: string[] = [];
  const lines: string[] = [];
  const state = readState(run);
  const calls = readEvents(run).filter((event) => event.type === 'llm:call');
  for (const name of names) {
    if (!(name in FILE_OF)) {
      throw new UsageError(
        `${name}: no such artifact. Known: ${Object.keys(FILE_OF).join(', ')}`,
      );
    }
    const artifact = name as ArtifactName;
    if (!hasArtifact(run, artifact))
      throw new UsageError(`run ${runId} has no ${name} artifact yet`);
    const json = FILE_OF[artifact];
    const markdown = json.replace(/\.json$/, '.md');
    for (const file of [json, markdown]) {
      if (!existsSync(runPath(run, file))) continue;
      copyFileSync(runPath(run, file), path.join(dest, file));
      copied.push(file);
    }
    // The generator's calls plus its reviewers' (`<stage>-review<n>`).
    const own = calls.filter(
      (event) =>
        event.stage === name ||
        String(event.stage).startsWith(`${name}-review`),
    );
    const sum = (key: string) =>
      own.reduce((total, event) => total + Number(event[key] ?? 0), 0);
    lines.push(
      `${name}: ${state.stages[name]?.rounds ?? '?'} rounds, ${state.stages[name]?.known ?? 0} known issues, ${own.length} calls, ${sum('input')} tokens in, ${sum('output')} out, $${sum('costUsd').toFixed(4)}`,
    );
  }
  out(`golden ${ideaName}: ${copied.join(', ')} -> ${dest}`);
  for (const line of lines) out(line);
  return lines;
}

/** Exit codes: 0 ok, 1 error, 2 usage. */
export async function main(argv: string[]): Promise<number> {
  try {
    const { positionals, values } = parseArgs({
      args: argv,
      allowPositionals: true,
      allowNegative: true,
      options: {
        run: { type: 'string' },
        from: { type: 'string' },
        to: { type: 'string' },
        interactive: { type: 'boolean' },
        replay: { type: 'boolean' },
        backend: { type: 'string' },
        stages: { type: 'string' },
      },
    });
    const [command, first, second] = positionals;
    switch (command) {
      case 'run':
        if (!first) throw new UsageError('run needs an idea file');
        await runCommand({ idea: first, ...values });
        return 0;
      case 'validate':
        if (!first) throw new UsageError('validate needs a run id');
        return splitIssues(validateCommand(first, second)).mandatory.length > 0
          ? 1
          : 0;
      case 'show':
        if (!first) throw new UsageError('show needs a run id');
        console.log(showCommand(first));
        return 0;
      case 'golden':
        if (!first || !second)
          throw new UsageError('golden needs a run id and an idea name');
        goldenCommand(first, second, values.stages);
        return 0;
      case 'ds':
        console.log('ds: added in step DS1');
        return 0;
      case 'bench':
        console.log('bench: added in step B7');
        return 0;
      default:
        throw new UsageError(
          command ? `unknown command: ${command}` : 'no command given',
        );
    }
  } catch (error) {
    const usage =
      error instanceof UsageError ||
      (error as NodeJS.ErrnoException).code?.startsWith('ERR_PARSE_ARGS');
    console.error(error instanceof Error ? error.message : String(error));
    if (usage) {
      console.error(USAGE);
      return 2;
    }
    return 1;
  }
}

const isEntry =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isEntry) process.exitCode = await main(process.argv.slice(2));
