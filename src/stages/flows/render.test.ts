import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { renderFlows, renderScope } from './render';
import { Flows, Scope } from './schema';

const load = (name: string): unknown =>
  JSON.parse(
    readFileSync(new URL(`./__fixtures__/${name}`, import.meta.url), 'utf8'),
  );
const scope = Scope.parse(load('reading-list.scope.json'));
const flows = Flows.parse(load('reading-list.flows.json'));

describe('render', () => {
  it('scope reads as a short spec page', () => {
    expect(renderScope(scope)).toMatchSnapshot();
  });

  it('flows follow the spec sample: numbered steps, fields with rules, changes, other paths, outcome', () => {
    const text = renderFlows(flows, scope);
    expect(text).toContain('## F03 Add a book to the reading list');
    expect(text).toContain(
      'Reader · core · Goal: Remember a book to read later.',
    );
    expect(text).toContain(
      '   - Title (required, up to 200 characters), e.g. "The Left Hand of Darkness"',
    );
    expect(text).toContain('   Changes: creates Book.');
    expect(text).toContain(
      '- F03.A01 (from 2, invalid) The title is empty: The website marks the field and keeps what was typed. Back to 2.',
    );
    expect(text).toContain(
      '- F03.A03 (from 1, cancel) The reader cancels: Nothing is saved; the website shows the reading list as it was. Flow ends.',
    );
    expect(text).toMatchSnapshot();
  });
});
