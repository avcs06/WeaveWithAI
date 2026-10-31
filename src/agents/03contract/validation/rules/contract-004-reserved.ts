import type { Issue } from '../../../../core/issues';
import { defineRule } from '../../../../core/rules';
import { RECORD_FIELDS } from '../../schema';
import type { ContractInput } from '../helpers';

/**
 * CONTRACT-004 · mandatory
 * No field named id, createdAt or updatedAt; no entity named User, which the
 * app builds in for signing up and in.
 * Pass: Book without them.
 * Fail: Book with a field createdAt.
 */
export const rule = defineRule<ContractInput>(
  'CONTRACT-004',
  'mandatory',
  ({ contract }, fail) => {
    const issues: Issue[] = [];
    const reserved = new Set<string>(RECORD_FIELDS);
    for (const e of contract.entities) {
      for (const f of e.fields)
        if (reserved.has(f.name))
          issues.push(
            fail(
              `${e.name}.${f.name} is a field every record gets; drop it.`,
              `${e.name}.${f.name}`,
            ),
          );
      if (e.name === 'User')
        issues.push(
          fail(
            'User is built in for signing up and in; name the entity after its vocabulary noun.',
            e.name,
          ),
        );
    }
    return issues;
  },
);
