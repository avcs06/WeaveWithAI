import { describe, expect, it } from 'vitest';
import { brief, catalog, inventory, plan, scope, theme } from '../../__fixtures__/chain';
import { componentSystemPrompt, componentUserMessage } from './index';

const filled = (text: string) => {
  expect(text).not.toContain('{{');
  expect(text).not.toContain('<!--');
};

describe('the invent prompt', () => {
  it('carries the node guide and the design system, the same for every component', () => {
    const prompt = componentSystemPrompt(brief, inventory);
    filled(prompt);
    expect(prompt).toContain('TitleCover.n01');
    expect(prompt).toContain('on app screens H1 title');
    expect(prompt).toMatch(/^Button: /m);
    for (const field of ['box', 'layout', 'nodes', 'what']) expect(prompt, field).toContain(`\`${field}\``);
  });

  it("gives the architect's description, the catalog's width range, the widgets that hold it and the look", () => {
    const message = componentUserMessage('TitleCover', plan, catalog, scope, brief, theme);
    filled(message);
    expect(message).toContain('"description": "A 160 by 240 block');
    expect(message).toContain('"minWidthPx": 160');
    expect(message).toContain('"id": "W09"');
    expect(message).toContain('"radius"');
  });
});
