import type { Scope } from '../01scope/schema';
import {
  assumptionLines,
  partLines,
  questionLines,
  roleNames,
} from '../render';
import type { Catalog } from './schema';

/** The catalog page: every flow in a line with its description, the pairs skipped, then the reusable parts. */
export function renderCatalog(catalog: Catalog, scope: Scope): string {
  const roles = roleNames(scope);
  const role = (id: string) => roles.get(id) ?? id;
  const what = (kind: string, noun: string) =>
    noun === '' ? kind : `${kind} ${noun}`;
  const lines = [`# ${scope.app.name}: flows catalog`, '', '## Flows'];
  for (const flow of catalog.flows) {
    lines.push(
      `- ${flow.id} ${flow.name} (${role(flow.role)}, ${what(flow.kind, flow.noun)}, starts ${flow.start}): ${flow.description}`,
    );
  }
  if (catalog.skipped.length > 0)
    lines.push(
      '',
      '## Skipped',
      ...catalog.skipped.map(
        (skip) =>
          `- ${role(skip.role)}, ${what(skip.kind, skip.noun)}: ${skip.reason}`,
      ),
    );
  lines.push(
    ...partLines(catalog),
    ...assumptionLines(catalog.assumptions, 'New assumptions'),
    ...questionLines(catalog.questions, 'New questions'),
  );
  return `${lines.join('\n')}\n`;
}
