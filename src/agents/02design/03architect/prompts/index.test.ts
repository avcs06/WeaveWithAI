import { describe, expect, it } from 'vitest';
import { brief, flows, inventory, scope, theme } from '../../__fixtures__/chain';
import { planSystemPrompt, planUserMessage } from './index';

const filled = (text: string) => {
  expect(text).not.toContain('{{');
  expect(text).not.toContain('<!--');
};

describe('the architect prompt', () => {
  it('fills the density, the design system and the budget', () => {
    const prompt = planSystemPrompt(brief, inventory);
    filled(prompt);
    expect(prompt).toContain(`for ${brief.density} density`);
    expect(prompt).toMatch(/^Button: /m);
    expect(prompt).toContain('Declare at most 5.');
  });

  it('names every field of the plan it asks for', () => {
    const prompt = planSystemPrompt(brief, inventory);
    for (const field of [
      'screens',
      'type',
      'route',
      'parent',
      'kind',
      'framed',
      'contentWidth',
      'title',
      'purpose',
      'entry',
      'flowSteps',
      'states',
      'composition',
      'frame',
      'alternativesElsewhere',
      'navigation',
      'screen',
      'slot',
      'newComponents',
      'name',
      'closestExisting',
      'whyNotExisting',
      'description',
      'impossibleSteps',
    ])
      expect(prompt, field).toContain(`\`${field}\``);
  });

  it('puts the scope, the flows, the brief and the layouts in the user message', () => {
    const message = planUserMessage(scope, flows, brief, theme.layouts);
    filled(message);
    expect(message).toContain('# Page layouts');
    expect(message).toContain('"docksFirst"');
    expect(message).toContain('"id": "F05.S02"');
  });
});
