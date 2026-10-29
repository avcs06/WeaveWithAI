import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { renderCatalog, renderFlows, renderScope } from './render';
import { Catalog, Flows, Scope } from './schema';

const load = (name: string): unknown =>
  JSON.parse(
    readFileSync(new URL(`./__fixtures__/${name}`, import.meta.url), 'utf8'),
  );
const scope = Scope.parse(load('reading-list.scope.json'));
const flows = Flows.parse(load('reading-list.flows.json'));
const catalog = Catalog.parse(load('reading-list.catalog.json'));

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
    expect(text).toContain(
      '2. The reader fills in the book and saves it. (Book form)',
    );
    expect(text).toContain(
      '2. The reader chooses Delete on the book. Confirm deletion (subflow STD01):',
    );
    expect(text).toContain('## Fields');
    expect(text).toMatchSnapshot();
  });

  it('a choice from records names the records it offers', () => {
    const fromShelves = structuredClone(flows);
    const shelf = fromShelves.fields.find((field) => field.id === 'FD05');
    if (!shelf) throw new Error('fixture changed');
    shelf.options = [];
    shelf.optionsFrom = 'Shelf';
    expect(renderFlows(fromShelves, scope)).toContain('one of the Shelf records');
  });

  it('a multi-choice says any of', () => {
    const multi = structuredClone(flows);
    const shelf = multi.fields.find((field) => field.id === 'FD05');
    if (!shelf) throw new Error('fixture changed');
    shelf.type = 'multiChoice';
    expect(renderFlows(multi, scope)).toContain(
      'any of: To read, Reading, Finished',
    );
  });

  it('catalog lists every flow with its description and the reusable parts', () => {
    const text = renderCatalog(catalog, scope);
    expect(text).toContain(
      '- F03 Add a book to the reading list (Reader, core): The reader adds a book',
    );
    expect(text).toContain('- FM01 Book form: FD03, FD04, FD05');
    expect(text).toContain('## STD01 Confirm deletion (standard subflow)');
    expect(text).toMatchSnapshot();
  });
});
