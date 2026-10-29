import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { fillPrompt, loadPrompt } from './prompt';

const dir = mkdtempSync(path.join(tmpdir(), 'weave-prompt-'));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe('loadPrompt', () => {
  it('strips HTML comments, including multi-line ones, and trims', () => {
    const file = path.join(dir, 'p.md');
    writeFileSync(file, '<!-- note for us -->\nHello {{name}}.\n<!-- multi\nline -->\nBye.\n');
    expect(loadPrompt(file)).toBe('Hello {{name}}.\n\nBye.');
  });
});

describe('fillPrompt', () => {
  it('fills every placeholder, repeated ones included', () => {
    expect(fillPrompt('{{a}} and {{b}}, again {{a}}', { a: 'x', b: 'y' })).toBe('x and y, again x');
  });

  it('throws naming the placeholders left without a value', () => {
    expect(() => fillPrompt('{{a}} {{b}} {{c}}', { a: 'x' })).toThrow('Prompt is missing values for: b, c');
  });

  it('throws naming the values no placeholder uses', () => {
    expect(() => fillPrompt('{{a}}', { a: 'x', extra: 'y' })).toThrow('Prompt has no placeholder for: extra');
  });
});
