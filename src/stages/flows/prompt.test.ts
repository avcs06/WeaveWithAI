import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  answersBlock,
  catalogReviewGuide,
  catalogUserMessage,
  expandReviewGuide,
  expandUserMessage,
  flowsSystemPrompt,
  patchUserMessage,
  scopeReviewGuide,
  scopeSystemPrompt,
  scopeUserMessage,
} from './prompt';
import { Catalog, Flows, Scope } from './schema';

const load = (name: string): unknown =>
  JSON.parse(
    readFileSync(new URL(`./__fixtures__/${name}`, import.meta.url), 'utf8'),
  );
const scope = Scope.parse(load('reading-list.scope.json'));
const flows = Flows.parse(load('reading-list.flows.json'));
const catalog = Catalog.parse(load('reading-list.catalog.json'));

const standard = '## What a product manager decides for an MVP';

describe('system prompts', () => {
  it('scope: every placeholder filled, the standard and all three capability lists present', () => {
    const prompt = scopeSystemPrompt({});
    expect(prompt).not.toContain('{{');
    expect(prompt).not.toContain('<!--');
    expect(prompt).toContain(standard);
    expect(prompt).toContain(
      'accounts (email and password sign up, sign in, sign out)',
    );
    expect(prompt).toContain(
      'payments (payments): a checkout form validates its fields',
    );
    expect(prompt).toContain('maps (geolocation)');
    expect(prompt).toContain('None yet.');
  });

  it('flows: every placeholder filled, answers listed with their question, the example flow is the fixture book flow', () => {
    const prompt = flowsSystemPrompt({
      Q01: { question: 'Ratings?', answer: 'yes' },
    });
    expect(prompt).not.toContain('{{');
    expect(prompt).toContain(standard);
    expect(prompt).toContain('- Q01 "Ratings?": yes');
    expect(prompt).toContain('"id": "F03"');
    expect(prompt).toContain('"name": "Add a book to the reading list"');
    // The example carries the parts the flow uses, defined once.
    expect(prompt).toContain('"id": "FM01"');
    expect(prompt).toContain('"id": "FD05"');
    expect(prompt).toContain('accounts (');
    expect(prompt).toContain(
      'emailSending (notifications, password reset by email): the website shows the email as sent',
    );
    expect(prompt).toContain('i18n (translations)');
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
  it('carry the same standard as the prompts and say what to challenge', () => {
    for (const guide of [
      scopeReviewGuide(),
      catalogReviewGuide(),
      expandReviewGuide(),
    ]) {
      expect(guide).not.toContain('{{');
      expect(guide).not.toContain('<!--');
      expect(guide).toContain(standard);
      expect(guide).toContain('Challenge, and report as a blocker');
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

  it('catalog, expand and patch: each carries the idea and the scope, then its own job', () => {
    const cat = catalogUserMessage(idea, scope);
    expect(cat.startsWith('# Idea\n\nA reading list for one reader.')).toBe(
      true,
    );
    expect(cat).toMatch(
      /# Scope \(01-scope\.json\)\n\n```json\n\{\n\s+"app": \{\n\s+"name": "Shelf"/,
    );
    expect(cat).toContain('# Your job in this call: the catalog');
    expect(cat).not.toContain('{{');

    const expand = expandUserMessage(idea, scope, catalog, ['F03', 'F04']);
    expect(expand).toContain('# Catalog (01-flows-catalog.json)');
    expect(expand).toContain('Write the full flows F03, F04');
    expect(expand).not.toContain('{{');

    const patch = patchUserMessage(
      idea,
      scope,
      flows,
      '- FLOW-014 at flows: x',
      'None.',
    );
    expect(patch).toContain('# Current flows (01-flows-draft.json)');
    expect(patch).toContain('- FLOW-014 at flows: x');
    expect(patch).not.toContain('{{');
  });
});
