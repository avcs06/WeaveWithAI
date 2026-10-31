import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { readState, type Run, runPath } from '../../core/run';
import { writeJsonAtomic } from '../../core/utils';
import type { Flows, Scope } from '../flows/schema';
import type { WidgetScreens } from './assemble';
import type { Skeleton } from './layout';
import { renderDesign } from './render';
import type { Brief } from './schema';
import type { Theme } from './theme';
import { renderWireframes } from './wireframes';

// What the design stage writes beside 02-screens.json: the solved skeleton,
// the wireframes and the markdown to review, and the new components as the
// design system's backlog.

/** The skeleton, the wireframes, `02-design.md` and the gap report of an assembled design. */
export function writeDesignFiles(
  run: Run,
  screens: WidgetScreens,
  solved: Skeleton,
  from: { brief: Brief; theme: Theme; flows: Flows; scope: Scope },
  gapsLog: string,
): void {
  const { brief, theme, flows, scope } = from;
  writeJsonAtomic(runPath(run, '02-skeleton.json'), solved);
  writeFileSync(
    runPath(run, '02-wireframes.html'),
    renderWireframes(solved, screens, scope.app.name),
  );
  writeFileSync(
    runPath(run, '02-design.md'),
    renderDesign(brief, theme, screens, flows, scope),
  );
  writeGaps(run, screens, gapsLog);
}

/** The new components as the design system's backlog: in the run, and appended to the log across runs. */
function writeGaps(run: Run, screens: WidgetScreens, log: string): void {
  const idea = path.basename(readState(run).idea, '.md');
  const gaps = screens.newComponents.map(
    ({ name, purpose, closestExisting, whyNotExisting, usedOn }) => ({
      name,
      purpose,
      closestExisting,
      whyNotExisting,
      usedOn,
      idea,
      run: run.id,
    }),
  );
  writeJsonAtomic(runPath(run, '02-ds-gaps.json'), gaps);
  mkdirSync(path.dirname(log), { recursive: true });
  for (const gap of gaps) appendFileSync(log, `${JSON.stringify(gap)}\n`);
}
