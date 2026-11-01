import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import type { FrameInput, WidgetInput } from './helpers';

/**
 * DESIGN-032 · mandatory
 * A widget serves what the catalog gave it with its own nodes: every step and
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
          `${widget.id} serves ${unserved.join(', ')}, but none of its nodes has ${unserved.length === 1 ? 'it' : 'them'} in its flowSteps. Every step and alternative a widget serves is on one of its nodes. Add each to the flowSteps of the node that handles it.`,
          widget.id,
        ),
      );
    const missing = widget.fields.filter((field) => !inputs.has(field));
    if (missing.length)
      issues.push(
        fail(
          `${widget.id} takes ${missing.join(', ')}, but no input of ${widget.id} edits ${missing.length === 1 ? 'it' : 'them'}. Every field a widget takes has an input. Add an input with field ${missing.join(' and one with field ')}.`,
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
            `${node.id} serves ${stray.join(', ')}, which ${widget.id} does not serve. A widget's nodes serve only the widget's steps: ${widget.flowSteps.join(', ') || 'none'}. Remove ${stray.join(', ')} from the flowSteps of ${node.id}.`,
            node.id,
          ),
        );
      if (node.field && !widget.fields.includes(node.field))
        issues.push(
          fail(
            `${node.id} edits ${node.field}, which ${widget.id} does not take. A widget's nodes edit only the widget's fields: ${widget.fields.join(', ') || 'none'}. Set the field of ${node.id} to one of those, or to "".`,
            node.id,
          ),
        );
    }
    return issues;
  },
);

/** A frame serves the steps catalog gave it, each on one of its nodes. */
export const frameRule = defineRule<FrameInput>(
  'DESIGN-032',
  'mandatory',
  ({ frame, frameSteps }, fail) => {
    const onNodes = new Set(
      [...frame.nodes, ...frame.changes.flatMap((c) => c.add)].flatMap((n) => n.flowSteps),
    );
    const unserved = frameSteps.filter((id) => !onNodes.has(id));
    return unserved.length
      ? [fail(`The frame ${frame.screen} serves ${unserved.join(', ')}, but none of its nodes has ${unserved.length === 1 ? 'it' : 'them'} in its flowSteps. Every step a frame serves is on one of its nodes. Add each to the flowSteps of the control that handles it.`, frame.screen)]
      : [];
  },
);
