import { readArtifact } from '../../../core/artifacts';
import { writeReport } from '../../../core/issues';
import { appendEvent, runPath } from '../../../core/run';
import { fillPrompt, loadPrompt } from '../../../core/prompt';
import { pathBeside, writeJsonAtomic } from '../../../core/utils';
import { screenExpect } from '../../../engine/conformance';
import { appCheck, type CheckedRoute, verifyCommand } from '../../../engine/session';
import type { Themed } from '../../02design/01theme/build';
import type { WidgetScreens } from '../../02design/08assemble/assemble';
import type { Contract } from '../../03contract/schema';
import type { StageContext, StageDef } from '../../stages';
import { SIGNED_IN, seedId } from '../02contract/codegen';
import { sharedUnits } from '../01scaffold/weave';
import type { RouteSample } from '../../../checks';
import { renderedOn, routeSample } from '../rendered';
import { pageGroups, pageLinks } from './plan';
import { ENTITIES, READS_DENIED, runUnits, type UnitSpec } from '../unit';

const STAGE = 'code-pages';

/** A route the browser can open: each `[xId]` the first seed row of entity X, any other param `demo`. */
export function concreteRoute(route: string, contract: Contract): string {
  return route.replace(/\[(\w+?)\]/g, (_, param: string) => {
    const name = param.replace(/Id$/, '');
    const entity = contract.entities.find((e) => e.name.toLowerCase() === name.toLowerCase());
    return entity ? seedId(entity.name, 1) : 'demo';
  });
}

/** A page's route folder: inside its shell's route group, when it has one. */
export function pageFolder(design: WidgetScreens, screen: WidgetScreens['screens'][number]): string {
  const shell = design.shells.find((s) => s.id === screen.shell);
  const route = screen.route === '/' ? '' : screen.route;
  return `web/app/(routes)${shell ? `/(${shell.name})` : ''}${route}`;
}

/** A unit of pages: one page, or pages that open each other, with the wave it is built in. */
export type PageSpec = Omit<UnitSpec, 'rendered'> & { screens: string[]; wave: number };

/** One unit per group of pages that open each other, wave by wave (plan.ts), each writing only its pages' route folders. */
export function pageSpecs(design: WidgetScreens, contract: Contract): PageSpec[] {
  const task = loadPrompt(pathBeside(import.meta.url, './prompts/task.md'));
  const screenById = new Map(design.screens.map((s) => [s.id, s]));
  // A shared dialog is built in blocks/ and checked there (CD7), not in its parent page's folder.
  const sharedIds = new Set(
    design.sections.filter((s) => sharedUnits(design).dialogs.has(s.screen)).flatMap((s) => design.nodes.filter((n) => n.section === s.id).map((n) => n.id)),
  );
  return pageGroups(design).map((group) => {
    const parts = group.pages.map((id) => {
      const page = screenById.get(id)!;
      const folder = pageFolder(design, page);
      const expect = screenExpect(design, contract, page.id);
      return {
        page,
        folder,
        route: { url: concreteRoute(page.route, contract), signedIn: page.access === 'signedIn' },
        expect: { ...expect, folder, testIds: expect.testIds.filter((testId) => !sharedIds.has(testId)) },
      };
    });
    const root = parts.some(({ page }) => page.route === '/');
    const lines = parts.map(
      ({ page, folder, route }) =>
        `- ${page.id} (${page.name}) at \`${page.route}\`, from \`.weave/05-pages/${page.id}/\`, in \`${folder}\`. Check it with \`${verifyCommand([route.url], route.signedIn).join(' ')}\`.`,
    );
    const folders = ['01-scaffold', '02-contract', '04-frames', '05-pages', ...group.pages.map((id) => `05-pages/${id}`)];
    return {
      id: `pages-${group.pages.join('-')}`,
      stage: `${STAGE}-${group.pages.join('-')}`,
      screens: group.pages,
      wave: group.wave,
      task: fillPrompt(task, {
        folders: ['01-scaffold/', '02-contract/', '04-frames/', '05-pages/guidelines.md', ...group.pages.map((id) => `05-pages/${id}/`)].map((f) => `\`.weave/${f}\``).join(', '),
        pages: lines.join('\n'),
      }),
      folders,
      // Each route folder's own files, a page's styles included, and its components; a child route's folder is its own page's.
      // The root page replaces the template's starter page.
      writes: [...parts.flatMap(({ folder }) => [`${folder}/`, `${folder}/components/**`]), ENTITIES, ...(root ? ['web/app/(routes)/'] : [])],
      routes: parts.map(({ route }) => route),
      expects: parts.map(({ expect }) => expect),
      // No other group shapes this one: other routes and their .weave folders are measured as reads it should not make.
      reads: {
        deny: [...READS_DENIED, 'web/app/(routes)/**', '.weave/05-pages/**'],
        allow: [
          ...new Set([
            ...parts.map(({ folder }) => `${folder}/**`),
            'web/app/(routes)/layout.tsx',
            ...parts.flatMap(({ page }) => design.shells.filter((s) => s.id === page.shell).map((s) => `web/app/(routes)/(${s.name})/`)),
            ...(root ? ['web/app/(routes)/page.tsx'] : []),
            '.weave/05-pages/guidelines.md',
            ...group.pages.map((id) => `.weave/05-pages/${id}/**`),
          ]),
        ],
      },
    };
  });
}

