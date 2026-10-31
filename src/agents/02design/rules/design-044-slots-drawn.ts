import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import type { WidgetInput } from './helpers';

/**
 * DESIGN-044 · mandatory
 * A widget draws its definition's slots and components (DS23): each slot is
 * one node naming it, a words slot's node has no words of its own, and a
 * parts slot's node is a container with nothing inside; no node names a slot
 * the definition lacks. A node is a new component only when the widget holds
 * it, and each component it holds is drawn. Assembly fills slots by name.
 * Pass: the shelf header's title heading naming the title slot, with no text.
 * Fail: the same heading with "Your shelf" written in and no slot.
 */
export const rule = defineRule<WidgetInput>(
  'DESIGN-044',
  'mandatory',
  ({ build, widget }, fail) => {
    const issues: Issue[] = [];
    const slots = new Map(widget.slots.map((s) => [s.name, s]));
    for (const slot of widget.slots) {
      const nodes = build.nodes.filter((n) => n.slot === slot.name);
      if (nodes.length !== 1)
        issues.push(fail(`${widget.id} has ${nodes.length} nodes with slot ${slot.name}. Each slot of a widget is drawn as exactly one node that names it. ${nodes.length ? `Keep slot ${slot.name} on one node, and set slot "" on the others.` : `Add one node with slot ${slot.name}.`}`, widget.id));
    }
    for (const node of build.nodes) {
      if (node.newComponent && !widget.newComponents.includes(node.newComponent))
        issues.push(fail(`${node.id} is a ${node.newComponent}, but ${widget.id} does not hold ${node.newComponent}. A node is a new component only when its widget holds that component. ${widget.newComponents.length ? `${widget.id} holds ${widget.newComponents.join(', ')}. Set the newComponent of ${node.id} to one of those, or set it to "" and use a design-system component.` : `${widget.id} holds no new component. Set the newComponent of ${node.id} to "", and use a design-system component.`}`, node.id));
      if (!node.slot) continue;
      const slot = slots.get(node.slot);
      if (!slot) issues.push(fail(`${node.id} names the slot ${node.slot}, which ${widget.id} does not have. A node names only a slot of its widget. The slots of ${widget.id} are ${widget.slots.map((s) => s.name).join(', ') || 'none'}. Set the slot of ${node.id} to one of those, or to "".`, node.id));
      else if (slot.kind === 'words' && node.text)
        issues.push(fail(`${node.id} stands for the words slot ${slot.name}, but it has the text "${node.text}". Each instance writes the words of a words slot, so its node has no words of its own. Give ${node.id} text "".`, node.id));
      else if (slot.kind === 'parts' && build.nodes.some((n) => n.parent === node.id))
        issues.push(fail(`${node.id} stands for the parts slot ${slot.name}, but ${build.nodes.filter((n) => n.parent === node.id).map((n) => n.id).join(', ')} sit inside it. Instances fill a parts slot, so its node is an empty container. Move those nodes out of ${node.id}, or drop them.`, node.id));
    }
    for (const name of widget.newComponents)
      if (!build.nodes.some((n) => n.newComponent === name))
        issues.push(fail(`${widget.id} holds ${name}, but none of its nodes is a ${name}. Every component a widget holds is drawn. Add a node with newComponent ${name}.`, widget.id));
    return issues;
  },
);
