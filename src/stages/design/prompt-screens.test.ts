import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { COPY_KINDS, SECTION_KINDS } from '../../config/design';
import { Flows, Scope } from '../flows/schema';
import { designs, ia, inventory } from './__fixtures__/widgets';
import {
  componentSystemPrompt,
  componentUserMessage,
  frameSystemPrompt,
  frameUserMessage,
  iaSystemPrompt,
  iaUserMessage,
  widgetsSystemPrompt,
  widgetsUserMessage,
} from './prompt-screens';
import { layoutShells } from './resolve';
import { Brief, type NewComponent } from './schema';
import type { ThemeCall } from './schema-theme';
import { buildTheme } from './theme';

const read = (path: string) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8')) as unknown;
const scope = Scope.parse(
  read('../flows/__fixtures__/reading-list.scope.json'),
);
const flows = Flows.parse(
  read('../flows/__fixtures__/reading-list.flows.json'),
);
const brief = Brief.parse(read('./__fixtures__/reading-list.brief.json'));
const theme = buildTheme(
  brief,
  read('./__fixtures__/reading-list.theme.json') as ThemeCall,
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

describe('the IA prompt', () => {
  it('fills the density, each section kind on its own line, the copy kinds, the side panel, the design system and the budget', () => {
    const prompt = iaSystemPrompt(brief, inventory);
    filled(prompt);
    for (const kind of SECTION_KINDS) expect(prompt).toContain(`\n- ${kind}`);
    expect(prompt).toContain(COPY_KINDS.join(', '));
    expect(prompt).toContain('one side panel 300 wide');
    expect(prompt).toContain('comfortable density');
    expect(prompt).toMatch(/^Button: /m);
    expect(prompt).toContain('at most 5:');
  });

  it('names every field of the IA schema it asks for', () => {
    const prompt = iaSystemPrompt(brief, inventory);
    for (const field of [
      'arrangement',
      'title',
      'copy',
      'content',
      'flowSteps',
      'fields',
      'data',
      'states',
      'repeat',
      'newComponents',
      'area',
      'surface',
      'headingLevel',
      'closestExisting',
      'whyNotExisting',
    ])
      expect(prompt, field).toContain(`\`${field}\``);
  });

  it('puts the scope, the flows, the brief and the layouts in the user message', () => {
    const message = iaUserMessage(scope, flows, brief, theme.layouts);
    filled(message);
    expect(message).toContain('# Page layouts (02-theme.json)');
    expect(message).toContain('"docksFirst"');
  });
});

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

describe('the frame prompt', () => {
  it('gives a shell its regions, the framed pages of its kind and the navigation', () => {
    filled(frameSystemPrompt('SH1', brief, inventory));
    expect(frameSystemPrompt('SH1', brief, inventory)).toContain(
      'IDs SH1.n01, SH1.n02',
    );
    const message = frameUserMessage(
      'SH1',
      ia,
      layoutShells(theme.layouts),
      scope,
      brief,
      theme,
    );
    filled(message);
    const target = message.slice(0, message.indexOf('# Navigation'));
    expect(target).toContain('"id": "SH1.r1"');
    expect(target).toContain('"route": "/shelf"');
    expect(target).not.toContain('"route": "/sign-in"');
    expect(message).toContain(`"label": "${ia.navigation.items[0]?.label}"`);
  });
});

describe('the component prompt', () => {
  it('gives the declaration and the widgets that use it', () => {
    filled(componentSystemPrompt('TitleCover', inventory));
    expect(componentSystemPrompt('TitleCover', inventory)).toContain(
      'declared TitleCover',
    );
    const message = componentUserMessage('TitleCover', ia, scope, brief, theme);
    filled(message);
    expect(message).toContain('"whyNotExisting"');
    expect(message).toContain('"id": "W12"');
    expect(message).toContain('"radius"');
  });
});
