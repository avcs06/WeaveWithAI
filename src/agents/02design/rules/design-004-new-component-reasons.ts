import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import type { NewComponent } from '../schema';
import type { IaInput } from './helpers';

/**
 * DESIGN-004 · mandatory
 * A new component has a purpose, at least one closest design-system component,
 * a reason it is not one of them, an ARIA pattern and states; an interactive one lists its keys.
 * The IA declares the first three; the component's own call designs the rest (DS23).
 * Pass: TitleCover with all of them, ariaPattern none.
 * Fail: TitleCover without whyNotExisting.
 */
type Parts = (c: NewComponent) => string[];

const declared: Parts = (c) => [
  c.purpose.trim() ? '' : 'a purpose',
  c.closestExisting.length ? '' : 'a closest design-system component',
  c.whyNotExisting.trim() ? '' : 'why no design-system component fits',
];
const designed: Parts = (c) => [
  c.ariaPattern.trim() ? '' : 'an ARIA pattern ("none" if static)',
  c.states.length ? '' : 'its states',
  c.ariaPattern.trim() && c.ariaPattern !== 'none' && !c.keyboard.length
    ? 'its keyboard behavior'
    : '',
];

const check = (parts: Parts[]) =>
  defineRule<IaInput>('DESIGN-004', 'mandatory', ({ ia }, fail) => {
    const issues: Issue[] = [];
    for (const c of ia.newComponents) {
      const missing = parts.flatMap((part) => part(c)).filter(Boolean);
      if (missing.length)
        issues.push(
          fail(`New component ${c.name} needs ${missing.join(', ')}.`, c.name),
        );
    }
    return issues;
  });

export const rule = check([declared, designed]);
/** What the IA writes when it declares a component. */
export const declarationRule = check([declared]);
/** What a component call writes when it designs one. */
export const designRule = check([designed]);
