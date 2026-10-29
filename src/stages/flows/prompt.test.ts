import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { answersBlock, flowsSystemPrompt, flowsUserMessage, scopeSystemPrompt, scopeUserMessage } from './prompt';
import { Scope } from './schema';

const scope = Scope.parse(JSON.parse(readFileSync(new URL('./__fixtures__/reading-list.scope.json', import.meta.url), 'utf8')));

describe('system prompts', () => {
  it('scope: every placeholder filled, all three capability lists present', () => {
    const prompt = scopeSystemPrompt({});
    expect(prompt).not.toContain('{{');
    expect(prompt).not.toContain('<!--');
    expect(prompt).toContain('accounts (email and password sign up, sign in, sign out)');
    expect(prompt).toContain('payments (payments): a checkout form validates its fields');
    expect(prompt).toContain('maps (geolocation)');
    expect(prompt).toContain('None yet.');
  });

  it('flows: every placeholder filled, answers listed, the example flow is the fixture book flow', () => {
    const prompt = flowsSystemPrompt({ Q01: 'yes' });
    expect(prompt).not.toContain('{{');
    expect(prompt).toContain('- Q01: yes');
    expect(prompt).toContain('"id": "F03"');
    expect(prompt).toContain('"name": "Add a book to the reading list"');
    expect(prompt).toContain('accounts (');
    expect(prompt).toContain('emailSending (notifications, password reset by email): the website shows the email as sent');
    expect(prompt).toContain('i18n (translations)');
  });

  it('answersBlock lists one answer per line', () => {
    expect(answersBlock({ Q01: 'yes', Q02: 'no' })).toBe('- Q01: yes\n- Q02: no');
  });
});

describe('user messages', () => {
  const idea = '<!-- Depth: medium. -->\n\nA reading list for one reader.\n';

  it('scope: carries the idea without its comments', () => {
    expect(scopeUserMessage(idea)).toBe('# Idea\n\nA reading list for one reader.');
  });

  it('flows: carries the idea and the scope JSON in a fenced block', () => {
    const message = flowsUserMessage(idea, scope);
    expect(message.startsWith('# Idea\n\nA reading list for one reader.')).toBe(true);
    expect(message).toMatch(/# Scope \(01-scope\.json\)\n\n```json\n\{\n\s+"app": \{\n\s+"name": "Shelf"/);
    expect(message.endsWith('```')).toBe(true);
  });
});
