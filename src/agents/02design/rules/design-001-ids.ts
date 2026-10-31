import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { duplicates } from '../../../core/rules';
import { type FrameInput, type IaInput, type NodesInput, type ScreenInput, screenOf } from './helpers';

/**
 * DESIGN-001 · mandatory
 * Ids are unique and well formed (S01, S01.sec1, S01.n01, SH1.n01, and in
 * their own calls a widget's W03.n01, a component's TitleCover.n01 and a
 * frame change's SH1.S04.n01); sections point at screens, nodes at
 * sections of their screen or regions of their shell, parents in the same
 * section; no cycles. A call writes only nodes of the screen or shell
 * it fills, and at least one when it has parts.
 * Pass: S04.n06 in S04.sec1 under S04.n04.
 * Fail: S04.n06 renamed S04-n06.
 */
const SCREEN = /^S\d{2}$/;
const SECTION = /^S\d{2}\.sec\d+$/;
const NODE = /^(S\d{2}|SH\d+(\.S\d{2})?|W\d{2,}|[A-Z][A-Za-z0-9]+)\.n\d{2,}$/;

export const iaRule = defineRule<IaInput>(
  'DESIGN-001',
  'mandatory',
  ({ ia }, fail) => {
    const issues: Issue[] = [];
    const screens = new Set(ia.screens.map((s) => s.id));
    for (const id of duplicates([...ia.screens, ...ia.sections], (x) => x.id))
      issues.push(
        fail(`The id ${id} is used more than once. Every screen and section id is unique. Keep ${id} on one of them, and give the others new ids.`, id),
      );
    for (const screen of ia.screens)
      if (!SCREEN.test(screen.id))
        issues.push(fail(`The screen id "${screen.id}" is not in the form S01. A screen id is S and two digits. Rename ${screen.id} in that form, with a number no other screen has.`, screen.id));
    for (const section of ia.sections) {
      if (!SECTION.test(section.id))
        issues.push(
          fail(`The section id "${section.id}" is not in the form S01.sec1. A section id is its screen's id, then .sec and a number. Rename ${section.id} in that form, with a number no other section of ${section.screen} has.`, section.id),
        );
      if (!screens.has(section.screen))
        issues.push(
          fail(
            `${section.id} has screen ${section.screen || '""'}, which is not a screen id. A section belongs to a screen. Set the screen of ${section.id} to the id of the screen it sits on.`,
            section.id,
          ),
        );
      else if (screenOf(section.id) !== section.screen)
        issues.push(
          fail(
            `${section.id} belongs to ${section.screen}, but its id does not start with ${section.screen}. A section id starts with the id of its screen. Rename ${section.id} to ${section.screen}.sec and a number no other section of ${section.screen} has.`,
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
        fail(`${screen} has sections or regions to fill, but the answer has no nodes. Anything with a section or region to fill has at least one node. Add the nodes of ${screen}.`, screen),
      );
    const byId = new Map(nodes.map((node) => [node.id, node]));
    for (const id of duplicates(nodes, (node) => node.id))
      issues.push(fail(`The node id ${id} is used more than once. Every node id is unique. Keep ${id} on one node, and give the others new ids.`, id));
    for (const node of nodes) {
      const owner = sections.get(node.section);
      if (!NODE.test(node.id))
        issues.push(
          fail(`The node id "${node.id}" is not in a node id form. A node id is the id of what it belongs to, then .n and two or more digits: S01.n01 on a screen, SH1.n01 in a shell, SH1.S04.n01 in a frame change, W03.n01 in a widget, TitleCover.n01 in a new component. Rename ${node.id} in that form, starting with ${screen}.`, node.id),
        );
      if (screenOf(node.id) !== screen)
        issues.push(
          fail(
            `${node.id} is not a node of ${screen}, which this call fills. A call writes only the nodes of what it fills. Give ${node.id} an id that starts with ${screen}, or drop it.`,
            node.id,
          ),
        );
      if (!owner)
        issues.push(
          fail(
            `${node.id} sits in ${node.section || '""'}, which is not a section or a shell region. A node sits in a section of its screen or a region of its shell. Set the section of ${node.id} to one of those.`,
            node.id,
          ),
        );
      else if (screenOf(node.id) !== owner)
        issues.push(
          fail(
            `${node.id} sits in ${node.section}, which belongs to ${owner}. A node sits in a section of its own screen or a region of its own shell. Move ${node.id} to a section or region of ${screenOf(node.id)}.`,
            node.id,
          ),
        );
      const parent = node.parent ? byId.get(node.parent) : undefined;
      if (node.parent && parent?.section !== node.section)
        issues.push(
          fail(
            `${node.id} has parent ${node.parent}, which is not a node of ${node.section}. A node's parent is a node in the same section. Set the parent of ${node.id} to a node of ${node.section}, or to "" for a top-level node.`,
            node.id,
          ),
        );
      const seen = new Set([node.id]);
      for (let at = parent; at; at = byId.get(at.parent))
        if (seen.has(at.id)) {
          issues.push(
            fail(
              `Following the parents up from ${node.id} reaches ${at.id} twice, so the parents form a loop. Parents form a tree, so following them up from any node ends at a top-level node. Change the parent of a node in the loop through ${at.id}.`,
              node.id,
            ),
          );
          break;
        } else seen.add(at.id);
    }
    return issues;
  },
);

/** A frame's changes: each for a page the frame frames, its nodes like SH1.S04.n01, and the nodes it removes among the shell's. */
export const frameRule = defineRule<FrameInput>(
  'DESIGN-001',
  'mandatory',
  ({ frame, plan, ctx }, fail) => {
    const issues: Issue[] = [];
    const kind = ctx.shells.find((s) => s.id === frame.screen)?.name;
    const pages = new Set(
      plan.screens.filter((s) => s.type === 'page' && s.framed && s.kind === kind).map((s) => s.id),
    );
    const defaults = new Set(frame.nodes.map((n) => n.id));
    for (const change of frame.changes) {
      if (!pages.has(change.screen))
        issues.push(fail(`A change of ${frame.screen} is for ${change.screen}, which is not a framed ${kind} page. A frame changes only the pages it frames: ${[...pages].join(', ') || 'none'}. Set the screen of this change to one of those, or drop the change.`, frame.screen));
      const prefix = `${frame.screen}.${change.screen}.n`;
      for (const node of change.add)
        if (!node.id.startsWith(prefix))
          issues.push(fail(`${node.id} is added for ${change.screen}, but its id does not start with ${prefix}. A node that a change adds has an id like ${prefix}01. Rename ${node.id} in that form.`, node.id));
      for (const id of change.remove)
        if (!defaults.has(id))
          issues.push(fail(`The change for ${change.screen} removes ${id}, which is not a node of ${frame.screen}. A change removes only nodes of its frame. Drop ${id} from remove, or name the node of ${frame.screen} you meant.`, id));
    }
    return issues;
  },
);

/** A screen layout's boxes like S04.b1 and instances like S04.p1, of its screen and each once. */
export const screenRule = defineRule<ScreenInput>(
  'DESIGN-001',
  'mandatory',
  ({ layout }, fail) => {
    const { screen } = layout;
    const box = new RegExp(`^${screen}\\.b\\d+$`);
    const instance = new RegExp(`^${screen}\\.p\\d+$`);
    return [
      ...duplicates([...layout.boxes, ...layout.instances], (x) => x.id).map((id) =>
        fail(`The id ${id} is used more than once in ${screen}. Every box and instance id is unique. Keep ${id} on one of them, and give the others new ids.`, id),
      ),
      ...layout.boxes.filter((b) => !box.test(b.id)).map((b) => fail(`The box id "${b.id}" is not in the form ${screen}.b1. A box id is its screen's id, then .b and a number. Rename ${b.id} in that form, and use the new id wherever ${b.id} is named.`, b.id)),
      ...layout.instances
        .filter((i) => !instance.test(i.id))
        .map((i) => fail(`The instance id "${i.id}" is not in the form ${screen}.p1. An instance id is its screen's id, then .p and a number. Rename ${i.id} in that form, and use the new id wherever ${i.id} is named.`, i.id)),
    ];
  },
);
