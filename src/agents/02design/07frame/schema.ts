import { z } from 'zod';
import type { Inventory } from '../../../ds/inventory';
import { makeDrawSchemas } from '../06draw/schema';

/** A frame call's shapes: a shell's nodes, each in one of its regions, and how a screen's frame differs. */
export function makeFrameSchemas(inv: Inventory) {
  const { ModelNode } = makeDrawSchemas(inv);
  const FrameNode = ModelNode.extend({
    section: z.string().describe('The id of the region it sits in, such as SH1.r1'),
  });
  const Change = z.object({
    screen: z.string(),
    add: z
      .array(FrameNode)
      .describe('The nodes only this screen shows, with ids such as SH1.S04.n01'),
    remove: z
      .array(z.string())
      .describe('The ids of the default nodes this screen leaves out'),
  });
  const FrameBuild = z.object({
    screen: z.string().describe('The id of the shell, such as SH1'),
    nodes: z.array(FrameNode),
    changes: z
      .array(Change)
      .describe('One change for each screen whose frame differs. [] when no frame differs'),
  });

  return { FrameNode, FrameBuild };
}

type FrameSchemas = ReturnType<typeof makeFrameSchemas>;

export type FrameNode = z.infer<FrameSchemas['FrameNode']>;

export type FrameBuild = z.infer<FrameSchemas['FrameBuild']>;

/** A frame's keyed lists, for patch fixes. */
export const FRAME_KEYS = { nodes: 'id', changes: 'screen' };
