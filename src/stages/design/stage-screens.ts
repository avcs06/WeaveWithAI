import pLimit from 'p-limit';
import { readArtifact, writeArtifact } from '../../core/artifacts';
import { type Issue, writeReport } from '../../core/issues';
import { appendEvent, updateStage } from '../../core/run';
import { runSpecStage, type SpecStageOptions } from '../../core/runSpecStage';
import { type Inventory, inventory } from '../../ds/inventory';
import type { Flows, Scope } from '../flows/schema';
import type { StageContext, StageDef } from '../index';
import { assembleScreens } from './assemble';
import { skeleton } from './layout';
import { iaReviewGuides } from './prompt';
import {
  componentReviewGuides,
  componentSystemPrompt,
  componentUserMessage,
  frameSystemPrompt,
  frameUserMessage,
  iaSystemPrompt,
  iaUserMessage,
  widgetReviewGuides,
  widgetsSystemPrompt,
  widgetsUserMessage,
} from './prompt-screens';
import { layoutShells } from './resolve';
import { routeIssues } from './route';
import type { Brief, NewComponent } from './schema';
import {
  type ComponentDesign,
  type FrameBuild,
  makeWidgetSchemas,
  type WidgetBatch,
  type WidgetIa,
} from './schema-widgets';
import { draftOf } from './stage';
import type { Theme } from './theme';
import type { DesignContext } from './validate';
import {
  validateBatch,
  validateComponent,
  validateDesign,
  validateFrame,
  validateWidgetIa,
} from './validate-widgets';
import { writeDesignFiles } from './write';

// The design stage after the brief and the theme (DS23): the IA plans every
// screen once; a call per new component designs it; widget calls build two
// widgets each and frame calls fill the shells; code assembles the screens.

// The IA writes the screens, the copy deck, the widgets and their placements, and reasons at high; it starts
// at the client's 64k cap, so no cut is billed before a doubling (user, 2026-10-30). A component is designed
// once, in full, at high; a widget call builds two widgets and a frame call one shell, at medium (DS23).
const IA_MAX_TOKENS = 65_536;
const IA_EFFORT = 'high';
const COMPONENT_MAX_TOKENS = 16_384;
const COMPONENT_EFFORT = 'high';
const BUILD_MAX_TOKENS = 16_384;
const BUILD_EFFORT = 'medium';
const PER_CALL = 2;
const PARALLEL = 3;

type Built<T> = { output: T; model: string };

/**
 * The IA call, a call per new component, a call per two widgets and per
 * shell a framed page uses, and the assembled design: `02-screens.json`, the
 * skeleton, the wireframes, `02-design.md` and the gap report. An issue on
 * the assembled design goes back once to the widget or frame call that owns
 * it, as a separately named fix; the rest are recorded as known.
 */
