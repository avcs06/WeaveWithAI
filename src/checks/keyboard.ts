import type { Page } from 'playwright-core';
import { inPage } from './page';
import { type Finding, finding } from './types';

// DESIGN-R-003: a keyboard walk. Every control is reached by Tab in reading
// order, shows its focus, and does not trap it; buttons act on Enter and
// Space. Requests that could change data are aborted while it walks.

/** `group` names the composite widget a control sits in, such as a radio group: the group is one Tab stop. */
type Focusable = { element: string; app: boolean; button: boolean; skip: boolean; group: string; radio: boolean; addOn: boolean };
type Active = { element: string; style: string };
type Press = { clicks: number; expanded: string; popups: number };

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
  opts: { blockMutations: true; whole?: boolean },
): Promise<KeyboardReport> {
  if (opts.blockMutations)
    await page.route('**/*', (route) =>
      route.request().method() === 'GET' ? route.continue() : route.abort(),
    );
  const findings: Finding[] = [];
  // Tab passes every control, the design system's too, to reach the app's; only the app's are judged, unless
  // `whole` asks for the page as a user meets it, as the benchmark does.
  const controls = await inPage<Focusable[]>(page, 'focusables');
  const ours = (opts.whole ? controls : controls.filter((c) => c.app)).filter((c) => !c.addOn);
  const order = new Map(ours.map((c, i) => [c.element, i]));

  // Tab from the top until focus leaves the page or the presses run out. A native date input holds focus
  // over its month, day, year and picker, so a press that stays on the element just visited is no new stop.
  await inPage(page, 'reset');
  const visits: Active[] = [];
  let left = false;
  for (let press = 0; press < 3 * controls.length + 5; press += 1) {
    await page.keyboard.press('Tab');
    const active = await inPage<Active>(page, 'active');
    if (!active.element) {
      left = true;
      break;
    }
    if (active.element !== visits.at(-1)?.element) visits.push(active);
  }
  const reached = new Set(visits.map((v) => v.element));
  // A composite widget is one stop, reached when Tab lands on any control in it; arrow keys reach the rest.
  const groupOf = new Map(controls.map((c) => [c.element, c.group]));
  const reachedGroups = new Set(visits.map((v) => groupOf.get(v.element)).filter(Boolean));
  const stops = [...new Map(ours.map((c) => [c.group || c.element, c])).values()];
  const isReached = (c: Focusable) => (c.group ? reachedGroups.has(c.group) : reached.has(c.element));
  for (const control of stops)
    if (!isReached(control))
      findings.push(
        finding(R, 'mandatory', 'not reachable with Tab', control.group || control.element),
      );
  // A trap holds focus on the page through every press and never comes back to where Tab started.
  const trap =
    controls.length > 0 &&
    !left &&
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

  // Enter and Space on every button; Escape closes the dialog, menu or listbox a button opened, before the next key.
  await inPage(page, 'watchClicks');
  // A radio follows the radio pattern, arrow keys and Space, not a button's Enter.
  const buttons = ours.filter((c) => c.button && !c.radio);
  const activation = { buttons: buttons.length, enterOk: 0, spaceOk: 0 };
  for (const button of buttons)
    for (const key of ['Enter', 'Space'] as const) {
      const before = await inPage<Press>(page, 'pressState', button.element);
      await inPage(page, 'focus', button.element);
      await page.keyboard.press(key);
      const after = await inPage<Press>(page, 'pressState', button.element);
      // A menu button opens on keydown and cancels the click; what it opened, or its aria-expanded, shows it acted.
      const acted =
        after.clicks > before.clicks ||
        after.expanded !== before.expanded ||
        after.popups > before.popups;
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
      if (await inPage<boolean>(page, 'popupOpen'))
        await page.keyboard.press('Escape');
    }
  if (opts.blockMutations) await page.unroute('**/*');

  return {
    interactive: stops.length,
    reachable: stops.filter(isReached).length,
    focusVisible,
    inversions,
    trap,
    activation,
    skipLink,
    findings,
  };
}
