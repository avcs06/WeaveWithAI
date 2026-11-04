import { describe, expect, it } from 'vitest';
import { readTree } from './aria';

describe('readTree', () => {
  it('counts nodes, unnamed controls, landmarks, h1s and skipped heading levels, leaving text, properties and the dev overlay out', () => {
    const snapshot = [
      '- banner:',
      '  - link "SoloStudio":',
      '    - /url: /',
      '- main:',
      '  - heading "Clients" [level=1]',
      '  - text: Overdue first',
      '  - heading "Notes" [level=3]',
      '  - button',
      '  - textbox "Search clients"',
      '  - checkbox "Done" [checked]',
      '- button "Open Next.js Dev Tools"',
    ].join('\n');
    expect(readTree(snapshot)).toEqual({ nodes: 8, unnamedControls: ['button'], mains: 1, h1s: 1, skippedLevels: 1 });
  });

  it('reads a name with an escaped quote and a page with no headings', () => {
    expect(readTree('- main:\n  - link "Ravi \\"R\\" Patel"')).toEqual({ nodes: 2, unnamedControls: [], mains: 1, h1s: 0, skippedLevels: 0 });
  });
});
