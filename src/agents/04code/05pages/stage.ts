import { readArtifact } from '../../../core/artifacts';
import { writeReport } from '../../../core/issues';
import { appendEvent, runPath } from '../../../core/run';
import { fillPrompt, loadPrompt } from '../../../core/prompt';
import { pathBeside } from '../../../core/utils';
import { screenExpect } from '../../../engine/conformance';
import { appCheck } from '../../../engine/session';
import type { Themed } from '../../02design/01theme/build';
import type { WidgetScreens } from '../../02design/08assemble/assemble';
import type { Contract } from '../../03contract/schema';
import type { StageContext, StageDef } from '../../stages';
import { seedId } from '../02contract/codegen';
import { sharedUnits } from '../01scaffold/weave';
import { renderedOn, routeSample } from '../rendered';
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

/** One unit per page, the navigation's pages first, each writing only its route folder. */
export function pageSpecs(design: WidgetScreens, contract: Contract): Omit<UnitSpec, 'rendered'>[] {
  const order = design.navigation.items.map((item) => item.screen);
  const rank = (id: string) => (order.includes(id) ? order.indexOf(id) : order.length);
  const pages = design.screens.filter((s) => s.type === 'page').sort((a, b) => rank(a.id) - rank(b.id) || a.id.localeCompare(b.id));
  const task = loadPrompt(pathBeside(import.meta.url, './prompts/task.md'));
  // A shared dialog is built in blocks/ and checked there (CD7), not in its parent page's folder.
  const sharedIds = new Set(
    design.sections.filter((s) => sharedUnits(design).dialogs.has(s.screen)).flatMap((s) => design.nodes.filter((n) => n.section === s.id).map((n) => n.id)),
  );
  return pages.map((page) => {
    const folder = pageFolder(design, page);
    const url = concreteRoute(page.route, contract);
    const expect = screenExpect(design, contract, page.id);
    return {
      id: `page-${page.id}`,
      stage: `${STAGE}-${page.id}`,
      task: fillPrompt(task, { screen: page.id, name: page.name, route: page.route, folder, url }),
      folders: ['01-scaffold', '02-contract', '04-frames', '05-pages', `05-pages/${page.id}`],
      // The root page replaces the template's starter page.
      // The route folder's own files, a page's styles included, and its components; a child route's folder is its own page's.
      writes: [`${folder}/`, `${folder}/components/**`, ENTITIES, ...(page.route === '/' ? ['web/app/(routes)/'] : [])],
      route: url,
      expect: { ...expect, folder, testIds: expect.testIds.filter((id) => !sharedIds.has(id)) },
      // No other page shapes this one: other routes and their .weave folders are measured as reads it should not make.
      reads: {
        deny: [...READS_DENIED, 'web/app/(routes)/**', '.weave/05-pages/**'],
        allow: [
          `${folder}/**`,
          'web/app/(routes)/layout.tsx',
          ...design.shells.filter((s) => s.id === page.shell).map((s) => `web/app/(routes)/(${s.name})/layout.tsx`),
          ...(page.route === '/' ? ['web/app/(routes)/page.tsx'] : []),
          '.weave/05-pages/guidelines.md',
          `.weave/05-pages/${page.id}/**`,
        ],
      },
    };
  });
}

async function runPages(ctx: StageContext): Promise<void> {
  const design = readArtifact<WidgetScreens>(ctx.run, 'design-assemble').data;
  const contract = readArtifact<Contract>(ctx.run, 'contract').data;
  const { theme } = readArtifact<Themed>(ctx.run, 'design-theme').data;
  const appDir = runPath(ctx.run, 'app');
  const dialogs = new Set(design.screens.filter((s) => s.type === 'dialog').map((s) => s.id));
  const specs = pageSpecs(design, contract).map((spec) => {
    const page = design.screens.find((s) => `page-${s.id}` === spec.id);
    // The first viewport check looks for the page's primary actions; the keyboard walk opens its dialogs.
    const sections = new Set(design.sections.filter((s) => s.screen === page?.id).map((s) => s.id));
    const nodes = design.nodes.filter((n) => sections.has(n.section));
    const sample = {
      ...routeSample(spec.route ?? '/', page?.id ?? '', page?.entry ?? false, nodes.filter((n) => n.role === 'primary-action').map((n) => n.id)),
      dialogTriggers: nodes.filter((n) => dialogs.has(n.navigatesTo)).map((n) => n.id),
    };
    return { ...spec, rendered: renderedOn(ctx.run, appDir, [sample], theme) };
  });
  await runUnits(ctx, STAGE, specs);
  // CODE-008: one production build once every page is in; what fails is known, the run goes on.
  const build = await appCheck(appDir, 'build', ['pnpm', 'build']);
  appendEvent(ctx.run, { type: 'check:run', stage: STAGE, name: 'build', ok: build.ok });
  writeReport(ctx.run, `${STAGE}-build`, 1, build.ok ? [] : [{ rule: 'CODE-008', severity: 'mandatory', message: `next build failed:\n${build.output.trim()}` }]);
}

export const pagesStage: StageDef = { name: STAGE, produces: [], run: (ctx) => runPages(ctx) };
