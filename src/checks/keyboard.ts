import type { Page } from 'playwright-core';
import { inPage } from './page';
import { type Finding, finding } from './types';

// DESIGN-R-003: a keyboard walk. Every control is reached by Tab in reading
// order, shows its focus, and does not trap it; buttons act on Enter and
// Space; a dialog closes on Escape and gives focus back. Requests that could
// change data are aborted while it walks.

type Focusable = { element: string; button: boolean; skip: boolean };
type Active = { element: string; style: string };

export type KeyboardReport = {
  interactive: number;
  reachable: number;
  focusVisible: number;
  inversions: number;
  trap: boolean;
  dialogs: { opened: number; escaped: number; focusReturned: number };
  activation: { buttons: number; enterOk: number; spaceOk: number };
  skipLink: boolean;
  findings: Finding[];
};

const R = 'DESIGN-R-003';

export async function keyboardWalk(
  page: Page,
  opts: { blockMutations: true; dialogTriggers?: string[] },
): Promise<KeyboardReport> {
  if (opts.blockMutations)
    await page.route('**/*', (route) =>
      route.request().method() === 'GET' ? route.continue() : route.abort(),
    );
  const findings: Finding[] = [];
  const controls = await inPage<Focusable[]>(page, 'focusables');
  const order = new Map(controls.map((c, i) => [c.element, i]));

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
  for (const control of controls)
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
  let inversions = 0;
  for (const [i, visit] of visits.entries()) {
    const before = visits[i - 1];
    if (
      before &&
      (order.get(visit.element) ?? 0) < (order.get(before.element) ?? 0) &&
      visit.element !== visits[0]?.element
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
  for (const visit of new Map(visits.map((v) => [v.element, v])).values()) {
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
  const buttons = controls.filter((c) => c.button);
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
      if ((await inPage<string | null>(page, 'openDialog')) !== null)
        await page.keyboard.press('Escape');
    }

  const dialogs = { opened: 0, escaped: 0, focusReturned: 0 };
  for (const trigger of opts.dialogTriggers ?? []) {
    const selector = `[data-testid="${trigger}"]`;
    await inPage(page, 'focus', selector);
    await page.keyboard.press('Enter');
    const label = await inPage<string | null>(page, 'openDialog');
    if (label === null) {
      findings.push(
        finding(R, 'mandatory', 'Enter does not open its dialog', selector),
      );
      continue;
    }
    dialogs.opened += 1;
    if (!label)
      findings.push(
        finding(
          R,
          'mandatory',
          'the dialog it opens has no accessible name',
          selector,
        ),
      );
    await page.keyboard.press('Escape');
    if ((await inPage<string | null>(page, 'openDialog')) !== null) {
      findings.push(
        finding(R, 'mandatory', 'Escape does not close its dialog', selector),
      );
      continue;
    }
    dialogs.escaped += 1;
    if ((await inPage<Active>(page, 'active')).element === selector)
      dialogs.focusReturned += 1;
    else
      findings.push(
        finding(
          R,
          'mandatory',
          'focus does not return to it when its dialog closes',
          selector,
        ),
      );
  }
  if (opts.blockMutations) await page.unroute('**/*');

  return {
    interactive: controls.length,
    reachable: controls.filter((c) => reached.has(c.element)).length,
    focusVisible,
    inversions,
    trap,
    dialogs,
    activation,
    skipLink,
    findings,
  };
}
