import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { designs, frames, ia, inventory } from '../../__fixtures__/widgets';
import type { Scope } from '../../../01flows/01scope/schema';
import type { Flows } from '../../../01flows/schema';
import { Brief } from '../../01brief/schema';
import { buildTheme } from '../../02theme/build';
import { makeThemeSchema } from '../../02theme/schema';
import { layoutShells } from '../../02theme/shells';
import type { DesignContext } from '../../rules/helpers';
import type { FrameBuild } from '../schema';
import { validateFrame } from './validation';

const read = (file: string): unknown =>
  JSON.parse(readFileSync(new URL(file, import.meta.url), 'utf8'));

const brief = Brief.parse(read('../../__fixtures__/reading-list.brief.json'));

const theme = buildTheme(
  brief,
  makeThemeSchema(brief, inventory).parse(
    read('../../__fixtures__/reading-list.theme.json'),
  ),
);

const ctx: DesignContext = {
  scope: read('../../../01flows/__fixtures__/reading-list.scope.json') as Scope,
  flows: read('../../../01flows/__fixtures__/reading-list.flows.json') as Flows,
  inventory,
  shells: layoutShells(theme.layouts),
  defaults: theme.defaults,
};

const copyOf = (text: string) => ia.copy.find((c) => c.text === text)?.id ?? '';

const frameIssues = (f: FrameBuild) => validateFrame(f, ia, ctx, theme);

const [cover] = ia.newComponents;

const coverDesign = designs.get(cover?.name ?? '');

if (!cover || !coverDesign) throw new Error('the fixture declares TitleCover');

describe('a frame call', () => {
  it("fails DESIGN-028 when the link drawing a navigation item does not say the item's label", () => {
    const f = structuredClone(frames[0]!);
    f.nodes[1]!.text = copyOf('Shelf');
    expect(frameIssues(f).map((i) => [i.rule, i.at])).toEqual([
      ['DESIGN-028', 'SH1.n02'],
    ]);
  });
});
