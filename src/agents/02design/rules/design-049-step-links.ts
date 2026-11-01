import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { ACTIONS, type WidgetInput } from './helpers';

/**
 * DESIGN-049 · mandatory
 * When the flow of a step goes on at a step only another screen lists, the
 * control that does the step opens that screen, so no page of a flow is left
 * with no way in. The draw stage passes the leads; DESIGN-017 at
 * assemble is the net.
 * Pass: the shelf header's Add book action, serving F03.S01, opens S05.
 * Fail: the same action with navigatesTo "".
 */
export const widgetRule = defineRule<WidgetInput>(
  'DESIGN-049',
  'mandatory',
  ({ build, widget, leads }, fail) => {
    const issues: Issue[] = [];
    for (const { step, next, screens } of leads) {
      const serving = build.nodes.filter((n) => n.flowSteps.includes(step));
      if (serving.some((n) => screens.some((s) => s.id === n.navigatesTo))) continue;
      const controls = serving.filter((n) => ACTIONS.has(n.role) || n.role === 'navigation');
      const control = controls.length === 1 ? controls[0] : undefined;
      const where = screens.map((s) => `${s.id} ${s.name}`).join(' or ');
      const ids = screens.map((s) => s.id).join(' or ');
      issues.push(
        fail(
          `${widget.id} serves ${step}, and the flow goes on at ${next} on ${where}. The control that does ${step} opens that screen. Set navigatesTo of ${control?.id ?? `the control that does ${step}`} to ${ids}.`,
          control?.id ?? widget.id,
        ),
      );
    }
    return issues;
  },
);
