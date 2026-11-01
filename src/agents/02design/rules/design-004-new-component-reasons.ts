import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import type { IaInput, PlanInput } from './helpers';

/**
 * DESIGN-004 · mandatory
 * A new component has a purpose, at least one closest design-system component,
 * a reason none of them fits, and a description of its content, purpose,
 * emphasis, feel and look. Design is only look: its keys and ARIA are the
 * coding stage's.
 * Pass: TitleCover with all four.
 * Fail: TitleCover without whyNotExisting.
 */
type Declared = {
  name: string;
  purpose: string;
  closestExisting: string[];
  whyNotExisting: string;
  description: string;
};

const missing = (c: Declared) =>
  [
    c.purpose.trim() ? '' : 'purpose',
    c.closestExisting.length ? '' : 'closestExisting',
    c.whyNotExisting.trim() ? '' : 'whyNotExisting',
    c.description.trim() ? '' : 'description',
  ].filter(Boolean);

const check = <I>(of: (input: I) => Declared[]) =>
  defineRule<I>('DESIGN-004', 'mandatory', (input, fail) => {
    const issues: Issue[] = [];
    for (const c of of(input)) {
      const lacks = missing(c);
      if (lacks.length)
        issues.push(fail(`New component ${c.name} leaves ${lacks.join(' and ')} empty. A new component fills all four fields: purpose, closestExisting with at least one closest design-system component, whyNotExisting with why none of them fits, and description with its content, purpose, emphasis, feel and look. Fill in ${lacks.join(' and ')} for ${c.name}.`, c.name));
    }
    return issues;
  });

export const rule = check<IaInput>(({ ia }) => ia.newComponents);
/** What the architect declares. */
export const planRule = check<PlanInput>(({ plan }) => plan.newComponents);
