import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { scopeReviewGuides, scopeSystemPrompt, scopeUserMessage } from '../01scope/prompts/index';
import { catalogReviewGuides, catalogUserMessage } from '../02catalog/prompts/index';
import { expandReviewGuides, expandUserMessage } from '../03expand/prompts/index';
import { answersBlock, flowsSystemPrompt } from './index';
import { Scope } from '../01scope/schema';
import { Catalog } from '../02catalog/schema';

const load = (name: string): unknown =>
  JSON.parse(
    readFileSync(new URL(`../__fixtures__/${name}`, import.meta.url), 'utf8'),
  );
const scope = Scope.parse(load('reading-list.scope.json'));
const catalog = Catalog.parse(load('reading-list.catalog.json'));

const standard = '## What a product manager decides for an MVP';

describe('system prompts', () => {
  it('scope: every placeholder filled, the standard and the kinds of app present', () => {
    const prompt = scopeSystemPrompt({});
    expect(prompt).not.toContain('{{');
    expect(prompt).not.toContain('<!--');
    expect(prompt).toContain(standard);
    expect(prompt).toContain('## Kinds of app and situations');
    expect(prompt).toMatch(/^- `tracker`: /m);
    expect(prompt).toContain('None yet.');
  });

  it('flows: every placeholder filled, answers listed with their question, the examples are the fixture add and delete flows', () => {
    const prompt = flowsSystemPrompt({
      Q01: { question: 'Ratings?', answer: 'yes' },
    });
    expect(prompt).not.toContain('{{');
    expect(prompt).toContain(standard);
    expect(prompt).toContain('- Q01 "Ratings?": yes');
    expect(prompt).toContain('"id": "F03"');
    expect(prompt).toContain('"name": "Add a book to the reading list"');
    // The delete flow shows its own confirm path.
    expect(prompt).toContain('"id": "F05"');
    expect(prompt).toContain('"kind": "confirm"');
    // The example carries the parts the flow uses, defined once.
    expect(prompt).toContain('"id": "FM01"');
    expect(prompt).toContain('"id": "FD05"');
  });

  it('answersBlock lists one answer per line, with the question as asked', () => {
    expect(
      answersBlock({
        Q01: { question: 'Ratings?', answer: 'yes' },
        Q02: { question: 'Shared lists?', answer: 'no' },
      }),
    ).toBe('- Q01 "Ratings?": yes\n- Q02 "Shared lists?": no');
  });
});

describe('review guides', () => {
  const pairs = [
    scopeReviewGuides(),
    catalogReviewGuides(),
    expandReviewGuides(),
  ];

  it('the peer carries the same standard as the prompts and says what to challenge', () => {
    for (const { peer } of pairs) {
      expect(peer).not.toContain('{{');
      expect(peer).not.toContain('<!--');
      expect(peer).toContain(standard);
      expect(peer).toContain('Challenge, and report as a blocker');
    }
  });

  it('the output reviewer looks for errors in meaning, not at the decisions', () => {
    for (const { output } of pairs) {
      expect(output).not.toContain('{{');
      expect(output).not.toContain('<!--');
      expect(output).not.toContain(standard);
      expect(output).toContain('no validator can catch');
    }
  });
});

describe('user messages', () => {
  const idea = '<!-- Depth: medium. -->\n\nA reading list for one reader.\n';

  it('scope: carries the idea without its comments', () => {
    expect(scopeUserMessage(idea)).toBe(
      '# Idea\n\nA reading list for one reader.',
    );
  });

  it('catalog and expand: each carries the idea and the scope, then its own job', () => {
    const cat = catalogUserMessage(idea, scope);
    expect(cat.startsWith('# Idea\n\nA reading list for one reader.')).toBe(
      true,
    );
    expect(cat).toMatch(
      /# Scope \(01-flows\/01-scope\.json\)\n\n```json\n\{\n\s+"app": \{\n\s+"name": "Shelf"/,
    );
    expect(cat).toContain('# Your job in this call: the catalog');
    expect(cat).toMatch(/# What users expect of this kind of app\n\n## .+\n\nMust have:\n- /);
    expect(cat).not.toContain('{{');

    const expand = expandUserMessage(idea, scope, catalog, ['F03']);
    expect(expand).toContain('# Catalog (01-flows/02-catalog.json)');
    expect(expand).toContain('expand these flows');
    expect(expand).toContain('- F03 Add a book to the reading list');
    expect(expand).not.toContain('{{');
  });
});
