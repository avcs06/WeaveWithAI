import { z } from 'zod';
import type { Issue } from './issues';

export const Blocker = z.object({
  at: z.string().describe('an ID or JSON path in the output'),
  problem: z.string().describe('what is wrong, in one sentence'),
  fix: z.string().describe('what the corrected output must say instead'),
});
export const Review = z.object({ blockers: z.array(Blocker) });
export type Review = z.infer<typeof Review>;

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
