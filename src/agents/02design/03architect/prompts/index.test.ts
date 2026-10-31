import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { inventory } from '../../__fixtures__/widgets';
import { Scope } from '../../../01flows/01scope/schema';
import { Flows } from '../../../01flows/schema';
import { Brief } from '../../01brief/schema';
import { buildTheme } from '../../02theme/build';
import type { ThemeCall } from '../../02theme/schema';
import { COPY_KINDS, SECTION_KINDS } from '../../config';
import { iaSystemPrompt, iaUserMessage } from './index';

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
    expect(message).toContain('# Page layouts (02-design/02-theme.json)');
    expect(message).toContain('"docksFirst"');
  });
});
