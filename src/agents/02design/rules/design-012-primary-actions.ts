import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { issue } from '../../../core/rules';
import type { NodesInput } from './helpers';

/**
 * DESIGN-012 · mandatory (more than one on a screen is a warning)
 * At most one primary action per section.
 * Pass: Add book alone in the page header.
 * Fail: Sign out made primary beside it.
 */
export const rule = defineRule<NodesInput>(
  'DESIGN-012',
  'mandatory',
  ({ nodes, screen }, fail) => {
    const issues: Issue[] = [];
    const primary = nodes.filter((node) => node.role === 'primary-action');
    for (const section of new Set(primary.map((node) => node.section))) {
      const here = primary.filter((node) => node.section === section);
      if (here.length > 1)
        issues.push(
          fail(
            `${section} has ${here.length} primary actions (${here.map((n) => n.id).join(', ')}); keep one and make the others secondary.`,
            section,
          ),
        );
    }
    if (primary.length > 1 && issues.length === 0)
      issues.push(
        issue(
          'DESIGN-012',
          'warning',
          `${screen} has ${primary.length} primary actions; one screen has one main action.`,
          screen,
        ),
      );
    return issues;
  },
);
