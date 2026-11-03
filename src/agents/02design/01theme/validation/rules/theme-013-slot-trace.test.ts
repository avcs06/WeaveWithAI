import { describe, expect, it } from 'vitest';
import { runRules } from '../../../../../core/rules';
import { flows, scope, theme } from '../../../__fixtures__/chain';
import { rule } from './theme-013-slot-trace';

describe('THEME-013', () => {
  const at = (change: (layouts: typeof theme.layouts) => void) => {
    const layouts = structuredClone(theme.layouts);
    change(layouts);
    return runRules([rule], { layouts, scope, flows }).map((issue) => [
      issue.at,
      issue.message,
    ]);
  };

  it('passes the reading-list layouts: the wordmark, the Shelf link and Sign in', () => {
    expect(at(() => {})).toEqual([]);
  });

  it('fails a slot that names what no flow gives the user, in a needed part only', () => {
    expect(at((l) => (l.app.header.end = 'Help, the Shelf link'))).toEqual([
      [
        'app.header.end',
        'The app header end names "Help", which the scope and the flows do not have. Name only what a flow gives the user, or leave it out.',
      ],
    ]);
    expect(at((l) => (l.app.footer.start = 'Product links'))).toEqual([]);
    expect(at((l) => (l.marketing.header.center = 'Search'))).toEqual([]);
  });
});
