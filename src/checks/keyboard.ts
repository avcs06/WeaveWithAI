import type { Page } from 'playwright-core';
import { inPage } from './page';
import { type Finding, finding } from './types';

// DESIGN-R-003: a keyboard walk. Every control is reached by Tab in reading
// order, shows its focus, and does not trap it; buttons act on Enter and
// Space. Requests that could change data are aborted while it walks.

type Focusable = { element: string; app: boolean; button: boolean; skip: boolean };
type Active = { element: string; style: string };

export type KeyboardReport = {
  interactive: number;
  reachable: number;
  focusVisible: number;
  inversions: number;
  trap: boolean;
  activation: { buttons: number; enterOk: number; spaceOk: number };
  skipLink: boolean;
  findings: Finding[];
};

const R = 'DESIGN-R-003';

export async function keyboardWalk(
  page: Page,
  opts: { blockMutations: true },
): Promise<KeyboardReport> {
  if (opts.blockMutations)
    await page.route('**/*', (route) =>
      route.request().method() === 'GET' ? route.continue() : route.abort(),
    );
  const findings: Finding[] = [];
  // Tab passes every control, the design system's too, to reach the app's; only the app's are judged.
  const controls = await inPage<Focusable[]>(page, 'focusables');
  const ours = controls.filter((c) => c.app);
  const order = new Map(ours.map((c, i) => [c.element, i]));

  // Tab from the top until focus leaves the page or the presses run out.
  await inPage(page, 'reset');
  const visits: Active[] = [];
  for (let press = 0; press < controls.length + 5; press += 1) {
    await page.keyboard.press('Tab');
    const active = await inPage<Active>(page, 'active');
    if (!active.element) break;
    visits.push(active);
  }
  const reached = new Set(visits.map((v) => v.element));
  for (const control of ours)
    if (!reached.has(control.element))
      findings.push(
        finding(R, 'mandatory', 'not reachable with Tab', control.element),
      );
  const looped = visits.length > controls.length;
  const trap =
    controls.length > 0 &&
    looped &&
    !visits.slice(1).some((v) => v.element === visits[0]?.element);
  if (trap)
    findings.push(
      finding(
        R,
        'mandatory',
        `focus stays among ${new Set(visits.slice(-3).map((v) => v.element)).size} controls and never leaves`,
      ),
    );
  const ourVisits = visits.filter((v) => order.has(v.element));
  let inversions = 0;
  for (const [i, visit] of ourVisits.entries()) {
    const before = ourVisits[i - 1];
    if (
      before &&
      (order.get(visit.element) ?? 0) < (order.get(before.element) ?? 0) &&
      visit.element !== ourVisits[0]?.element
    ) {
      inversions += 1;
      findings.push(
        finding(
          R,
          'mandatory',
          `Tab goes back from ${before.element}; tab order follows reading order`,
          visit.element,
        ),
      );
    }
  }

  let focusVisible = 0;
  for (const visit of new Map(ourVisits.map((v) => [v.element, v])).values()) {
    const blurred = await inPage<string>(page, 'blurredStyle', visit.element);
    if (blurred !== visit.style) focusVisible += 1;
    else
      findings.push(
        finding(
          R,
          'mandatory',
          'focus does not show: outline and shadow are the same with and without it',
          visit.element,
        ),
      );
  }

  const skipLink =
    controls[0]?.skip === true && visits[0]?.element === controls[0].element;
  if (controls.length && !skipLink)
    findings.push(finding(R, 'warning', 'no skip link first in the tab order'));

  // Enter and Space on every button; Escape closes whatever a button opened.
  await inPage(page, 'watchClicks');
  const buttons = ours.filter((c) => c.button);
  const activation = { buttons: buttons.length, enterOk: 0, spaceOk: 0 };
  for (const button of buttons)
    for (const key of ['Enter', 'Space'] as const) {
      const before = await inPage<number>(page, 'clicks', button.element);
      await inPage(page, 'focus', button.element);
      await page.keyboard.press(key);
      const acted =
        (await inPage<number>(page, 'clicks', button.element)) > before;
      if (acted) activation[key === 'Enter' ? 'enterOk' : 'spaceOk'] += 1;
      else
        findings.push(
          finding(
            R,
            'mandatory',
            `${key} does not activate it`,
            button.element,
          ),
        );
      if (await inPage<boolean>(page, 'dialogOpen'))
        await page.keyboard.press('Escape');
    }
  if (opts.blockMutations) await page.unroute('**/*');

  return {
    interactive: ours.length,
    reachable: ours.filter((c) => reached.has(c.element)).length,
    focusVisible,
    inversions,
    trap,
    activation,
    skipLink,
    findings,
  };
}
