import { z } from 'zod';
import type { Inventory } from '../../../ds/inventory';
import { EDGES } from '../config';
import { makeScreensSchema } from '../schema';
import { boxSchemas } from '../schema-boxes';

/** A draw call's shapes: a widget's nodes, edge and root layout, its words inline (DS23). */
export function makeDrawSchemas(inv: Inventory) {
  const { Node } = makeScreensSchema(inv);
  const { Layout } = boxSchemas(inv);

  // A node as a draw, frame or invent call writes it: its words, a sample for a value it shows, and the slot it stands for.
  const ModelNode = Node.omit({ section: true }).extend({
    text: z
      .string()
      .describe('The words it shows, the same on every instance, such as "Add book". "" when a slot or a record\'s value fills it'),
    label: z
      .string()
      .describe('Its accessible name, for an icon-only or ambiguous control. "" otherwise'),
    sample: z
      .string()
      .describe(
        'The whole line as it shows, with realistic values for the record values in it. Such as "Remove “Dune” for good?" or "9:30 AM · Design review with Maya Shah". "" when it shows only fixed words',
      ),
    slot: z
      .string()
      .describe(
        'The name of the slot it stands for. A words slot, such as title, shows the words each instance writes. A parts slot, such as body, holds instances. "" otherwise',
      ),
    headingLevel: z
      .number()
      .int()
      .describe(
        "1 for the widget's top heading, which takes the level of its instance. 2 for a heading under it, and so on. 0 for a node that is not a heading",
      ),
  });
  const Build = z.object({
    widget: z.string(),
    edge: z
      .enum(EDGES)
      .describe(
        'Its outer edge. bordered: a box with a border. surface: a tinted background. text: bare text. band: a full-width band',
      ),
    layout: Layout.describe('How its top-level nodes are arranged, with its padding'),
    nodes: z.array(ModelNode),
  });

  return { ModelNode, Build };
}

type DrawSchemas = ReturnType<typeof makeDrawSchemas>;

export type ModelNode = z.infer<DrawSchemas['ModelNode']>;

export type Build = z.infer<DrawSchemas['Build']>;

/** A build's keyed list, for patch fixes (F16): a fix sends only the nodes that change. */
export const BUILD_KEYS = { nodes: 'id' };
