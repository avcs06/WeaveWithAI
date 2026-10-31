import { z } from 'zod';
import type { Inventory } from '../../../ds/inventory';
import { Copy } from '../03architect/schema';
import { makeDrawSchemas } from '../07draw/schema';

/** A frame call's shapes: a shell's nodes, each in one of its regions. */
export function makeFrameSchemas(inv: Inventory) {
  const { ModelNode } = makeDrawSchemas(inv);
  const FrameNode = ModelNode.extend({
    section: z.string().describe('The region it sits in, SH1.r1'),
  });
  const FrameBuild = z.object({
    screen: z.string().describe('The shell, SH1'),
    nodes: z.array(FrameNode),
    copy: z.array(Copy),
  });

  return { FrameNode, FrameBuild };
}

type FrameSchemas = ReturnType<typeof makeFrameSchemas>;

export type FrameNode = z.infer<FrameSchemas['FrameNode']>;

export type FrameBuild = z.infer<FrameSchemas['FrameBuild']>;
