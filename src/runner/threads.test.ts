import { describe, expect, it } from 'vitest';
import type { Issue } from '../core/issues';
import { formatThreads, leftWithReason, threadBook } from './threads';

const empty: Issue = { rule: 'DOC-001', severity: 'mandatory', message: 'title must not be empty', at: 'title' };
const long: Issue = { rule: 'DOC-002', severity: 'mandatory', message: 'title is long' };
const generic: Issue = { rule: 'REVIEW', severity: 'mandatory', message: 'Title is generic. Fix: Name the breed.', at: 'title' };

describe('reasoning threads', () => {
  it("merge a check's issue with the same text into one thread, in a round and across rounds", () => {
    const book = threadBook();
    const first = book.checks([empty, { ...empty }, long], 1);
    expect(first.map((t) => t.id)).toEqual(['T01', 'T02']);
    expect(book.checks([{ ...empty }], 2).map((t) => t.id)).toEqual(['T01']);
    expect(book.checks([{ ...empty, message: 'title is blank' }], 2).map((t) => t.id)).toEqual(['T03']);
  });

  it("leave a check's thread with a reason once the fixer answers it open, and not when it answers closed", () => {
    const book = threadBook();
    const [thread] = book.checks([empty], 1);
    book.reply([{ id: 'T01', status: 'closed', reason: 'Named it.' }], 2, 'fix');
    expect(leftWithReason(thread!)).toBe(false);
    book.reply([{ id: 'T01', status: 'open', reason: 'The user gave no title.' }], 3, 'fix');
    expect(leftWithReason(thread!)).toBe(true);
  });

  it("keep a reviewer's thread open when raised in the round or answered open in it, and close it on an accept or silence", () => {
    const book = threadBook();
    book.raise([{ issue: generic, by: 'review-output' }, { issue: long, by: 'review-peer' }], 1);
    expect(book.reviews(1).map((t) => t.id)).toEqual(['T01', 'T02']);
    book.reply(
      [
        { id: 'T01', status: 'open', reason: 'Cats is the breed the user named.' },
        { id: 'T02', status: 'closed', reason: 'Shortened it.' },
      ],
      2,
      'fix',
    );
    // The fixer's own answer keeps nothing open; only a reviewer's does.
    expect(book.reviews(2)).toEqual([]);
    book.reply([{ id: 'T01', status: 'open', reason: 'The user named Siamese.' }], 2, 'review-output');
    book.reply([{ id: 'T01', status: 'closed', reason: 'The reason holds.' }, { id: 'T09', status: 'open', reason: 'No such thread.' }], 2, 'review-peer');
    expect(book.reviews(2).map((t) => t.id)).toEqual(['T01']);
  });

  it('show each thread with what was said about it, one line per reply', () => {
    const book = threadBook();
    book.raise([{ issue: generic, by: 'review-output' }], 1);
    book.reply([{ id: 'T01', status: 'open', reason: 'Cats is the breed the user named.' }], 2, 'fix');
    expect(formatThreads(book.threads)).toBe(
      '- T01: REVIEW at title: Title is generic. Fix: Name the breed.\n  - round 2, fix, open: Cats is the breed the user named.',
    );
  });
});
