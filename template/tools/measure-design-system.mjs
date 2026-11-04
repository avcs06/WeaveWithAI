// Measures the fixed box dimensions, padding and gap of every case in the
// Measure story on the running Storybook (:6006) and prints them as JSON: a
// value equal in the short and the long rendering is fixed, anything else is
// left out.
//
//   node tools/measure-design-system.mjs > boxes.json
import { pathToFileURL } from 'node:url';

import { chromium } from 'playwright-core';

const storybookUrl = 'http://localhost:6006';
const storyUrl = (id) =>
  `${storybookUrl}/iframe.html?id=measure--${id}&viewMode=story`;
const stories = ['all', 'dialogs'];

async function isUp(url) {
  try {
    return (await fetch(`${url}/index.json`)).ok;
  } catch {
    return false;
  }
}

// Runs in the page: one reading per `[data-measure]` wrapper, with the root's
// box (or the portal element's, found by its name) and each named part's.
// Wrappers the tool opens first are read one at a time, by `only`.
const readBoxes = (only) => {
  const rect = (element) => {
    const { width, height } = element.getBoundingClientRect();
    return { width, height };
  };
  const accessibleName = (element) =>
    element.getAttribute('aria-label') ||
    document.getElementById(element.getAttribute('aria-labelledby') || '')
      ?.textContent ||
    '';
  const text = (element) => (element.textContent || '').trim();
  // The inset a design sees: padding summed down the wrappers that hold one
  // child (a scroll area), and the gap of the innermost flex or grid.
  const spacing = (element) => {
    const padding = [0, 0, 0, 0];
    let gap = 0;
    for (let at = element; at; ) {
      const style = getComputedStyle(at);
      ['Top', 'Right', 'Bottom', 'Left'].forEach((side, i) => {
        padding[i] += parseFloat(style[`padding${side}`]) || 0;
      });
      if (/flex|grid/.test(style.display))
        gap =
          parseFloat(
            /flex/.test(style.display) && style.flexDirection.startsWith('row')
              ? style.columnGap
              : style.rowGap,
          ) || 0;
      const shown = [...at.children].filter(
        (child) => getComputedStyle(child).display !== 'none',
      );
      at = shown.length === 1 ? shown[0] : null;
    }
    return { padding, gap };
  };
  const portal = (kind, prefix) => {
    if (kind === 'dialog')
      return [...document.querySelectorAll('[role="dialog"]')].find((dialog) =>
        accessibleName(dialog).trim().startsWith(prefix),
      );
    if (kind === 'option')
      return [...document.querySelectorAll('[role="option"]')].find((option) =>
        text(option).startsWith(prefix),
      );
    // innerText: the scroll area inside carries a <style> whose text would come first.
    if (kind === 'popover')
      return [...document.querySelectorAll('[data-slot="popover"]')].find(
        (popover) => popover.innerText.trim().startsWith(prefix),
      );
    return [...document.querySelectorAll('[role="menu"]')].find((menu) =>
      [...menu.querySelectorAll('[data-slot="item"]')].some((item) =>
        text(item).startsWith(prefix),
      ),
    );
  };
  // At height 0 an element shows the minimum height its style declares;
  // without one, padding alone would pose as a minimum.
  const minRect = (element) => {
    if (!/^[1-9]\d*(\.\d+)?px$/.test(getComputedStyle(element).minHeight))
      return null;
    const height = element.style.height;
    element.style.height = '0px';
    const box = rect(element);
    element.style.height = height;
    return box;
  };
  const slots = (names) => names.split(' ').filter(Boolean);
  const wrappers = [...document.querySelectorAll('[data-measure]')].filter(
    (wrapper) =>
      only
        ? `${wrapper.dataset.measure}|${wrapper.dataset.content}` === only
        : wrapper.dataset.open === undefined,
  );
  return wrappers.map((wrapper) => {
    const {
      measure,
      content,
      parts = '',
      min = '',
      root,
      skip,
      portal: kind,
    } = wrapper.dataset;
    const scope = kind
      ? portal(kind, `${measure} ${content}`)
      : wrapper.firstElementChild;
    const part = (slot) => scope?.querySelector(`[data-slot="${slot}"]`);
    const box = (element) => {
      const measured = { ...rect(element), ...spacing(element) };
      if (skip === 'width') measured.width = NaN;
      return measured;
    };
    return {
      name: measure,
      content,
      missing: !scope,
      root: scope && root !== '0' ? box(scope) : null,
      parts: Object.fromEntries(
        slots(parts).map((slot) => [slot, part(slot) ? box(part(slot)) : null]),
      ),
      mins: Object.fromEntries(
        slots(min).map((slot) => {
          const element = slot === 'root' ? scope : part(slot);
          return [slot, element ? minRect(element) : null];
        }),
      ),
    };
  });
};

