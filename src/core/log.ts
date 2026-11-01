import type { Event } from './run';

// The live log of a run (user, 2026-10-31): each group of stages, each stage
// under its group, and each part's rounds under its stage, every line named
// by its part. Stages and parts run side by side, so the headers repeat when a
// line belongs to another stage than the line before it.

export type RunLog = {
  /** A line the pipeline writes about one of its stages, such as `running`. */
  line(stage: string, text: string): void;
  /** An event the run appended, as a line under its stage. */
  event(event: Event): void;
};

export function runLog(
  pipeline: readonly string[],
  out: (line: string) => void,
): RunLog {
  const longestFirst = [...pipeline].sort((a, b) => b.length - a.length);
  let group = '';
  let stage = '';
  const line = (name: string, text: string) => {
    const owner =
      longestFirst.find((p) => name === p || name.startsWith(`${p}-`)) ?? name;
    const [head = owner, ...rest] = owner.split('-');
    const short = rest.join('-') || head;
    if (head !== group) out(head);
    if (head !== group || short !== stage) out(`  ${short}`);
    group = head;
    stage = short;
    out(`    ${short}${name.slice(owner.length)} ${text}`);
  };
  return {
    line,
    event(event) {
      if (!event.stage) return;
      const own = pipeline.includes(event.stage);
      const round = `round ${String(event.round)}`;
      const n = (key: string) => Number(event[key] ?? 0);
      switch (event.type) {
        // The pipeline writes its own stages' start and end, with their versions.
        case 'stage:start':
          return own ? undefined : line(event.stage, 'running');
        case 'stage:done':
          return own
            ? undefined
            : line(event.stage, `done: ${count(n('rounds'), 'round')}, ${count(n('known'), 'known issue')}`);
        case 'round:start':
          return line(
            event.stage,
            `${round} started${n('fixing') ? `, fixing ${count(n('fixing'), 'issue')}` : ''}`,
          );
        case 'llm:call': {
          if (typeof event.reviewer === 'string')
            return line(
              event.stage.slice(0, -`-review-${event.reviewer}`.length),
              `${round} review ${event.reviewer} found ${count(n('blockers'), 'blocker')} (${stats(event)})`,
            );
          const what = event.invalid
            ? 'answer did not match the schema'
            : event.truncated
              ? 'answer was cut at the output limit'
              : 'written';
          // A coding session's call has no round of its own: it reports once, when the session ends.
          return line(event.stage, `${event.round === undefined ? '' : `${round} `}${what} (${stats(event)})`);
        }
        case 'round:validated': {
          if (!n('mandatory') && !n('warnings'))
            return line(event.stage, `${round} validate passed`);
          const rules = tally((event.rules as string[] | undefined) ?? []);
          return line(
            event.stage,
            `${round} validate found ${n('mandatory')} mandatory${rules ? ` (${rules})` : ''}, ${count(n('warnings'), 'warning')}`,
          );
        }
        case 'review:start':
          return line(event.stage, `${round} review ${String(event.reviewer)} started`);
        case 'stage:round': {
          const pending = n('mandatory') + n('blockers');
          return line(
            event.stage,
            `${round} finished: ${pending ? `${pending} pending (${n('mandatory')} mandatory, ${count(n('blockers'), 'blocker')})` : 'nothing pending'}`,
          );
        }
        case 'stage:failed':
          return line(event.stage, `failed in ${round}: ${String(event.error)}`);
        case 'stage:answers':
          return line(event.stage, `${count(n('count'), 'answer')} given`);
        case 'warning':
          return line(event.stage, `warning: ${String(event.message)}`);
        case 'stage:patch':
          return line(event.stage, `patch ${String(event.file)}`);
        case 'stage:reset':
          return line(
            event.stage,
            `reset to ${String(event.to)}: ${count(n('dropped'), 'commit')} thrown away${event.dirty ? ', and uncommitted changes' : ''}`,
          );
      }
    },
  };
}

const count = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

const tokens = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

/** A call's model, tokens, cost and time. */
function stats(event: Event): string {
  const n = (key: string) => Number(event[key] ?? 0);
  return [
    String(event.model),
    `${tokens(n('input'))} in${n('cachedInput') ? ` (${tokens(n('cachedInput'))} cached)` : ''}`,
    `${tokens(n('output'))} out`,
    event.billing === 'subscription' ? 'subscription' : `$${n('costUsd').toFixed(4)}`,
    ...(event.durationMs === undefined ? [] : [`${(n('durationMs') / 1000).toFixed(1)}s`]),
    ...(event.replayed ? ['replayed'] : []),
  ].join(', ');
}

/** Each rule once, with how often it failed: `DESIGN-028 ×2, LAYOUT-011`. */
function tally(rules: string[]): string {
  const counts = new Map<string, number>();
  for (const rule of rules) counts.set(rule, (counts.get(rule) ?? 0) + 1);
  return [...counts].map(([rule, times]) => (times > 1 ? `${rule} ×${times}` : rule)).join(', ');
}
