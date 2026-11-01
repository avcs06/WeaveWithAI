import type { Flows } from '../../01flows/schema';
import type { STATES } from '../config';
import { requiredStates, stepFields, steps } from '../rules/helpers';
import type { Catalog, CatalogWidget } from './schema';

// What follows from the catalog's definitions: a widget's
// fields and required states from the steps it serves, and its minimum width
// added up from its coarse layout, so the model copies nothing and sums nothing.

type State = (typeof STATES)[number];

/** A widget with its fields, every state it shows, and its minimum width. */
export type Defined = CatalogWidget & {
  fields: string[];
  states: State[];
  minWidthPx: number;
};

export type Processed = Omit<Catalog, 'widgets'> & { widgets: Defined[] };

/** The widest row of parts and gaps, inside its padding on both sides. */
export function minWidth(
  layout: CatalogWidget['layout'],
  px: (key: string) => number,
): number {
  const gap = px(layout.gap);
  const rows = new Map<number, number[]>();
  for (const part of layout.parts) rows.set(part.row, [...(rows.get(part.row) ?? []), part.minWidthPx]);
  const widths = [...rows.values()].map(
    (parts) => parts.reduce((sum, w) => sum + w, 0) + gap * Math.max(0, parts.length - 1),
  );
  return Math.max(0, ...widths) + 2 * px(layout.padding);
}

export function processCatalog(
  catalog: Catalog,
  flows: Flows,
  px: (key: string) => number,
): Processed {
  const byStep = new Map(steps(flows).map((step) => [step.id, step]));
  return {
    ...catalog,
    widgets: catalog.widgets.map((widget) => ({
      ...widget,
      fields: [
        ...new Set(
          widget.flowSteps.flatMap((id) => {
            const step = byStep.get(id);
            return step?.kind === 'user' ? stepFields(flows, step) : [];
          }),
        ),
      ],
      states: [
        ...new Set([...requiredStates(widget.flowSteps, flows), ...widget.states]),
      ],
      minWidthPx: minWidth(widget.layout, px),
    })),
  };
}
