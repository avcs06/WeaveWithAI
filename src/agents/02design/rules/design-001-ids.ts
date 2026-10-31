import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { duplicates } from '../../../core/rules';
import { type IaInput, type NodesInput, screenOf } from './helpers';

/**
 * DESIGN-001 · mandatory
 * Ids are unique and well formed (S01, S01.sec1, S01.n01, SH1.n01, and a
 * widget's W03.n01 in its own call); sections point at screens, nodes at
 * sections of their screen or regions of their shell, parents in the same
 * section; no cycles. A nodes call writes only nodes of the screen or shell
 * it fills, and at least one when it has parts.
 * Pass: S04.n06 in S04.sec1 under S04.n04.
 * Fail: S04.n06 renamed S04-n06.
 */
const SCREEN = /^S\d{2}$/;
const SECTION = /^S\d{2}\.sec\d+$/;
const NODE = /^(S\d{2}|SH\d+|W\d{2,})\.n\d{2,}$/;

export const iaRule = defineRule<IaInput>(
  'DESIGN-001',
  'mandatory',
  ({ ia }, fail) => {
    const issues: Issue[] = [];
    const screens = new Set(ia.screens.map((s) => s.id));
    for (const id of duplicates([...ia.screens, ...ia.sections], (x) => x.id))
      issues.push(
        fail(`${id} is used twice; every screen and section id is unique.`, id),
      );
    for (const screen of ia.screens)
      if (!SCREEN.test(screen.id))
        issues.push(fail(`Screen id ${screen.id} is not like S01.`, screen.id));
    for (const section of ia.sections) {
      if (!SECTION.test(section.id))
        issues.push(
          fail(`Section id ${section.id} is not like S01.sec1.`, section.id),
        );
      if (!screens.has(section.screen))
        issues.push(
          fail(
            `${section.id} points at ${section.screen}, which is not a screen.`,
            section.id,
          ),
        );
      else if (screenOf(section.id) !== section.screen)
        issues.push(
          fail(
            `${section.id} belongs to ${section.screen}; name it ${section.screen}.secN.`,
            section.id,
          ),
        );
    }
    return issues;
  },
);

export const nodesRule = defineRule<NodesInput>(
  'DESIGN-001',
  'mandatory',
  ({ nodes, ia, ctx, screen }, fail) => {
    const issues: Issue[] = [];
    const sections = new Map([
      ...ia.sections.map((s) => [s.id, s.screen] as const),
      ...ctx.shells.flatMap((shell) =>
        shell.regions.map((r) => [r.id, shell.id] as const),
      ),
    ]);
    const parts = [...sections.values()].filter((owner) => owner === screen);
    if (parts.length > 0 && nodes.length === 0)
      issues.push(
        fail(`${screen} has sections or regions to fill but no nodes.`, screen),
      );
    const byId = new Map(nodes.map((node) => [node.id, node]));
    for (const id of duplicates(nodes, (node) => node.id))
      issues.push(fail(`Node id ${id} is used twice.`, id));
    for (const node of nodes) {
      const owner = sections.get(node.section);
      if (!NODE.test(node.id))
        issues.push(
          fail(`Node id ${node.id} is not like S01.n01, SH1.n01 or W03.n01.`, node.id),
        );
      if (screenOf(node.id) !== screen)
        issues.push(
          fail(
            `${node.id} is not a node of ${screen}; this call fills ${screen} only.`,
            node.id,
          ),
        );
      if (!owner)
        issues.push(
          fail(
            `${node.id} points at ${node.section}, which is not a section or a shell region.`,
            node.id,
          ),
        );
      else if (screenOf(node.id) !== owner)
        issues.push(
          fail(
            `${node.id} sits in ${node.section} of ${owner}; a node belongs to a section of its own screen or a region of its own shell.`,
            node.id,
          ),
        );
      const parent = node.parent ? byId.get(node.parent) : undefined;
      if (node.parent && parent?.section !== node.section)
        issues.push(
          fail(
            `${node.id} has parent ${node.parent}, which is not a node of ${node.section}.`,
            node.id,
          ),
        );
      const seen = new Set([node.id]);
      for (let at = parent; at; at = byId.get(at.parent))
        if (seen.has(at.id)) {
          issues.push(
            fail(
              `${node.id} is its own ancestor through ${at.id}; parents form a tree.`,
              node.id,
            ),
          );
          break;
        } else seen.add(at.id);
    }
    return issues;
  },
);
