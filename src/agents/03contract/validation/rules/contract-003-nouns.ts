import type { Issue } from '../../../../core/issues';
import { defineRule } from '../../../../core/rules';
import type { ContractInput } from '../helpers';

/**
 * CONTRACT-003 · mandatory
 * Every entity implements a vocabulary noun, and every noun with effects in the flows has an entity.
 * Pass: Book implements Book.
 * Fail: Book implements Novel.
 */
export const rule = defineRule<ContractInput>(
  'CONTRACT-003',
  'mandatory',
  ({ contract, scope, flows }, fail) => {
    const issues: Issue[] = [];
    const nouns = new Set(scope.vocabulary.map((v) => v.noun));
    for (const e of contract.entities)
      if (!nouns.has(e.noun))
        issues.push(
          fail(
            `${e.name} implements ${e.noun}, which is not in the vocabulary (${[...nouns].join(', ')}).`,
            e.name,
          ),
        );
    const implemented = new Set(contract.entities.map((e) => e.noun));
    const affected = new Set(
      [...flows.flows, ...flows.subflows].flatMap((f) =>
        f.steps.flatMap((s) => s.effects.map((e) => e.noun)),
      ),
    );
    for (const noun of affected)
      if (!implemented.has(noun))
        issues.push(
          fail(
            `The flows change ${noun} but no entity implements it; add one.`,
            noun,
          ),
        );
    return issues;
  },
);
