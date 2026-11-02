import type { Scope } from '../01flows/01scope/schema';
import type { Flows } from '../01flows/schema';
import type { Architecture } from '../02design/02architect/schema';
import { type Contract, type EntityField, RECORD_FIELDS } from './schema';

// 03-contract.md: the records, the operations, and what each screen and
// dialog loads, so a reader sees every screen's sources without the rules.

const list = (items: string[]) => items.join(', ') || 'none';

const kind = (f: EntityField) =>
  `${f.kind === 'enum' ? `enum ${f.enum}` : f.kind === 'ref' ? `ref ${f.ref}` : f.kind}${f.list ? ' list' : ''}`;

export function renderContract(
  contract: Contract,
  from: { scope: Scope; flows: Flows; architecture: Architecture },
): string {
  const { scope, flows, architecture } = from;
  const label = new Map(flows.fields.map((f) => [f.id, `${f.id} ${f.label}`]));
  const lines = [
    `# ${scope.app.name}: contract`,
    '',
    `The records the app keeps, the operations its screens call, and what each screen and dialog loads. Every record also has ${RECORD_FIELDS.join(', ')}. Sign up, sign in and sign out are built in.`,
    '',
    '## Entities',
  ];
  for (const entity of contract.entities)
    lines.push(
      '',
      `### ${entity.name}`,
      '',
      `Implements ${entity.noun}.`,
      '',
      '| Field | Kind | Required |',
      '| ----- | ---- | -------- |',
      ...entity.fields.map((f) => `| ${f.name} | ${kind(f)} | ${f.required ? 'yes' : 'no'} |`),
    );
  if (contract.enums.length)
    lines.push(
      '',
      '## Enums',
      '',
      ...contract.enums.map((e) => `- ${e.name}: ${e.values.map((v) => `${v.label} (\`${v.key}\`)`).join(', ')}`),
    );
  lines.push(
    '',
    '## Operations',
    '',
    '| Operation | Kind | Entity | Summary | Inputs | Serves |',
    '| --------- | ---- | ------ | ------- | ------ | ------ |',
    ...contract.operations.map(
      (op) =>
        `| ${op.id} | ${op.kind} | ${op.entity} | ${op.summary} | ${list(op.inputs.map((i) => `${label.get(i.field) ?? i.field} as ${i.as}`))} | ${list(op.flowSteps)} |`,
    ),
    '',
    '## What each screen loads',
    '',
    ...[
      ...architecture.frames.map((frame) => ({ id: frame.id, title: frame.name })),
      ...architecture.screens,
      ...architecture.dialogs,
    ].map(
      (place) =>
        `- ${place.id} ${place.title}: ${list(contract.screens.filter((entry) => entry.screen === place.id).flatMap((entry) => entry.reads))}`,
    ),
  );
  return `${lines.join('\n')}\n`;
}
