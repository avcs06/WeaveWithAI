import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { catalog, flows, scope } from '../02design/__fixtures__/chain';
import { renderContract } from './render';
import { Contract } from './schema';

const contract = Contract.parse(
  JSON.parse(readFileSync(new URL('./__fixtures__/reading-list.contract.json', import.meta.url), 'utf8')),
);
const text = renderContract(contract, { scope, flows, widgets: catalog.widgets });

describe('the contract markdown', () => {
  it('reads as entities, enums, operations, then every widget', () => {
    expect(text).toMatchSnapshot();
  });

  it('says what covers each widget', () => {
    expect(text).toContain('| shelf | enum Shelf | yes |');
    expect(text).toContain('| createBook | create | Book | Adds a book to the reader\'s list. | FD03 Title as title, FD04 Author as author, FD05 Shelf as shelf | F03.S02, F03.A01, F03.A02 |');
    expect(text).toContain('- Shows a list of Book (Book.title, Book.author, Book.shelf), loaded by listBooks.');
    expect(text).toContain('- Asks for FD03 Title, which goes to createBook.');
    expect(text).toContain('- Asks for FD01 Email, which goes to the built-in sign in.');
    expect(text).toContain('- At F05.S02, deletes Book: deleteBook.');
    expect(text).toContain('- Part of STD01, which runs for F05.S02 (deleteBook).');
    expect(text).toContain('### W02 Why readers use Shelf (feature-grid)\n\n- Opens other screens or shows fixed content; it calls nothing.');
  });
});
