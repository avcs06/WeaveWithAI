import type { Brief } from './01theme/schema';
import type { Theme } from './01theme/build';
import type { Layouts } from './01theme/schema';
import type { Processed as Plan } from './02architect/process';

// What the design calls after the plan are told about the app: the
// look, and the screens a node can open. A call gets what it builds from,
// not the whole flows.

export type Kind = keyof Layouts;

/** What the look of a call is: the brief's feel, the theme's defaults and each kind's content area. */
export const look = (brief: Brief, theme: Theme, kinds: Kind[]) => ({
  feel: brief.feel,
  personality: brief.personality,
  imagery: brief.imagery,
  defaults: theme.defaults,
  contentArea: Object.fromEntries(
    kinds.map((kind) => [kind, theme.layouts[kind].main]),
  ),
});

/** The screens a node can open. */
export const screenList = (plan: Plan) =>
  plan.screens.map(({ id, name, type, kind, route, parent, access }) => ({
    id,
    name,
    type,
    kind,
    route,
    parent,
    access,
  }));
