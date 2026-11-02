import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { architecture, flows, scope } from '../02design/__fixtures__/chain';
import { renderContract } from './render';
import { Contract } from './schema';

const contract = Contract.parse(
  JSON.parse(readFileSync(new URL('./__fixtures__/reading-list.contract.json', import.meta.url), 'utf8')),
);
const text = renderContract(contract, { scope, flows, architecture });

describe('the contract markdown', () => {
  it('reads as entities, enums, operations, then what each screen loads', () => {
    expect(text).toMatchSnapshot();
  });

  it('says what each screen and dialog loads', () => {
    expect(text).toContain('| shelf | enum Shelf | yes |');
    expect(text).toContain('| createBook | create | Book | Adds a book to the reader\'s list. | FD03 Title as title, FD04 Author as author, FD05 Shelf as shelf | F03.S02, F03.A01, F03.A02 |');
    expect(text).toContain('- S04 Reading list: listBooks');
    expect(text).toContain('- S05 The book\'s title: getBook');
    expect(text).toContain('- D01 Add a book: none');
  });
});
