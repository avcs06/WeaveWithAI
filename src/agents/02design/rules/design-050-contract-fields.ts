import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { type Contract, RECORD_FIELDS } from '../../03contract/schema';
import type { Screens } from '../schema';

/**
 * DESIGN-050 · mandatory
 * Every value a node shows, on a screen, a shell or a new component, is a
 * field of the contract's entity for its noun, or a record field. The
 * contract runs beside the screen, invent, draw and frame calls,
 * so only the assembled design meets it: a draw or frame call's node goes
 * back to that call, and a component's node stays a known issue for the code
 * stages.
 * Pass: S06.n08 shows Book.author, a field of Book.
 * Fail: S06.n08 shows Book.blurb, which Book does not have.
 */

export type ContractFieldsInput = { screens: Screens; contract: Contract };

export const rule = defineRule<ContractFieldsInput>('DESIGN-050', 'mandatory', ({ screens, contract }, fail) => {
  const issues: Issue[] = [];
  const nouns = contract.entities.map((e) => e.noun).join(', ');
  for (const node of [...screens.nodes, ...screens.newComponents.flatMap((c) => c.nodes)])
    for (const entry of node.data) {
      const [noun = '', attribute = ''] = entry.split('.');
      const entity = contract.entities.find((e) => e.noun === noun);
      if (!entity)
        issues.push(fail(`${node.id} shows ${entry}, but the contract has no entity for ${noun}. Show a value of a noun the contract has: ${nouns}. Or take ${entry} out of the data of ${node.id}.`, node.id));
      else if (!(RECORD_FIELDS as readonly string[]).includes(attribute) && !entity.fields.some((f) => f.name === attribute)) {
        const fields = [...RECORD_FIELDS, ...entity.fields.map((f) => f.name)].join(', ');
        issues.push(fail(`${node.id} shows ${entry}, but the contract's ${entity.name} has no field ${attribute}. Its fields are ${fields}. Show the one that holds this value, as ${noun}.<field>, or take ${entry} out of the data of ${node.id}.`, node.id));
      }
    }
  return issues;
});
