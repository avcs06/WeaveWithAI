import type { Scope } from '../01scope/schema';
import {
  assumptionLines,
  flowLines,
  partLines,
  questionLines,
  roleNames,
} from '../render';
import type { Flows } from '../schema';

export function renderFlows(flows: Flows, scope: Scope): string {
  const roles = roleNames(scope);
  const lines = [`# ${scope.app.name}: user flows`];
  for (const flow of flows.flows)
    lines.push(
      '',
      ...flowLines(flow, roles.get(flow.role) ?? flow.role, flows),
    );
  lines.push(
    ...partLines(flows),
    ...assumptionLines(flows.assumptions, 'New assumptions'),
    ...questionLines(flows.questions, 'New questions'),
  );
  return `${lines.join('\n')}\n`;
}
