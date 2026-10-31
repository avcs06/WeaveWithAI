import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { issue } from '../../../core/rules';
import { INTERACTIVE, type IaInput, type NodesInput } from './helpers';

/**
 * DESIGN-014 · mandatory (the softer limits are warnings)
 * At most 12 inputs in a section (8 to 12 warns: group or split); more than 7
 * controls in a section or 8 sections on a page warns.
 * Pass: a form of three fields.
 * Fail: a form of thirteen.
 */
export const iaRule = defineRule<IaInput>('DESIGN-014', 'mandatory', ({ ia }) =>
  ia.screens.flatMap((screen) => {
    const count = ia.sections.filter((s) => s.screen === screen.id).length;
    return screen.type === 'page' && count > 8
      ? [
          issue(
            'DESIGN-014',
            'warning',
            `${screen.id} has ${count} sections; more than 8 is a lot for one page, so split it.`,
            screen.id,
          ),
        ]
      : [];
  }),
);

export const nodesRule = defineRule<NodesInput>(
  'DESIGN-014',
  'mandatory',
  ({ nodes }, fail) => {
    const issues: Issue[] = [];
    for (const section of new Set(nodes.map((node) => node.section))) {
      const own = nodes.filter((node) => node.section === section);
      const inputs = own.filter((node) => node.role === 'input').length;
      const controls = own.filter((node) => INTERACTIVE.has(node.role)).length;
      if (inputs > 12)
        issues.push(
          fail(
            `${section} has ${inputs} inputs; at most 12 in a section, so split it.`,
            section,
          ),
        );
      else if (inputs >= 8)
        issues.push(
          issue(
            'DESIGN-014',
            'warning',
            `${section} has ${inputs} inputs; group them or split the section.`,
            section,
          ),
        );
      if (controls > 7)
        issues.push(
          issue(
            'DESIGN-014',
            'warning',
            `${section} has ${controls} controls; more than 7 at once is a lot.`,
            section,
          ),
        );
    }
    return issues;
  },
);
