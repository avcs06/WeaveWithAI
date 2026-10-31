import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { designs, ia, inventory } from '../../__fixtures__/widgets';
import { Scope } from '../../../01flows/01scope/schema';
import { Flows } from '../../../01flows/schema';
import { Brief } from '../../01brief/schema';
import { buildTheme } from '../../02theme/build';
import type { ThemeCall } from '../../02theme/schema';
import type { NewComponent } from '../../schema';
import { widgetsSystemPrompt, widgetsUserMessage } from './index';

const read = (path: string) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8')) as unknown;

const scope = Scope.parse(
  read('../../../01flows/__fixtures__/reading-list.scope.json'),
);

const flows = Flows.parse(
  read('../../../01flows/__fixtures__/reading-list.flows.json'),
);

const brief = Brief.parse(read('../../__fixtures__/reading-list.brief.json'));

const theme = buildTheme(
  brief,
  read('../../__fixtures__/reading-list.theme.json') as ThemeCall,
);

const components: NewComponent[] = ia.newComponents.map((c) => ({
  ...c,
  ...designs.get(c.name)!,
  usedOn: ['S06'],
}));

const filled = (text: string) => {
  expect(text).not.toContain('{{');
  expect(text).not.toContain('<!--');
};

describe('the widget prompt', () => {
  it('names the widgets it builds, the heading sizes by level and the node guide', () => {
    const prompt = widgetsSystemPrompt(['W11', 'W12'], brief, inventory);
    filled(prompt);
    expect(prompt).toContain('build widgets W11 and W12');
    expect(prompt).toContain(
      'on app screens H1 title, H2 heading, H3 subheading, H4 body',
    );
    expect(prompt).toContain('## Each node');
    expect(prompt).toContain('IDs W03.n01, W03.n02');
    expect(prompt).toMatch(/^Button: /m);
  });

  it('gives the widgets their definitions and placements, the deck, the steps they serve with their fields, and the components they use', () => {
    const message = widgetsUserMessage(
      ['W09', 'W12'],
      ia,
      components,
      flows,
      scope,
      brief,
      theme,
    );
    filled(message);
    const built = message.slice(0, message.indexOf('# Copy deck'));
    expect(built).toContain('"id": "W09"');
    expect(built).toContain('"W12 (this one)"');
    expect(built).not.toContain('"id": "W05"');
    expect(message).toContain(`"id": "${ia.copy[0]?.id}"`);
    expect(message).toContain('"id": "F03.S02"');
    expect(message).toContain('"id": "FD05"');
    expect(message).not.toContain('"id": "F04.S01"');
    expect(message).toContain('"name": "TitleCover"');
    expect(message).toContain('"contentArea": {\n    "app"');
    expect(
      widgetsUserMessage(['W05'], ia, components, flows, scope, brief, theme),
    ).not.toContain('"name": "TitleCover"');
  });
});
