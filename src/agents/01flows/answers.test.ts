import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { terminalAsk } from './answers';
import type { Question } from './schema';

const root = mkdtempSync(path.join(tmpdir(), 'weave-flows-stage-'));

const idea = path.join(root, 'idea.md');

writeFileSync(idea, '<!-- test -->\n\nA reading list for one reader.\n');

afterAll(() => rmSync(root, { recursive: true, force: true }));

describe('terminalAsk', () => {
  const questions: Question[] = [
    {
      id: 'Q01',
      question: 'Ratings?',
      whyItMatters: 'Adds a field.',
      defaultAnswer: 'No ratings.',
      blocking: true,
    },
    {
      id: 'Q02',
      question: 'Dark mode?',
      whyItMatters: 'Looks.',
      defaultAnswer: 'Later.',
      blocking: false,
    },
    {
      id: 'Q03',
      question: 'Shared lists?',
      whyItMatters: 'Changes ownership.',
      defaultAnswer: 'No.',
      blocking: true,
    },
  ];

  it('asks only blocking, unanswered questions once; Enter keeps the default', async () => {
    const prompts: string[] = [];
    const typed = ['', 'Yes, one shared list'];
    const ask = terminalAsk(
      {},
      async (prompt) => (prompts.push(prompt), typed.shift() ?? ''),
      () => {},
    );

    expect(await ask({ questions })).toEqual({
      Q01: { question: 'Ratings?', answer: 'No ratings.' },
      Q03: { question: 'Shared lists?', answer: 'Yes, one shared list' },
    });
    expect(prompts).toHaveLength(2);
    expect(await ask({ questions })).toEqual({});
  });

  it('skips a question already answered in an earlier run, by its text', async () => {
    const ask = terminalAsk(
      { Q01: { question: 'Ratings?', answer: 'No.' } },
      async () => 'typed',
      () => {},
    );
    expect(await ask({ questions })).toEqual({
      Q03: { question: 'Shared lists?', answer: 'typed' },
    });
  });
});
