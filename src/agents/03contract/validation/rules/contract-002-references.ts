import type { Issue } from '../../../../core/issues';
import { defineRule } from '../../../../core/rules';
import type { ContractInput } from '../helpers';

/**
 * CONTRACT-002 · mandatory
 * enum and ref fields and operation entities resolve.
 * Pass: shelf is enum Shelf, which exists.
 * Fail: shelf is enum Shelves.
 */
export const rule = defineRule<ContractInput>(
  'CONTRACT-002',
  'mandatory',
  ({ contract }, fail) => {
    const issues: Issue[] = [];
    const entities = new Set([...contract.entities.map((e) => e.name), 'User']);
    const enums = new Set(contract.enums.map((e) => e.name));
    for (const e of contract.entities)
      for (const f of e.fields) {
        if (f.kind === 'enum' && !enums.has(f.enum))
          issues.push(
            fail(
              `${e.name}.${f.name} is enum ${f.enum || '""'}, which is not declared.`,
              `${e.name}.${f.name}`,
            ),
          );
        if (f.kind === 'ref' && !entities.has(f.ref))
          issues.push(
            fail(
              `${e.name}.${f.name} refers to ${f.ref || '""'}, which is not an entity.`,
              `${e.name}.${f.name}`,
            ),
          );
      }
    for (const op of contract.operations)
      if (!entities.has(op.entity))
        issues.push(
          fail(`${op.id} acts on ${op.entity}, which is not an entity.`, op.id),
        );
    return issues;
  },
);
