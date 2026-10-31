import { describe, expect, it } from 'vitest';
import { brief, catalog, flows, inventory, plan, scope, theme } from '../../__fixtures__/chain';
import { widgetsSystemPrompt, widgetsUserMessage } from './index';

const filled = (text: string) => {
  expect(text).not.toContain('{{');
  expect(text).not.toContain('<!--');
};
const defined = (id: string) => catalog.widgets.find((w) => w.id === id)!;

describe('the draw prompt', () => {
  it('carries the heading sizes by level, the node guide and the design system, the same for every call', () => {
    const prompt = widgetsSystemPrompt(brief, inventory);
    filled(prompt);
    expect(prompt).toContain('on app screens H1 title, H2 heading, H3 subheading, H4 body');
    expect(prompt).toContain('`W03.n01`');
    expect(prompt).toMatch(/^Button: /m);
    for (const field of ['widget', 'edge', 'layout', 'nodes', 'slot', 'field']) expect(prompt, field).toContain(`\`${field}\``);
  });

  it('gives the definition it draws, the steps it serves with their fields, and only the components it holds', () => {
    const message = widgetsUserMessage(defined('W07'), plan, catalog, flows, scope, brief, theme);
    filled(message);
    const drawn = message.slice(0, message.indexOf('# Flow steps served'));
    expect(drawn).toContain('"id": "W07"');
    expect(drawn).not.toContain('"id": "W05"');
    expect(drawn).toContain('"minWidthPx"');
    expect(message).toContain('"id": "F03.S02"');
    expect(message).toContain('"id": "FD05"');
    expect(message).not.toContain('"id": "F04.S01"');
    expect(message).toContain('"contentArea": {\n    "app"');
    expect(widgetsUserMessage(defined('W09'), plan, catalog, flows, scope, brief, theme)).toContain('"name": "TitleCover"');
    expect(widgetsUserMessage(defined('W05'), plan, catalog, flows, scope, brief, theme)).not.toContain('"name": "TitleCover"');
  });
});
