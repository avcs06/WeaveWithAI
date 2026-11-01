import type { Issue } from '../../../../core/issues';
import { runRules } from '../../../../core/rules';
import type { Theme } from '../../01theme/build';
import { aloneChecks } from '../../06draw/validation/validation';
import type { ModelNode } from '../../06draw/schema';
import { componentRule as design041 } from '../../rules/design-041-widths-fit';
import { componentRule as design044 } from '../../rules/design-044-slots-drawn';
import type { Processed as Catalog } from '../../03catalog/process';
import type { DesignContext } from '../../rules/helpers';
import type { ComponentDesign } from '../schema';

// An invent call's checks: its root inside the width range catalog
// gave it, and the node rules and the layout rules on the component alone, at
// the narrowest and widest of that range. It stands as one node holding its nodes, as on a screen, so its
// padding is its own and not a section's.

const STACK = {
  direction: 'column',
  gap: '0',
  padding: '0',
  columns: 0,
  align: 'stretch',
  justify: 'start',
  wrap: false,
} as const;

export function validateComponent(
  name: string,
  design: ComponentDesign,
  range: Pick<Catalog['components'][number], 'minWidthPx' | 'maxWidthPx' | 'slots'>,
  kind: 'app' | 'marketing',
  ctx: DesignContext,
  theme: Theme,
): Issue[] {
  const root = `${name}.n00`;
  const { padding: _p, gap: _g, ...box } = design.box;
  const node: ModelNode = {
    id: root,
    parent: '',
    order: 1,
    what: `the ${name}`,
    newComponent: name,
    component: 'none',
    size: '',
    look: '',
    overrideReason: '',
    box: { ...box, span: 1 },
    layout: design.layout,
    typeScale: 'none',
    text: '',
    label: '',
    sample: '',
    slot: '',
    headingLevel: 0,
    role: 'container',
    field: '',
    data: [],
    flowSteps: [],
    states: ['default'],
    navigatesTo: '',
  };
  const self = {
    name,
    purpose: '',
    closestExisting: [],
    whyNotExisting: '',
    description: '',
    ...range,
    // The root's layout pads it, so its box adds no padding of its own around it.
    box: { ...design.box, padding: '0' },
    layout: design.layout,
    nodes: [],
    usedOn: [],
  };
  return [
    ...runRules([design041], { name, box: design.box, range }),
    ...runRules([design044], { name, nodes: design.nodes, slots: range.slots }),
    ...aloneChecks(
      name,
      [node, ...design.nodes.map((n) => (n.parent ? n : { ...n, parent: root }))],
      STACK,
      { kind, section: 'custom', components: [self] },
      [range.minWidthPx, range.maxWidthPx],
      ctx,
      theme,
    ),
  ];
}
