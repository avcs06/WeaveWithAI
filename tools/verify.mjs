// Fails on what typecheck and lint can't see: runs the MCP's validate on the
// route's files (or every recipe), then opens the pages at phone and desktop
// widths for runtime and hydration errors and layout that doesn't fit.
//
//   pnpm verify /events [/other …]     app routes, on the dev server (:3001)
//   pnpm verify --recipes              every recipe story, on Storybook (:6006)
import { spawn, spawnSync } from 'node:child_process';
import {
  existsSync,
  globSync,
  mkdirSync,
  readdirSync,
  readFileSync,
} from 'node:fs';
import { basename, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright-core';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const appUrl = 'http://localhost:3001';
const storybookUrl = 'http://localhost:6006';
const widths = [320, 375, 1280];
const screenshots = join(root, 'tmp/verify');

const webDir = join(root, 'web');
const pages = ['page.tsx', 'page.ts', 'page.jsx', 'page.js'];

/** The folder holding a route's page, through route groups and dynamic segments, as Next.js matches it. */
function routeFolder(dir, segments) {
  if (!segments.length && pages.some((page) => existsSync(join(dir, page))))
    return dir;
  const [segment, ...rest] = segments;
  const folders = readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  const candidates = [
    ...folders.filter((name) => name === segment).map((name) => [name, rest]),
    ...folders
      .filter((name) => /^\(.+\)$/.test(name))
      .map((name) => [name, segments]),
    ...folders
      .filter((name) => segment !== undefined && /^\[[^.[]/.test(name))
      .map((name) => [name, rest]),
    ...folders
      .filter(
        (name) =>
          /^\[\[?\.\.\./.test(name) &&
          (segment !== undefined || name.startsWith('[[')),
      )
      .map((name) => [name, []]),
  ];
  for (const [name, remaining] of candidates) {
    const found = routeFolder(join(dir, name), remaining);
    if (found) return found;
  }
  return undefined;
}

/** A route's own files and every web file they import, through the app's tsconfig paths. */
function routeFiles(route) {
  const segments = new URL(route, appUrl).pathname.split('/').filter(Boolean);
  const folder = routeFolder(join(webDir, 'app'), segments);
  if (!folder) throw new Error(`No page under web/app for ${route}.`);

  const tsconfig = join(webDir, 'tsconfig.json');
  const { config } = ts.readConfigFile(tsconfig, ts.sys.readFile);
  const { options } = ts.parseJsonConfigFileContent(config, ts.sys, webDir);
  const pending = readdirSync(folder, { withFileTypes: true })
    .filter(
      (entry) => entry.isFile() && /^[^.]+(\.css)?\.[jt]sx?$/.test(entry.name),
    )
    .map((entry) => join(folder, entry.name));
  const files = new Set();
  while (pending.length) {
    const file = pending.pop();
    if (files.has(file)) continue;
    files.add(file);
    const { importedFiles } = ts.preProcessFile(readFileSync(file, 'utf8'));
    for (const { fileName } of importedFiles) {
      const resolved = ts.resolveModuleName(fileName, file, options, ts.sys)
        .resolvedModule?.resolvedFileName;
      if (
        resolved &&
        !resolved.endsWith('.d.ts') &&
        !resolved.includes('/node_modules/') &&
        !relative(webDir, resolved).startsWith('..')
      )
        pending.push(resolved);
    }
  }
  return [...files];
}

function recipeFiles() {
  const { recipes = [] } = JSON.parse(
    readFileSync(join(root, 'designsystem.config.json'), 'utf8'),
  );
  return recipes.flatMap((pattern) =>
    globSync(pattern, { cwd: root }).map((file) => join(root, file)),
  );
}

/** Runs validate on each file, as an agent does; false when it finds an error. */
function validates(files) {
  console.log(`validate: ${files.length} files`);
  const { status } = spawnSync(
    process.execPath,
    [join(root, 'tools/validate-files.mjs'), ...files],
    { cwd: root, stdio: 'inherit' },
  );
  console.log();
  return status === 0;
}

const isUp = (url) =>
  fetch(url).then(
    () => true,
    () => false,
  );

/** Uses the running dev server, or starts one and returns a stop function. */
async function ensureAppServer() {
  if (await isUp(appUrl)) return () => undefined;
  console.log(`Starting the dev server on ${appUrl}…`);
  const server = spawn('pnpm', ['dev'], {
    cwd: root,
    detached: true,
    stdio: 'ignore',
  });
  const stop = () => process.kill(-server.pid);
  for (let waited = 0; !(await isUp(appUrl)); waited += 500) {
    if (waited > 120_000) {
      stop();
      throw new Error('The dev server did not start within 2 minutes.');
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return stop;
}

/** Every recipe story, failing for a recipe file that has none. */
async function recipeTargets() {
  if (!(await isUp(storybookUrl)))
    throw new Error(
      `Storybook isn't running on ${storybookUrl}. Start it with pnpm storybook first.`,
    );
  const index = await (await fetch(`${storybookUrl}/index.json`)).json();
  const stories = Object.values(index.entries).filter(
    (entry) => entry.type === 'story' && entry.id.startsWith('recipes--'),
  );
  const storyIds = new Set(stories.map((story) => story.id));
  // Storybook hyphenates the words of an id: ScrollArea's is `scroll-area`.
  const storyId = (name) =>
    `recipes--${name.replace(/(?<=[a-z0-9])(?=[A-Z])/g, '-').toLowerCase()}`;
  const missing = globSync('packages/ui/src/*/*.recipe.tsx', { cwd: root })
    .map((file) => basename(file, '.recipe.tsx'))
    .filter((name) => !storyIds.has(storyId(name)));
  if (missing.length)
    throw new Error(
      `No story in Recipes.stories.tsx for: ${missing.join(', ')}.`,
    );
  return stories.map((story) => ({
    name: story.id,
    url: `${storybookUrl}/iframe.html?id=${story.id}&viewMode=story`,
    // Breaks on purpose, and React logs each error a boundary catches.
    allowConsoleErrors: story.id === storyId('ErrorBoundary'),
  }));
}

// Runs in the page. Only a table or a sideways ScrollArea (like a tab list)
// may scroll sideways; anything else is cut off or pushes content off screen.
const measureLayout = () => {
  const scrolls = (element) =>
    ['auto', 'scroll'].includes(getComputedStyle(element).overflowX);
  // A ScrollArea that scrolls sideways shows its horizontal scrollbar.
  const isSidewaysScrollArea = (element) =>
    element.matches('[data-slot="viewport"]') &&
    Boolean(
      element.parentElement?.querySelector(
        ':scope > [data-slot="scrollbar"][data-orientation="horizontal"]',
      ),
    );
  const scroller = (element) => {
    for (let parent = element.parentElement; parent; parent = parent.parentElement)
      if (scrolls(parent)) return parent;
    return null;
  };
  const tableScrollers = new Set(
    [...document.querySelectorAll('table')].map(scroller),
  );
  const name = (element) =>
    [element.tagName.toLowerCase(), ...[...element.classList].slice(0, 2)].join('.');
  const page = document.documentElement;
  return [
    ...(page.scrollWidth > window.innerWidth
      ? [`page is ${page.scrollWidth}px wide`]
      : []),
    ...[...document.body.querySelectorAll('*')]
      .filter(
        (element) =>
          scrolls(element) &&
          element.scrollWidth > element.clientWidth + 1 &&
          !tableScrollers.has(element) &&
          !isSidewaysScrollArea(element),
      )
      .map(
        (element) =>
          `${name(element)} scrolls sideways (${element.scrollWidth}px in ${element.clientWidth}px)`,
      ),
  ];
};

async function check(browser, { name, url, allowConsoleErrors }, width) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  const problems = [];
  page.on('pageerror', (error) => problems.push(`error: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error' && !allowConsoleErrors)
      problems.push(`console.error: ${message.text()}`);
  });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 120_000 });
  await page.waitForTimeout(500);
  problems.push(...(await page.evaluate(measureLayout)));
  const file = `${name.replace(/[^a-z0-9-]+/gi, '_').replace(/^_|_$/g, '') || 'index'}-${width}.png`;
  await page.screenshot({ path: join(screenshots, file), fullPage: true });
  await page.close();
  return problems.map((problem) => problem.split('\n')[0].slice(0, 300));
}

const args = process.argv.slice(2);
if (!args.length) {
  console.error('Usage: pnpm verify <route> [<route> …] | pnpm verify --recipes');
  process.exit(2);
}

let stop = () => undefined;
let failures = 0;
try {
  const recipes = args.includes('--recipes');
  if (!validates(recipes ? recipeFiles() : args.flatMap(routeFiles)))
    failures += 1;

  const targets = recipes
    ? await recipeTargets()
    : args.map((route) => ({ name: route, url: new URL(route, appUrl).href }));
  if (!recipes) stop = await ensureAppServer();

  mkdirSync(screenshots, { recursive: true });
  const browser = await chromium.launch().catch((error) => {
    throw new Error(
      `${error.message.split('\n')[0]}\nInstall the browser with: pnpm exec playwright-core install chromium`,
    );
  });
  for (const target of targets) {
    console.log(target.name);
    for (const width of widths) {
      const problems = await check(browser, target, width);
      failures += problems.length ? 1 : 0;
      console.log(`  ${String(width).padEnd(5)} ${problems.length ? 'FAIL' : 'ok'}`);
      for (const problem of problems) console.log(`        ${problem}`);
    }
  }
  await browser.close();
  console.log(
    failures
      ? `\n${failures} check(s) failed. Screenshots: tmp/verify/`
      : `\nAll ${targets.length * widths.length} checks passed. Screenshots: tmp/verify/`,
  );
} catch (error) {
  console.error(error.message);
  failures += 1;
} finally {
  stop();
}
process.exit(failures ? 1 : 0);
