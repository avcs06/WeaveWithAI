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
    expect(message).toContain('# Flows (01-flows/03-expand.json)');
    expect(message).toContain('"F05"');
    expect(message).toContain('# Page layouts');
  });

  it('has a peer and an output reviewer', () => {
    const { peer, output } = architectReviewGuides();
    expect(peer).toContain('Challenge, and report as a blocker');
    expect(output).toContain('no validator can catch');
    expect(`${peer}${output}`).not.toContain('{{');
  });
});
