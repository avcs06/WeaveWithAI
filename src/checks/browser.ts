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

/** A context signed in through the app's own sign-in; the cookie stays in the context. */
export async function signedInContext(
  browser: Browser,
  baseUrl: string,
  email: string,
  password: string,
): Promise<BrowserContext> {
  const context = await browser.newContext();
  const response = await context.request.post(
    new URL('/api/auth/sign-in', baseUrl).href,
    {
      data: { email, password },
    },
  );
  if (!response.ok())
    throw new Error(`sign-in as ${email} failed: ${response.status()}`);
  return context;
}

export async function openRoute(
  context: BrowserContext,
  url: string,
): Promise<Page> {
  const page = await context.newPage();
  await page.setViewportSize({ width: WIDTH, height: HEIGHT });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  return page;
}
