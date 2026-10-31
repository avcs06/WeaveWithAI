import type { Issue } from '../../../core/issues';
import type { WidgetScreens } from './assemble';
import { screenOf } from '../rules/helpers';

// Where an issue found on the assembled design goes back to (DS23): the widget
// call that built the node or widget it names, or the frame call of the shell
// it sits in. The IA is never rerun, and a region's box is the theme's, so an
// issue on a screen, a region or the plan is recorded as known.

const NODE = /^(S\d{2}|SH\d+)\.n\d+$/;
const SECTION = /^S\d{2}\.sec\d+$/;
const REGION = /^SH\d+\.r\d+$/;

/** The widgets and shells whose calls fix an issue; [] when only the IA or the theme could. */
export function ownersOf(issue: Issue, screens: WidgetScreens): string[] {
  const at = issue.at ?? '';
  const widgetOf = (section: string) =>
    screens.placements.find((p) => p.id === section)?.widget;
  const listing = (has: (w: WidgetScreens['widgets'][number]) => boolean) =>
    screens.widgets.filter(has).map((w) => w.id);
  switch (issue.rule) {
    // A step without its control or a field without its input: the widgets serving the step place them.
    case 'DESIGN-008':
    case 'DESIGN-010':
      return listing((w) => w.flowSteps.includes(at));
    // A declared component no node is: the widgets meant to use it.
    case 'DESIGN-003':
      return listing((w) => w.newComponents.includes(at));
    // A navigation item is drawn by a frame; which one shows to its users is not known from the item alone.
    case 'DESIGN-025':
      return [...new Set(screens.screens.map((s) => s.shell).filter(Boolean))];
  }
  if (NODE.test(at)) {
    const section = screens.nodes.find((node) => node.id === at)?.section ?? '';
    return [widgetOf(section) ?? screenOf(section)].filter(Boolean);
  }
  if (SECTION.test(at)) return [widgetOf(at) ?? ''].filter(Boolean);
  if (REGION.test(at) && issue.rule === 'DESIGN-024') return [screenOf(at)];
  return [];
}

/**
 * An issue in the terms of the call that owns it: each screen node id becomes
 * the id the call wrote, followed by where it showed, and a section id the
 * widget's; a frame keeps its own ids.
 */
export function inCallTerms(
  issue: Issue,
  screens: WidgetScreens,
  origin: Map<string, string>,
): Issue {
  const widget = (section: string) =>
    screens.placements.find((p) => p.id === section)?.widget ?? section;
  const rename = (id: string) =>
    origin.has(id)
      ? `${origin.get(id)} (as ${id})`
      : SECTION.test(id)
        ? `${widget(id)} (as ${id})`
        : id;
  const at =
    issue.at &&
    (origin.get(issue.at) ??
      (SECTION.test(issue.at) ? widget(issue.at) : issue.at));
  const message = issue.message.replace(/\bS\d{2}\.(?:n\d+|sec\d+)\b/g, rename);
  return at === undefined ? { ...issue, message } : { ...issue, message, at };
}

/** Mandatory issues by the widget or shell whose call fixes them, and the rest, which stay known. */
export function routeIssues(
  issues: Issue[],
  screens: WidgetScreens,
  origin: Map<string, string>,
): { calls: Map<string, Issue[]>; known: Issue[] } {
  const calls = new Map<string, Issue[]>();
  const known: Issue[] = [];
  for (const issue of issues.filter((i) => i.severity === 'mandatory')) {
    const owners = ownersOf(issue, screens);
    if (!owners.length) known.push(issue);
    for (const owner of owners)
      calls.set(owner, [
        ...(calls.get(owner) ?? []),
        inCallTerms(issue, screens, origin),
      ]);
  }
  return { calls, known };
}
