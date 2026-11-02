import type { Scope } from '../01flows/01scope/schema';
import { type Flows, stepFields } from '../01flows/schema';
import type { Defined as Widget } from '../02design/03catalog/process';
import { type Contract, type EntityField, type Operation, RECORD_FIELDS } from './schema';
import { allSteps } from './validation/helpers';

// 03-contract.md: the records, the operations, and what covers each widget,
// so a reader sees every widget's sources without the rules.

const AUTH: Record<string, string> = { signUp: 'the built-in sign up', signIn: 'the built-in sign in' };
const flowOf = (step: string) => step.split('.')[0] ?? '';
const list = (items: string[]) => items.join(', ') || 'none';

const kind = (f: EntityField) =>
  `${f.kind === 'enum' ? `enum ${f.enum}` : f.kind === 'ref' ? `ref ${f.ref}` : f.kind}${f.list ? ' list' : ''}`;

export function renderContract(contract: Contract, from: { scope: Scope; flows: Flows; widgets: Widget[] }): string {
  const { scope, flows, widgets } = from;
  const label = new Map(flows.fields.map((f) => [f.id, `${f.id} ${f.label}`]));
  const lines = [
    `# ${scope.app.name}: contract`,
    '',
    `The records the app keeps, the operations its widgets call, and what covers each widget. Every record also has ${RECORD_FIELDS.join(', ')}. Sign up, sign in and sign out are built in.`,
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
    '## Widgets',
    ...widgets.flatMap((widget) => ['', `### ${widget.id} ${widget.name} (${widget.kind})`, '', ...covers(widget, contract, flows, label)]),
  );
  return `${lines.join('\n')}\n`;
}

/** What a widget shows and who loads it, what it asks for and where that goes, and what its steps call. */
function covers(widget: Widget, contract: Contract, flows: Flows, label: Map<string, string>): string[] {
  const steps = new Map(allSteps(flows).map((s) => [s.id, s]));
  const serving = (step: string) => contract.operations.filter((op) => op.flowSteps.includes(step));
  const names = (ops: Operation[]) => list([...new Set(ops.map((op) => op.id))]);
  const flowIds = new Set(widget.flowSteps.map(flowOf));
  const reads = contract.widgets
    .filter((entry) => entry.widget === widget.id)
    .flatMap((entry) => entry.reads.flatMap((id) => contract.operations.find((op) => op.id === id) ?? []));
  const lines: string[] = [];

  const nouns = [...new Set([...(widget.repeat ? [widget.repeat] : []), ...widget.data.map((d) => d.split('.')[0] ?? '')])];
  for (const noun of nouns) {
    const entity = contract.entities.find((e) => e.noun === noun)?.name ?? noun;
    const values = widget.data.filter((d) => d.startsWith(`${noun}.`));
    const what = `${noun === widget.repeat ? `a list of ${noun}` : noun}${values.length ? ` (${values.join(', ')})` : ''}`;
    const loaders = reads.filter((op) => op.entity === entity);
    const creators = contract.operations.filter(
      (op) => op.entity === entity && op.kind === 'create' && op.flowSteps.some((s) => flowIds.has(flowOf(s))),
    );
    lines.push(
      loaders.length
        ? `- Shows ${what}, loaded by ${names(loaders)}.`
        : `- Shows ${what}, typed in by the user and saved by ${names(creators)}.`,
    );
  }

  const asks = new Map<string, string>();
  for (const id of widget.flowSteps) {
    const step = steps.get(id);
    if (!step || step.kind !== 'user') continue;
    for (const field of stepFields(step, flows)) {
      const takers = contract.operations.filter(
        (op) => op.inputs.some((i) => i.field === field.id) && op.flowSteps.some((s) => flowOf(s) === step.flow),
      );
      asks.set(field.id, AUTH[step.authKind] ?? names(takers));
    }
  }
  for (const [field, to] of asks) lines.push(`- Asks for ${label.get(field) ?? field}, which goes to ${to}.`);

  for (const id of widget.flowSteps) {
    const step = steps.get(id);
    if (!step?.effects.length) continue;
    const changes = step.effects.map((e) => `${e.change}s ${e.noun}`).join(' and ');
    lines.push(`- At ${id}, ${changes}: ${names(serving(id))}.`);
  }

  return lines.length ? lines : ['- Opens other screens or shows fixed content; it calls nothing.'];
}
