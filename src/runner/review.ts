import { z } from 'zod';
import type { Issue } from '../core/issues';
import { Reply } from './threads';

export const Blocker = z.object({
  at: z.string().describe('Where it is: an ID, a file or a JSON path in the output'),
  problem: z.string().describe('What is wrong, in one sentence'),
  fix: z.string().describe('What the output must say instead'),
});
export const Review = z.object({
  checked: z.array(z.string()).describe('The id of every guide point checked, such as P01'),
  blockers: z.array(Blocker),
  replies: z.array(Reply).describe('One answer for each thread you judged'),
});
export type Review = z.infer<typeof Review>;

/** The ids of a guide's points, in order: each point starts with one, as in `- P01: A flow that...`. */
export function guideIds(guide: string): string[] {
  return [...guide.matchAll(/^\s*- ([A-Z]\d{2}): /gm)].flatMap((match) => (match[1] ? [match[1]] : []));
}

export const REVIEW_RULE = 'REVIEW';

/** A blocker is a mandatory issue for the next fix, so the report and the fix-up message carry it unchanged. */
export function toIssues(review: Review): Issue[] {
  return review.blockers.map((blocker) => ({
    rule: REVIEW_RULE,
    severity: 'mandatory',
    message: `${blocker.problem} Fix: ${blocker.fix}`,
    at: blocker.at,
  }));
}