const same = (a, b) => Math.round(a) === Math.round(b);

/** The dimensions, padding and gap equal in both boxes, rounded; zero is nothing fixed; null when none is. */
function fixed(short, long) {
  if (!short || !long) return null;
  const box = {};
  if (same(short.height, long.height) && Math.round(short.height))
    box.height = Math.round(short.height);
  if (same(short.width, long.width) && Math.round(short.width))
    box.width = Math.round(short.width);
  const padding = short.padding?.map(Math.round);
  if (
    padding?.some(Boolean) &&
    padding.every((side, i) => same(side, long.padding[i]))
  )
    box.padding = padding;
  if (same(short.gap, long.gap) && Math.round(short.gap))
    box.gap = Math.round(short.gap);
  return Object.keys(box).length ? box : null;
}

/** Pairs the short and long readings by case name: `{ boxes, errors }`. */
export function fixedBoxes(readings) {
  const byName = new Map();
  for (const reading of readings) {
    byName.set(reading.name, {
      ...byName.get(reading.name),
      [reading.content]: reading,
    });
  }
  const boxes = {};
  const errors = [];
  for (const [name, { short, long }] of byName) {
    if (!short || !long) {
      errors.push(`${name}: needs a short and a long rendering`);
      continue;
    }
    if (short.missing || long.missing) {
      errors.push(`${name}: element not found`);
      continue;
    }
    const root = fixed(short.root, long.root);
    if (root) boxes[name] = root;
    for (const slot of Object.keys(short.parts)) {
      if (!short.parts[slot] || !long.parts[slot]) {
        errors.push(`${name}: no part ${slot}`);
        continue;
      }
      const box = fixed(short.parts[slot], long.parts[slot]);
      if (box) boxes[`${name}/${slot}`] = box;
    }
    // A declared minimum, unless it is the fixed height anyway.
    for (const slot of Object.keys(short.mins ?? {})) {
      const min = fixed(short.mins[slot], long.mins?.[slot]);
      if (!min?.height) continue;
      const key = slot === 'root' ? name : `${name}/${slot}`;
      if (boxes[key]?.height !== min.height)
        boxes[key] = { ...boxes[key], minHeight: min.height };
    }
  }
  return { boxes, errors };
}

async function main() {
  if (!(await isUp(storybookUrl)))
    throw new Error(
      `Storybook isn't running on ${storybookUrl}. Start it with pnpm storybook first.`,
    );
  const browser = await chromium.launch().catch((error) => {
    throw new Error(
      `${error.message.split('\n')[0]}\nInstall the browser with: pnpm exec playwright-core install chromium`,
    );
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 900 },
    });
    const readings = [];
    for (const story of stories) {
      await page.goto(storyUrl(story), {
        waitUntil: 'networkidle',
        timeout: 120_000,
      });
      await page.waitForTimeout(500);
      readings.push(...(await page.evaluate(readBoxes)));
      for (const wrapper of await page.locator('[data-open]').all()) {
        const only = `${await wrapper.getAttribute('data-measure')}|${await wrapper.getAttribute('data-content')}`;
        await wrapper.locator('[role="combobox"], button').first().click();
        await page.waitForTimeout(300);
        readings.push(...(await page.evaluate(readBoxes, only)));
        await page.keyboard.press('Escape');
        await page.waitForTimeout(200);
      }
    }
    const { boxes, errors } = fixedBoxes(readings);
    if (errors.length) throw new Error(errors.join('\n'));
    process.stdout.write(JSON.stringify(boxes, null, 2));
  } finally {
    await browser.close();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
