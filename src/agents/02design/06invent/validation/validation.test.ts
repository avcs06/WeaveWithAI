import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { designs, ia, inventory } from '../../__fixtures__/widgets';
import type { Issue } from '../../../../core/issues';
import type { Scope } from '../../../01flows/01scope/schema';
import type { Flows } from '../../../01flows/schema';
import { Brief } from '../../01brief/schema';
import { buildTheme } from '../../02theme/build';
import { makeThemeSchema } from '../../02theme/schema';
import { layoutShells } from '../../02theme/shells';
import type { DesignContext } from '../../rules/helpers';
import { validateComponent } from './validation';

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

const rules = (issues: Issue[]) => [...new Set(issues.map((i) => i.rule))];

const [cover] = ia.newComponents;

const coverDesign = designs.get(cover?.name ?? '');

if (!cover || !coverDesign) throw new Error('the fixture declares TitleCover');

describe('a component call', () => {
  it('fails DESIGN-004 for a design without states', () => {
    const issues = validateComponent(
      { ...cover, ...coverDesign, states: [], usedOn: ['S06'] },
      ia,
      ctx,
    );
    expect(rules(issues)).toEqual(['DESIGN-004']);
  });
});
