import { z } from 'zod';
import { type Issue, issueText } from '../core/issues';

// The reasoning threads of a stage: one per issue a fix takes, with what the
// fixer and each reviewer said about it, round by round. Pure.

export const Reply = z.object({
  id: z.string().describe('The thread, such as T01'),
  status: z
    .enum(['open', 'closed'])
    .describe('closed: it is fixed, or the reason given for leaving it holds. open: it is not fixed, or that reason does not hold'),
  reason: z.string().describe('Why, in one or two sentences'),
});
/** One answer about one thread. */
export type Reply = z.infer<typeof Reply>;

/** A reply as its thread keeps it: who gave it, `fix` or `review-<name>`, and in which round. */
export type Entry = Reply & { round: number; by: string };

/** One issue and what was said about it. `by` is `checks` for a validator's issue, or the reviewer that raised it. */
export type Thread = { id: string; issue: Issue; by: string; round: number; entries: Entry[] };

const id = (n: number) => `T${String(n).padStart(2, '0')}`;

/** A stage's threads, in the order they were opened. */
export function threadBook() {
  const threads: Thread[] = [];
  const open = (issue: Issue, by: string, round: number) => {
    const thread = { id: id(threads.length + 1), issue, by, round, entries: [] };
    threads.push(thread);
    return thread;
  };
  return {
    threads,
    /** The thread of each validator issue: an issue with the same text joins its thread, in this round and later ones. */
    checks(issues: Issue[], round: number): Thread[] {
      const found = issues.map(
        (issue) => threads.find((t) => t.by === 'checks' && issueText(t.issue) === issueText(issue)) ?? open(issue, 'checks', round),
      );
      return [...new Set(found)];
    },
    /** A new thread for each reviewer's blocker. */
    raise(blockers: { issue: Issue; by: string }[], round: number): void {
      for (const { issue, by } of blockers) open(issue, by, round);
    },
    /** Each reply joins its thread; a reply to a thread that does not exist is dropped. */
    reply(replies: Reply[], round: number, by: string): void {
      for (const reply of replies) threads.find((t) => t.id === reply.id)?.entries.push({ ...reply, round, by });
    },
    /** The reviewers' threads still open after `round`: raised in it, or answered open by one of its reviewers. */
    reviews(round: number): Thread[] {
      return threads.filter(
        (t) =>
          t.by !== 'checks' &&
          (t.round === round || t.entries.some((e) => e.round === round && e.by !== 'fix' && e.status === 'open')),
      );
    },
  };
}

/** A thread the fix of `round` closed; it goes to no reviewer. */
export const closedByFix = (thread: Thread, round: number) =>
  thread.entries.some((e) => e.round === round && e.by === 'fix' && e.status === 'closed');

/** A check's issue the fixer left with a reason; the next fix does not take it again. */
export const leftWithReason = (thread: Thread) => thread.entries.some((e) => e.by === 'fix' && e.status === 'open');

/** Each thread as `- T01: RULE at ID: message`, then what was said about it, one line per reply. */
export function formatThreads(threads: Thread[]): string {
  return threads
    .map((t) =>
      [`- ${t.id}: ${issueText(t.issue)}`, ...t.entries.map((e) => `  - round ${e.round}, ${e.by}, ${e.status}: ${e.reason}`)].join('\n'),
    )
    .join('\n');
}
