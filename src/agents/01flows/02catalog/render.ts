import type { Scope } from '../01scope/schema';
import {
  assumptionLines,
  partLines,
  questionLines,
  roleNames,
} from '../render';
import type { Catalog } from './schema';

/** The catalog page: every flow in a line with its description, then the reusable parts. */
export function renderCatalog(catalog: Catalog, scope: Scope): string {
  const roles = roleNames(scope);
  const lines = [`# ${scope.app.name}: flows catalog`, '', '## Flows'];
  for (const flow of catalog.flows) {
    lines.push(
      `- ${flow.id} ${flow.name} (${roles.get(flow.role) ?? flow.role}, ${flow.category}): ${flow.description}`,
    );
  }
  lines.push(
    ...partLines(catalog),
    ...assumptionLines(catalog.assumptions, 'New assumptions'),
    ...questionLines(catalog.questions, 'New questions'),
  );
  return `${lines.join('\n')}\n`;
}
