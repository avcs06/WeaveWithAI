import { existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { execa } from 'execa';
import { chromium } from 'playwright-core';

// The theme seen before any page exists: an app folder made from the template,
// one story with every recipe on it, and a screenshot of it in each mode.

/** The template copied into `appDir` by its own generator, then installed; MCP setup is left for the coding stage. */
export async function scaffoldApp(appDir: string): Promise<void> {
  await execa('node', ['template/tools/generate.mjs', 'template', appDir, '--skip-setup'], {
    stdio: 'inherit',
  });
  // The template is a pnpm workspace with its own lockfile pruned by the generator.
  await execa('pnpm', ['install', '--no-frozen-lockfile'], { cwd: appDir, stdio: 'inherit' });
}

export const STORY_ID = 'all-components--page';

/** A story beside the template's recipe stories that renders every one of them on one page. */
export function writeAllComponentsStory(appDir: string): void {
  writeFileSync(
    path.join(appDir, 'packages/ui/src/AllComponents.stories.tsx'),
    `import React from 'react';

import * as recipes from './Recipes.stories';

import type { Meta, StoryObj } from '@storybook/react-vite';

// Written by the generator for theme screenshots: every recipe story on one page.
const meta = {
  title: 'All components',
  parameters: { controls: { disable: true }, layout: 'padded' },
} satisfies Meta;

export default meta;

export const Page: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
      {Object.entries(recipes)
        // Storybook adds __namedExportsOrder to every stories module.
        .filter(([name]) => name !== 'default' && !name.startsWith('__'))
        .map(([name, story]) => (
          <section key={name} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-display)' }}>{name}</h2>
            {(story as StoryObj).render?.({}, {} as never)}
          </section>
        ))}
    </div>
  ),
};
`,
  );
}

/** Waits until Storybook answers on `url`, or fails after `ms`. */
async function ready(url: string, ms: number): Promise<void> {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    const ok = await fetch(url).then((r) => r.ok, () => false);
    if (ok) return;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Storybook did not answer on ${url} within ${ms / 1000}s`);
}

/**
 * Starts the app's Storybook on its own port, so a Storybook already running
 * on 6006 is left alone, and saves a full-page screenshot of every component
 * for each mode given. Returns the files written.
 */
export async function screenshotComponents(
  appDir: string,
  out: Partial<Record<'light' | 'dark', string>>,
  port = 6116,
): Promise<string[]> {
  const storybook = execa(
    'pnpm',
    ['exec', 'storybook', 'dev', '-p', String(port), '-c', 'packages/ui/.storybook', '--no-open', '--ci'],
    { cwd: appDir, reject: false },
  );
  const base = `http://localhost:${port}`;
  try {
    await ready(`${base}/iframe.html`, 240_000);
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      const written: string[] = [];
      for (const [mode, file] of Object.entries(out)) {
        await page.goto(`${base}/iframe.html?id=${STORY_ID}&viewMode=story&globals=theme:${mode}`, {
          waitUntil: 'networkidle',
          timeout: 180_000,
        });
        await page.waitForSelector('#storybook-root section', { timeout: 120_000 });
        // Runs in the page; the agent's tsconfig has no DOM types.
        await page.evaluate('document.fonts.ready.then(() => true)');
        // Some recipes load their sample rows on timers of up to 1.5 s.
        await page.waitForTimeout(2000);
        await page.screenshot({ path: file, fullPage: true });
        written.push(file);
      }
      return written;
    } finally {
      await browser.close();
    }
  } finally {
    storybook.kill();
  }
}

/** True when the app folder was made already; the scaffold runs once per app. */
export const scaffolded = (appDir: string) => existsSync(path.join(appDir, 'node_modules'));
