import { describe, expect, it } from 'vitest';
import { catalog, flows, scope } from '../../02design/__fixtures__/chain';
import { contractSystemPrompt, contractUserMessage } from './index';

describe('the contract prompt', () => {
  it('fills the record fields, a line each, and keeps the notes out', () => {
    const prompt = contractSystemPrompt();
    expect(prompt).not.toContain('{{');
    expect(prompt).not.toContain('<!--');
    expect(prompt).toContain('\n- id\n- createdAt\n- updatedAt\n');
  });

  it('names every field of the contract it asks for', () => {
    const prompt = contractSystemPrompt();
    for (const field of ['entities', 'noun', 'fields', 'kind', 'enums', 'inputs', 'flowSteps', 'widgets', 'reads'])
      expect(prompt).toContain(`\`${field}\``);
  });

  it('gives the vocabulary, the flows and what the contract reads of each widget', () => {
    const message = contractUserMessage(scope, flows, catalog.widgets);
    expect(message).not.toContain('{{');
    expect(message).toContain('"noun": "Book"');
    expect(message).toContain('"id": "F03"');
    expect(message).toContain('"repeat": "Book"');
    expect(message).toContain('"FD03"');
    expect(message).not.toContain('"slots"');
    expect(message).not.toContain('"minWidthPx"');
  });
});
