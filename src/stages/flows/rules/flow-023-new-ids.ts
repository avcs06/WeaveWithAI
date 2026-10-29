/**
 * FLOW-023 · mandatory
 * Assumptions and questions the flows add continue the scope's numbering and never reuse an id.
 * Pass: scope has A01 and A02; flows assumptions: [{ id: 'A03' }]
 * Fail: flows { id: 'A02' } · { id: 'A1' }
 */
import type { Issue } from '../../../core/issues';
import { defineRule, duplicates } from '../../../core/rules';
import { type FlowInput, idNumber } from './helpers';
import { ASSUMPTION_ID, QUESTION_ID } from './scope-005-ids';

export const rule = defineRule<FlowInput>('FLOW-023', 'mandatory', ({ flows, scope }, fail) => {
  const issues: Issue[] = [];
  for (const [fresh, existing, pattern, path] of [
    [flows.assumptions, scope.assumptions, ASSUMPTION_ID, 'assumptions'],
    [flows.questions, scope.questions, QUESTION_ID, 'questions'],
  ] as const) {
    const highest = Math.max(0, ...existing.filter((item) => pattern.test(item.id)).map((item) => idNumber(item.id)));
    const next = `${path === 'assumptions' ? 'A' : 'Q'}${String(highest + 1).padStart(2, '0')}`;
    fresh.forEach((item, i) => {
      if (!pattern.test(item.id)) {
        issues.push(fail(`New ${path} id "${item.id}" is malformed; continue the scope's numbering from ${next}.`, `${path}[${i}].id`));
      } else if (idNumber(item.id) <= highest) {
        issues.push(fail(`New ${path} id "${item.id}" clashes with the scope's numbering; continue from ${next}.`, `${path}[${i}].id`));
      }
    });
    for (const id of duplicates([...existing, ...fresh], (item) => item.id)) {
      if (fresh.some((item) => item.id === id)) {
        issues.push(fail(`Id "${id}" is used more than once across scope and flows ${path}; renumber the new ones from ${next}.`, path));
      }
    }
  }
  return issues;
});
