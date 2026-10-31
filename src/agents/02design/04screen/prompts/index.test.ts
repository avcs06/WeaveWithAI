import { describe, expect, it } from 'vitest';
import { brief, catalog, inventory, plan, theme } from '../../__fixtures__/chain';
import { groupsOf } from '../stage';
import { contentWidth, gapOf } from '../width';
import { screenSystemPrompt, screenUserMessage } from './index';

const filled = (text: string) => {
  expect(text).not.toContain('{{');
  expect(text).not.toContain('<!--');
};
const measure = (id: string) => {
  const screen = plan.screens.find((s) => s.id === id)!;
  return { width: contentWidth(screen, theme, inventory), gapPx: gapOf(screen, theme, inventory) };
};
const message = (page: string) =>
  screenUserMessage(
    plan.screens.filter((s) => groupsOf(plan).get(page)?.includes(s.id)),
    catalog,
    plan.newComponents,
    measure,
  );

describe('the screen prompt', () => {
  it("fills the brief's voice and names every field of a layout it asks for", () => {
    const prompt = screenSystemPrompt(brief);
    filled(prompt);
    expect(prompt).toContain(brief.voice);
    for (const field of [
      'boxes',
      'parent',
      'order',
      'size',
      'share',
      'widthPx',
      'align',
      'instances',
      'places',
      'in',
      'height',
      'surface',
      'headingLevel',
      'slots',
    ])
      expect(prompt, field).toContain(`\`${field}\``);
  });

  it('gives a page with the dialogs it opens, their widths and gaps, and only the parts they are made of', () => {
    const shelf = message('S04');
    filled(shelf);
    expect(shelf).toContain('"id": "S05"');
    expect(shelf).not.toContain('"id": "S06"');
    expect(shelf).toContain(`"width": ${measure('S04').width}`);
    expect(shelf).toContain(`"gapPx": ${measure('S05').gapPx}`);
    expect(shelf).toContain('"id": "W06"');
    expect(shelf).not.toContain('"id": "W08"');
    expect(shelf).toContain('"name": "title"');
  });
});
