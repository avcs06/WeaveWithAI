import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { architecture, flows, scope } from '../../02design/__fixtures__/chain';
import { Contract } from '../../03contract/schema';
import { builtScreens, pagesSpec, TEMPLATE_ROUTES } from './stage';

const contract = Contract.parse(
  JSON.parse(readFileSync(new URL('../../03contract/__fixtures__/reading-list.contract.json', import.meta.url), 'utf8')),
);

describe('the pages session', () => {
  it('builds every screen but sign in and sign up, one checked route each, in the same order', () => {
    const screens = builtScreens(architecture);
    expect(architecture.screens.some((screen) => TEMPLATE_ROUTES.includes(screen.route))).toBe(true);
    expect(screens.map((screen) => screen.route)).not.toEqual(expect.arrayContaining(TEMPLATE_ROUTES));
    const { routes } = pagesSpec(architecture, contract, flows, scope);
    expect(routes).toHaveLength(screens.length);
    // A concrete route keeps its screen's first segment: /books/[bookId] is checked at /books/<id>.
    screens.forEach((screen, index) =>
      expect(routes![index]!.url.split('/')[1]).toBe(screen.route.split('/')[1]),
    );
  });
});
