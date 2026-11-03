import { describe, expect, it } from 'vitest';
import { brief, flows, scope, theme } from '../../__fixtures__/chain';
import {
  architectReviewGuides,
  architectSystemPrompt,
  architectUserMessage,
} from './index';

const filled = (text: string) => {
  expect(text).not.toContain('{{');
  expect(text).not.toContain('<!--');
};

describe('the architect prompt', () => {
  it('names every field of the frames, screens and dialogs it asks for', () => {
    const prompt = architectSystemPrompt();
    filled(prompt);
    for (const field of [
      'route',
      'title',
      'purpose',
      'steps',
      'alternatives',
      'openedFrom',
    ])
      expect(prompt).toContain(`\`${field}\``);
  });

  it('carries the scope, the flows, the brief and the layouts', () => {
    const message = architectUserMessage(scope, flows, brief, theme.layouts);
    filled(message);
    expect(message).toContain('# Flows\n');
    expect(message).toContain('"F05"');
    expect(message).toContain('# Page layouts');
  });

  it('has a peer and an output reviewer', () => {
    const { peer, output } = architectReviewGuides();
    expect(peer).toContain('Report as a blocker only what you would not sign off');
    expect(output).toContain('you also check that its parts point at each other');
    expect(`${peer}${output}`).not.toContain('{{');
  });

  it('asks for landing content in order without repeating the frame action', () => {
    const landing = architectSystemPrompt().split('## The landing page')[1]!.split('## Dialogs')[0]!;
    const steps = ['1. The headline', '2. The main action', '3. A preview', '4. Three or four reasons'];
    const positions = steps.map((step) => landing.indexOf(step));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(landing).toContain('One valid choice, when it suits the app');
    expect(landing).toContain('The preview changes no records');
    expect(architectReviewGuides().peer).toContain('It has its headline, its main action, a preview of the app');
  });
});
