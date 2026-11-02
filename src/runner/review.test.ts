import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { guideIds } from './review';

const agents = fileURLToPath(new URL('../agents/', import.meta.url));
const LETTER: Record<string, string> = { peer: 'P', output: 'O', code: 'C', adherence: 'A' };
const guides = readdirSync(agents, { recursive: true, encoding: 'utf8' }).filter((file) =>
  /prompts\/review-(peer|output|code|adherence)\.md$/.test(file),
);

describe('guideIds', () => {
  it('reads the ids of the points in order, nested ones included, and skips bullets without one', () => {
    expect(guideIds('- P01: One.\n- Leave to the validators.\n  - P02: Two.\nP03: not a bullet.\n- P04: Four.')).toEqual([
      'P01',
      'P02',
      'P04',
    ]);
  });
});

describe('the review guides', () => {
  it('are found', () => {
    expect(guides.length).toBeGreaterThan(0);
  });

  it.each(guides)("%s numbers its points from 01, in order, with its reviewer's letter", (file) => {
    const letter = LETTER[file.match(/review-(\w+)\.md$/)?.[1] ?? ''];
    const ids = guideIds(readFileSync(path.join(agents, file), 'utf8'));
    expect(ids.length).toBeGreaterThan(0);
    expect(ids).toEqual(ids.map((_, i) => `${letter}${String(i + 1).padStart(2, '0')}`));
  });
});
