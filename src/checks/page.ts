import { readFileSync } from 'node:fs';
import type { Page } from 'playwright-core';
import { pathBeside } from '../core/utils';

// The in-page measurements (in-page.js) are installed once per document and
// called by name, so the TypeScript here never needs DOM types.

// The layout measures come second: they use the helpers the first file shares.
const SOURCE = ['./in-page.js', './in-page-layout.js']
  .map((file) => readFileSync(pathBeside(import.meta.url, file), 'utf8'))
  .join('\n');

type Checks = Record<string, (arg?: unknown) => unknown>;

export async function inPage<T>(
  page: Page,
  name: string,
  arg?: unknown,
): Promise<T> {
  const installed = await page.evaluate(() => '__weaveChecks' in globalThis);
  if (!installed) await page.evaluate(SOURCE);
  return (await page.evaluate(
    ([check, value]) => {
      const checks = (globalThis as unknown as { __weaveChecks: Checks })
        .__weaveChecks;
      return checks[check as string]?.(value);
    },
    [name, arg] as const,
  )) as T;
}