/** How the browser checks open a page: its primary actions for the first viewport, its dialogs for the keyboard walk, a member's session behind sign-in. */
function pageSample(design: WidgetScreens, screen: string, route: CheckedRoute): RouteSample {
  const page = design.screens.find((s) => s.id === screen);
  const dialogs = new Set(design.screens.filter((s) => s.type === 'dialog').map((s) => s.id));
  const sections = new Set(design.sections.filter((s) => s.screen === screen).map((s) => s.id));
  const nodes = design.nodes.filter((n) => sections.has(n.section));
  return {
    ...routeSample(
      route.url,
      screen,
      page?.entry ?? false,
      nodes.filter((n) => n.role === 'primary-action').map((n) => n.id),
      route.signedIn ? SIGNED_IN : undefined,
    ),
    dialogTriggers: nodes.filter((n) => dialogs.has(n.navigatesTo)).map((n) => n.id),
  };
}

async function runPages(ctx: StageContext): Promise<void> {
  const design = readArtifact<WidgetScreens>(ctx.run, 'design-assemble').data;
  const contract = readArtifact<Contract>(ctx.run, 'contract').data;
  const { theme } = readArtifact<Themed>(ctx.run, 'design-theme').data;
  const appDir = runPath(ctx.run, 'app');
  const groups = pageGroups(design);
  writeJsonAtomic(runPath(ctx.run, '04-code', '05-pages-plan.json'), { groups, links: Object.fromEntries([...pageLinks(design)].map(([page, to]) => [page, [...to]])) });
  const waves = [...new Set(groups.map((g) => g.wave))].map(
    (wave) => `wave ${wave}: ${groups.filter((g) => g.wave === wave).map((g) => g.pages.join('+')).join(', ')}`,
  );
  appendEvent(ctx.run, { type: 'stage:plan', stage: STAGE, waves });
  const specs = pageSpecs(design, contract).map(({ screens, wave: _wave, ...spec }) => ({
    ...spec,
    rendered: renderedOn(ctx.run, appDir, screens.map((screen, i) => pageSample(design, screen, spec.routes![i]!)), theme),
  }));
  await runUnits(ctx, STAGE, specs);
  // CODE-008: one production build once every page is in; what fails is known, the run goes on.
  const build = await appCheck(appDir, 'build', ['pnpm', 'build']);
  appendEvent(ctx.run, { type: 'check:run', stage: STAGE, name: 'build', ok: build.ok });
  writeReport(ctx.run, `${STAGE}-build`, 1, build.ok ? [] : [{ rule: 'CODE-008', severity: 'mandatory', message: `next build failed:\n${build.output.trim()}` }]);
}

export const pagesStage: StageDef = { name: STAGE, produces: [], run: (ctx) => runPages(ctx) };
