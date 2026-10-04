import type { ClassRule } from '../../classname-adapter.js';

/** Classes the policy forbids outright, in favour of its compound utilities. */
export const forbiddenClass: ClassRule = (className, { policy }) =>
  policy.forbiddenClasses?.has(className.replace(/^!/, ''))
    ? { rule: 'restricted-class', message: `"${className}" is prohibited. Use an approved compound flex utility instead.` }
    : undefined;
