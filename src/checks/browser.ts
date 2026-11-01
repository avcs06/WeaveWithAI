import {
  type Browser,
  type BrowserContext,
  chromium,
  type Page,
} from 'playwright-core';

/** The width every route is checked at: desktop only for the MVP. */
export const WIDTH = 1280;
export const HEIGHT = 900;

export async function withBrowser<T>(
  fn: (browser: Browser) => Promise<T>,
): Promise<T> {
  const browser = await chromium.launch().catch((error: Error) => {
    throw new Error(
      `${error.message.split('\n')[0]}\nInstall the browser with: pnpm exec playwright-core install chromium`,
    );
  });
  try {
    return await fn(browser);
  } finally {
    await browser.close();
  }
}

/** No motion: styles are measured at rest, not halfway through a transition. */
const STILL = '*, *::before, *::after { transition: none !important; animation: none !important; }';

/**
 * A page at `url`, with `storage`'s localStorage entries written before it loads, such as a signed-in session.
 * Once it has loaded its motion stops, so the checks measure styles at rest.
 */
export async function openRoute(
  context: BrowserContext,
  url: string,
  storage: Record<string, string> = {},
): Promise<Page> {
  const page = await context.newPage();
  await page.addInitScript((entries) => {
    for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value);
  }, storage);
  await page.setViewportSize({ width: WIDTH, height: HEIGHT });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: STILL });
  await page.waitForTimeout(300);
  return page;
}
