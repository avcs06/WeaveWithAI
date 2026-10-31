import { z } from 'zod';
import type { Inventory } from '../../../ds/inventory';
import { Copy } from '../03architect/schema';
import { EDGES } from '../config';
import { makeScreensSchema } from '../schema';
import { boxSchemas } from '../schema-boxes';

/** A widget call's shapes: each widget's nodes, edge, root layout and added copy. */
export function makeDrawSchemas(inv: Inventory) {
  const { Node } = makeScreensSchema(inv);
  const { Layout } = boxSchemas(inv);

  // A node as a widget or frame call writes it: copy ids for its text and label, and a sample for a value it shows.
  const ModelNode = Node.omit({ section: true }).extend({
    text: z.string().describe('Copy id of its visible text; ""'),
    label: z
      .string()
      .describe(
        'Copy id of its accessible name for an icon-only or ambiguous control; ""',
      ),
    sample: z
      .string()
      .describe(
        'A realistic value for the record value it shows or its copy\'s {Noun.attribute} slot, e.g. "The Left Hand of Darkness"; ""',
      ),
  });
  const Build = z.object({
    widget: z.string(),
    edge: z
      .enum(EDGES)
      .describe(
        'Its outer edge: bordered, a tinted surface, bare text, or a full-width band',
      ),
    layout: Layout.describe(
      'How its top-level nodes are arranged, with its padding',
    ),
    nodes: z.array(ModelNode),
    copy: z
      .array(Copy)
      .describe('Strings it needs that the deck lacks, ids like W03.c1; []'),
  });
  const WidgetBatch = z.object({ widgets: z.array(Build) });

  return { ModelNode, Build, WidgetBatch };
}

type DrawSchemas = ReturnType<typeof makeDrawSchemas>;

export type ModelNode = z.infer<DrawSchemas['ModelNode']>;

export type Build = z.infer<DrawSchemas['Build']>;

export type WidgetBatch = z.infer<DrawSchemas['WidgetBatch']>;
