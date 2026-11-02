import type { RouteSample } from '../../../checks';
import { readArtifact } from '../../../core/artifacts';
import { writeReport } from '../../../core/issues';
import { fillPrompt, loadPrompt } from '../../../core/prompt';
import { appendEvent, runPath } from '../../../core/run';
import { pathBeside } from '../../../core/utils';
import { screenExpect } from '../../../engine/conformance';
import { appCheck, type CheckedRoute, verifyCommand } from '../../../engine/session';
import type { Scope } from '../../01flows/01scope/schema';
import type { Flows } from '../../01flows/schema';
import type { Themed } from '../../02design/01theme/build';
import type { Architecture, Screen } from '../../02design/02architect/schema';
import type { Contract } from '../../03contract/schema';
import type { StageContext, StageDef } from '../../stages';
import { screenFolder, screenReads } from '../01scaffold/weave';
import { SIGNED_IN, seedId } from '../02contract/codegen';
import { renderedOn, routeSample } from '../rendered';
import { ENTITIES, READS_DENIED, runUnits, type UnitSpec } from '../unit';

const STAGE = 'code-pages';

// One session builds every screen, so it gets for each screen the budget a session had when it built one page.
const STEPS_PER_SCREEN = 60;
const MINUTES_PER_SCREEN = 30;

/** A route the browser can open: each `[xId]` the first seed row of entity X, any other param `demo`. */
export function concreteRoute(route: string, contract: Contract): string {
  return route.replace(/\[(\w+?)\]/g, (_, param: string) => {
    const name = param.replace(/Id$/, '');
    const entity = contract.entities.find((e) => e.name.toLowerCase() === name.toLowerCase());
    return entity ? seedId(entity.name, 1) : 'demo';
  });
}

/** A screen is behind sign-in unless every flow on it runs signed out, or, with no flows, none of its roles signs in. */
export function behindSignIn(screen: Screen, flows: Flows, scope: Scope): boolean {
  const on = flows.flows.filter((flow) => screen.flows.includes(flow.id));
  if (on.length) return on.some((flow) => !flow.signedOut);
  return scope.roles.some((role) => screen.roles.includes(role.id) && role.signedIn);
}

/** One session for every screen, each in its route folder; what two screens share goes in blocks or components. */
export function pagesSpec(architecture: Architecture, contract: Contract, flows: Flows, scope: Scope): Omit<UnitSpec, 'rendered'> {
  const parts = architecture.screens.map((screen) => {
    const folder = screenFolder(architecture, screen);
    return {
      screen,
      folder,
      route: { url: concreteRoute(screen.route, contract), signedIn: behindSignIn(screen, flows, scope) },
      expect: screenExpect(contract, folder, screenReads(architecture, contract, screen)),
    };
  });
  const lines = parts.map(
    ({ screen, folder, route }) =>
      `- ${screen.id} (${screen.title}) at \`${screen.route}\`, from \`.weave/04-pages/${screen.id}.md\`, in \`${folder}\`. Check it with \`${verifyCommand([route.url], route.signedIn).join(' ')}\`.`,
  );
  return {
    id: 'pages',
    stage: STAGE,
    task: fillPrompt(loadPrompt(pathBeside(import.meta.url, './prompts/task.md')), { pages: lines.join('\n') }),
    folders: ['01-scaffold', '02-contract', '03-frames', '04-pages'],
    // Each route folder's own files and components, what screens share, and the entity layer. The screen at / replaces
    // the template's starter page, so the routes folder's own files are writable too.
    writes: [
      ...parts.flatMap(({ folder }) => [`${folder}/`, `${folder}/components/**`]),
      'web/app/blocks/**',
      'web/app/components/**',
      ENTITIES,
      'web/app/(routes)/',
    ],
    routes: parts.map(({ route }) => route),
    expects: parts.map(({ expect }) => expect),
    reads: { deny: READS_DENIED },
    maxSteps: STEPS_PER_SCREEN * parts.length,
    timeoutMs: MINUTES_PER_SCREEN * 60_000 * parts.length,
  };
}

/** How the browser checks open a screen: the landing page also checks its first viewport, and a page behind sign-in loads with a member's session. */
const pageSample = (screen: Screen, route: CheckedRoute): RouteSample =>
  routeSample(route.url, screen.id, screen.route === '/', [], route.signedIn ? SIGNED_IN : undefined);

async function runPages(ctx: StageContext): Promise<void> {
  const scope = readArtifact<Scope>(ctx.run, 'flows-scope').data;
  const flows = readArtifact<Flows>(ctx.run, 'flows-expand').data;
  const architecture = readArtifact<Architecture>(ctx.run, 'design-architect').data;
  const contract = readArtifact<Contract>(ctx.run, 'contract').data;
  const { theme } = readArtifact<Themed>(ctx.run, 'design-theme').data;
  const appDir = runPath(ctx.run, 'app');
  const spec = pagesSpec(architecture, contract, flows, scope);
  const samples = architecture.screens.map((screen, i) => pageSample(screen, spec.routes![i]!));
  await runUnits(ctx, STAGE, [{ ...spec, rendered: renderedOn(ctx.run, appDir, samples, theme) }]);
  // CODE-008: one production build once every page is in; what fails is known, the run goes on.
  const build = await appCheck(appDir, 'build', ['pnpm', 'build']);
  appendEvent(ctx.run, { type: 'check:run', stage: STAGE, name: 'build', ok: build.ok });
  writeReport(ctx.run, `${STAGE}-build`, 1, build.ok ? [] : [{ rule: 'CODE-008', severity: 'mandatory', message: `next build failed:\n${build.output.trim()}` }]);
}

export const pagesStage: StageDef = { name: STAGE, produces: [], run: (ctx) => runPages(ctx) };
