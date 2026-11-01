import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { type PlanInput, stepFields, steps } from './helpers';

/**
 * DESIGN-043 · mandatory (a long dialog is a warning)
 * Each screen type as the coding stage builds it: a page has a route
 * like /shelf or /books/[bookId], its own; a dialog or drawer has none. A
 * dialog or drawer holds at most 6 fields; a longer form is a page.
 * Pass: the shelf at /shelf, the add-book dialog with three fields.
 * Fail: the book page with no route, or two pages at /shelf.
 */
const MAX_DIALOG_FIELDS = 6;

export const rule = defineRule<PlanInput>(
  'DESIGN-043',
  'mandatory',
  ({ plan, ctx }, fail) => {
    const issues: Issue[] = [];
    const routes = new Map<string, string>();
    const byStep = new Map(steps(ctx.flows).map((step) => [step.id, step]));
    for (const screen of plan.screens) {
      if (screen.type === 'page') {
        if (!screen.route.startsWith('/'))
          issues.push(fail(`${screen.id} is a page with route "${screen.route}", which does not start with /. Every page has a route that starts with /, such as /shelf or /books/[bookId]. Give ${screen.id} its route.`, screen.id));
        else if (routes.has(screen.route))
          issues.push(fail(`${screen.id} has the route ${screen.route}, which ${routes.get(screen.route)} has too. Each page has its own route. Give ${screen.id} a route no other page has.`, screen.id));
        routes.set(screen.route, screen.id);
        continue;
      }
      if (screen.route)
        issues.push(fail(`${screen.id} is a ${screen.type} with the route ${screen.route}. Only a page has a route. Give ${screen.id} route "".`, screen.id));
      const fields = new Set(
        screen.flowSteps.flatMap((id) => {
          const step = byStep.get(id);
          return step?.kind === 'user' ? stepFields(ctx.flows, step) : [];
        }),
      );
      if (fields.size > MAX_DIALOG_FIELDS)
        issues.push({
          ...fail(`${screen.id} is a ${screen.type} with ${fields.size} fields. A dialog or drawer holds at most ${MAX_DIALOG_FIELDS} fields. A longer form is a page. Make ${screen.id} a page with a route of its own.`, screen.id),
          severity: 'warning',
        });
    }
    return issues;
  },
);
