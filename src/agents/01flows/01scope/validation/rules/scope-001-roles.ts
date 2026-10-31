/**
 * SCOPE-001 · mandatory
 * 1 to 3 roles, each with its own camelCase id.
 * Pass: roles: [{ id: 'reader' }, { id: 'shopOwner' }]
 * Fail: roles: [] · { id: 'Reader' } · two roles with id 'reader'
 */
import type { Issue } from '../../../../../core/issues';
import { defineRule, duplicates, isCamel } from '../../../../../core/rules';
import type { Scope } from '../../schema';

export const rule = defineRule<Scope>(
  'SCOPE-001',
  'mandatory',
  (scope, fail) => {
    const issues: Issue[] = [];
    if (scope.roles.length < 1 || scope.roles.length > 3) {
      issues.push(
        fail(
          `${scope.roles.length} roles; an MVP has 1 to 3. Merge or drop roles until 1 to 3 remain.`,
          'roles',
        ),
      );
    }
    for (const id of duplicates(scope.roles, (role) => role.id)) {
      issues.push(
        fail(
          `Role id "${id}" appears more than once; give every role its own camelCase id.`,
          'roles',
        ),
      );
    }
    scope.roles.forEach((role, i) => {
      if (!isCamel(role.id)) {
        issues.push(
          fail(
            `Role id "${role.id}" is not camelCase; write it like "member" or "shopOwner".`,
            `roles[${i}].id`,
          ),
        );
      }
    });
    return issues;
  },
);
