import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import type { WidgetInput } from './helpers';

/**
 * DESIGN-032 · mandatory
 * A widget serves what the IA gave it with its own nodes: every step and
 * alternative it lists is on one of its nodes, every field it lists has an
 * input, and its nodes serve no step and edit no field the widget does not
 * list, so each screen's steps stay its widgets'.
 * Pass: the add-book form with an input for each of title, author and shelf.
 * Fail: the same form without the shelf's input.
 */
export const widgetRule = defineRule<WidgetInput>(
  'DESIGN-032',
  'mandatory',
  ({ build, widget }, fail) => {
    const issues: Issue[] = [];
    const onNodes = new Set(build.nodes.flatMap((node) => node.flowSteps));
    const inputs = new Set(
      build.nodes
        .filter((node) => node.role === 'input')
        .map((node) => node.field),
    );
    const unserved = widget.flowSteps.filter((id) => !onNodes.has(id));
    if (unserved.length)
      issues.push(
        fail(
          `${widget.id} serves ${unserved.join(', ')}, but none of its nodes lists ${unserved.length === 1 ? 'it' : 'them'}; put each on the node that handles it.`,
          widget.id,
        ),
      );
    const missing = widget.fields.filter((field) => !inputs.has(field));
    if (missing.length)
      issues.push(
        fail(
          `${widget.id} takes ${missing.join(', ')}, but no input edits ${missing.length === 1 ? 'it' : 'them'}; add an input with that field.`,
          widget.id,
        ),
      );
    for (const node of build.nodes) {
      const stray = node.flowSteps.filter(
        (id) => !widget.flowSteps.includes(id),
      );
      if (stray.length)
        issues.push(
          fail(
            `${node.id} serves ${stray.join(', ')}, which ${widget.id} does not; serve only the widget's steps.`,
            node.id,
          ),
        );
      if (node.field && !widget.fields.includes(node.field))
        issues.push(
          fail(
            `${node.id} edits ${node.field}, which ${widget.id} does not take.`,
            node.id,
          ),
        );
    }
    return issues;
  },
);
