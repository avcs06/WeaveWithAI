import { describe, expect, it } from 'vitest';
import { flows, scope } from './__fixtures__/chain';
import { allowedWords, stem, traced, untracedItems, words } from './trace';

describe('tracing a later stage\'s words to the scope and flows', () => {
  const allowed = allowedWords(scope, flows);

  it('stems plurals and keeps singulars', () => {
    expect(['dashboards', 'entries', 'address', 'Shelf'].map(stem)).toEqual(['dashboard', 'entry', 'address', 'shelf']);
  });

  it('keeps content words only, split from camel case', () => {
    expect(words('the Shelf link')).toEqual(['shelf']);
    expect(words('Can open Help, which shows help information.')).toEqual(['help', 'help']);
    expect(words('TeamMember')).toEqual(['team', 'member']);
  });

  it('allows the app, its roles, records, flows, fields and forms, and what a frame always has', () => {
    for (const word of ['shelf', 'book', 'reader', 'search', 'browse', 'delete', 'wordmark', 'account', 'cancel'])
      expect(allowed.has(word), word).toBe(true);
    for (const word of ['help', 'cart', 'settings', 'notification']) expect(allowed.has(word), word).toBe(false);
  });

  it('passes a text that names something allowed, or nothing at all, and fails one that names only its own things', () => {
    expect(traced('Can choose Sign in, which goes to /sign-in, or Get started, which goes to /sign-up.', allowed)).toBe(true);
    expect(traced('Create button', allowed)).toBe(true);
    expect(traced('Can open Help, which shows help information.', allowed)).toBe(false);
  });

  it('names the untraced items of a slot', () => {
    expect(untracedItems('Wordmark, Create button, Help and the shelf', allowed)).toEqual(['Help']);
    expect(untracedItems('Search, Product links', allowed)).toEqual(['Product links']);
    expect(untracedItems('', allowed)).toEqual([]);
  });
});
