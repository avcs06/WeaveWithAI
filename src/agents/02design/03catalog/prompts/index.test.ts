import { describe, expect, it } from 'vitest';
import { flows, inventory, plan, scope, theme } from '../../__fixtures__/chain';
import { contentWidth } from '../../04screen/width';
import { SECTION_KINDS } from '../../config';
import { catalogSystemPrompt, catalogUserMessage } from './index';

const filled = (text: string) => {
  expect(text).not.toContain('{{');
  expect(text).not.toContain('<!--');
};

describe('the catalog prompt', () => {
  it('fills the table of possible boxes and the section kinds, a line each', () => {
    const prompt = catalogSystemPrompt();
    filled(prompt);
    expect(prompt).toContain('\n- hero: 640 to fill');
    expect(prompt).toContain('\n- auth-form: 320 to 480');
    expect(prompt).toContain('\n- field: 160');
    for (const kind of SECTION_KINDS) expect(prompt).toContain(`\n- ${kind}`);
  });

  it('names every field of the catalog it asks for', () => {
    const prompt = catalogSystemPrompt();
    for (const field of [
      'widgets',
      'kind',
      'name',
      'holds',
      'flowSteps',
      'data',
      'states',
      'containsHeading',
      'repeat',
      'newComponents',
      'slots',
      'words',
      'parts',
      'minWidthPx',
      'maxWidthPx',
      'layout',
      'text',
      'gap',
      'padding',
      'components',
      'screens',
      'frameSteps',
    ])
      expect(prompt, field).toContain(`\`${field}\``);
  });

  it('gives the processed plan, the flows, the vocabulary and each content width', () => {
    const widths = Object.fromEntries(plan.screens.map((s) => [s.id, contentWidth(s, theme, inventory)]));
    const message = catalogUserMessage(plan, flows, scope, widths);
    filled(message);
    expect(message).toContain('"composition"');
    expect(message).toContain('"access": "signedIn"');
    expect(message).toContain(`"S02": ${widths.S02}`);
    expect(message).toContain('"noun": "Book"');
  });
});