export async function runDesign(
  ctx: StageContext,
  inv: Inventory,
  gapsLog = '.weave-cache/ds-gaps.jsonl',
): Promise<void> {
  const { run, llm } = ctx;
  appendEvent(run, { type: 'stage:start', stage: 'design' });
  updateStage(run, 'design', { status: 'running' });
  const brief = readArtifact<Brief>(run, 'brief').data;
  const scope = readArtifact<Scope>(run, 'scope').data;
  const flows = readArtifact<Flows>(run, 'flows').data;
  const theme = readArtifact<Theme>(run, 'theme').data;
  const schemas = makeWidgetSchemas(inv);
  const shells = layoutShells(theme.layouts);
  const context: DesignContext = {
    scope,
    flows,
    inventory: inv,
    shells,
    defaults: theme.defaults,
  };
  const limit = pLimit(PARALLEL);
  let rounds = 0;
  /** One call through the runner, done in the state under its own stage name. */
  const call = async <T>(
    options: Omit<SpecStageOptions<T>, 'run' | 'llm'>,
  ): Promise<Built<T>> => {
    const result = await runSpecStage({ run, llm, ...options });
    updateStage(run, options.stage, { status: 'done' });
    rounds += result.rounds;
    return { output: result.output, model: result.model };
  };

  const iaResult = await call({
    stage: 'design-ia',
    schema: schemas.Ia,
    schemaName: 'Ia',
    system: iaSystemPrompt(brief, inv),
    user: iaUserMessage(scope, flows, brief, theme.layouts),
    validate: (draft) => validateWidgetIa(draft, context),
    review: iaReviewGuides(),
    maxTokens: IA_MAX_TOKENS,
    reasoningEffort: IA_EFFORT,
  });
  const ia: WidgetIa = iaResult.output;

  const designs = new Map<string, ComponentDesign>();
  await Promise.all(
    ia.newComponents.map((declared) =>
      limit(async () => {
        const { output } = await call({
          stage: `design-component-${declared.name}`,
          schema: schemas.ComponentDesign,
          schemaName: 'ComponentDesign',
          system: componentSystemPrompt(declared.name, inv),
          user: componentUserMessage(declared.name, ia, scope, brief, theme),
          validate: (design) =>
            validateComponent(
              { ...declared, ...design, usedOn: [] },
              ia,
              context,
            ),
          review: componentReviewGuides(),
          maxTokens: COMPONENT_MAX_TOKENS,
          reasoningEffort: COMPONENT_EFFORT,
        });
        designs.set(declared.name, output);
      }),
    ),
  );
  const components: NewComponent[] = ia.newComponents.map((c) => ({
    ...c,
    ...designs.get(c.name)!,
    usedOn: [],
  }));

  // Widgets in the order their screens place them, two to a call; a call's key names its widgets.
  const order = (id: string) => {
    const first = ia.placements
      .filter((p) => p.widget === id)
      .sort((a, b) => a.screen.localeCompare(b.screen) || a.order - b.order)[0];
    return first
      ? `${first.screen} ${String(first.order).padStart(3, '0')}`
      : '';
  };
  const placed = ia.widgets
    .map((w) => w.id)
    .filter(order)
    .sort((a, b) => order(a).localeCompare(order(b)));
  const batches = new Map<string, string[]>();
  for (let i = 0; i < placed.length; i += PER_CALL) {
    const ids = placed.slice(i, i + PER_CALL);
    batches.set(ids.join('-'), ids);
  }
  const kinds = new Set(
    ia.screens.filter((s) => s.type === 'page' && s.framed).map((s) => s.kind),
  );
  const used = shells
    .filter((shell) =>
      kinds.has(shell.name as WidgetIa['screens'][number]['kind']),
    )
    .map((s) => s.id);

  const built = new Map<string, Built<WidgetBatch>>();
  const framed = new Map<string, Built<FrameBuild>>();
  /** A call kept in `done` under `key`; given issues, it reruns from its last output as `<stage>-fix`, without reviewers. */
  const fixable = async <T>(
    done: Map<string, Built<T>>,
    key: string,
    seed: Issue[] | undefined,
    options: Omit<SpecStageOptions<T>, 'run' | 'llm' | 'start' | 'seed'>,
  ) => {
    const previous = done.get(key);
    const start =
      seed && previous ? draftOf(previous.output, previous.model) : undefined;
    const stage = start ? `${options.stage}-fix` : options.stage;
    const review = start ? undefined : options.review;
    done.set(
      key,
      await call({ ...options, stage, review, start, seed: start && seed }),
    );
  };
  /** The widget calls named by `widgetKeys` and the frame calls of `shellIds`, each fixing its `seeds` when given. */
  const build = (
    widgetKeys: string[],
    shellIds: string[],
    seeds = new Map<string, Issue[]>(),
  ) =>
    Promise.all([
      ...widgetKeys.map((key) => {
        const ids = batches.get(key) ?? [];
        return limit(() =>
          fixable(built, key, seeds.get(key), {
            stage: `design-widgets-${key}`,
            schema: schemas.WidgetBatch,
            schemaName: 'WidgetBatch',
            system: widgetsSystemPrompt(ids, brief, inv),
            user: widgetsUserMessage(
              ids,
              ia,
              components,
              flows,
              scope,
              brief,
              theme,
            ),
            validate: (batch) => validateBatch(batch, ids, ia, context, theme),
            review: widgetReviewGuides(),
            maxTokens: BUILD_MAX_TOKENS,
            reasoningEffort: BUILD_EFFORT,
          }),
        );
      }),
      ...shellIds.map((id) =>
        limit(() =>
          fixable(framed, id, seeds.get(id), {
            stage: `design-frame-${id}`,
            schema: schemas.FrameBuild,
            schemaName: 'FrameBuild',
            system: frameSystemPrompt(id, brief, inv),
            user: frameUserMessage(id, ia, shells, scope, brief, theme),
            validate: (frame) => validateFrame(frame, ia, context, theme),
            review: widgetReviewGuides(),
            maxTokens: BUILD_MAX_TOKENS,
            reasoningEffort: BUILD_EFFORT,
          }),
        ),
      ),
    ]);
  await build([...batches.keys()], used);

  const assemble = () => {
    const { screens, origin } = assembleScreens(
      ia,
      designs,
      [...built.values()].flatMap(({ output }) => output.widgets),
      [...framed.values()].map(({ output }) => output),
      theme,
    );
    const solved = skeleton(screens, inv);
    return {
      screens,
      origin,
      solved,
      issues: validateDesign(screens, solved, context),
    };
  };
  let design = assemble();
  writeReport(run, 'design', 1, design.issues);

  const { calls } = routeIssues(design.issues, design.screens, design.origin);
  if (calls.size) {
    // A widget's issues go to the call that built it, with its pair.
    const seeds = new Map<string, Issue[]>();
    for (const [owner, issues] of calls) {
      const key =
        [...batches].find(([, ids]) => ids.includes(owner))?.[0] ?? owner;
      seeds.set(key, [...(seeds.get(key) ?? []), ...issues]);
    }
    await build(
      [...seeds.keys()].filter((key) => batches.has(key)),
      [...seeds.keys()].filter((key) => framed.has(key)),
      seeds,
    );
    design = assemble();
    writeReport(run, 'design', 2, design.issues);
  }

  const { screens, solved, issues } = design;
  const known = issues.filter((issue) => issue.severity === 'mandatory').length;
  writeArtifact(run, 'screens', screens, {
    stage: 'design',
    model: iaResult.model,
    rounds,
    inputs: ['scope', 'flows', 'brief', 'theme'],
  });
  writeDesignFiles(
    run,
    screens,
    solved,
    { brief, theme, flows, scope },
    gapsLog,
  );
  updateStage(run, 'design', { rounds, known });
  appendEvent(run, { type: 'stage:done', stage: 'design', rounds, known });
}

export const designStage: StageDef = {
  name: 'design',
  produces: ['screens'],
  run: async (ctx) => runDesign(ctx, await inventory()),
};
