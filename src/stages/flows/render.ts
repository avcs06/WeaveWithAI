import { capability } from '../../config/capabilities';
import type {
  Alternative,
  Assumption,
  Field,
  Flow,
  Flows,
  Question,
  Scope,
  Step,
} from './schema';

export function renderScope(scope: Scope): string {
  const lines: string[] = [
    `# ${scope.app.name}: scope`,
    '',
    scope.app.summary,
    '',
    `Audience: ${scope.app.audience}`,
    '',
    '## Roles',
    ...scope.roles.map(
      (role) =>
        `- ${role.name} (${role.id}, ${role.signedIn ? 'signs in' : 'no sign-in'}): ${role.description}`,
    ),
    '',
    '## Vocabulary',
    ...scope.vocabulary.map(
      (entry) =>
        `- ${entry.noun} (${owner(scope, entry.belongsTo)}): ${entry.description}`,
    ),
    '',
    '## Capabilities',
    ...scope.capabilities
      .filter((entry) => entry.needed)
      .map((entry) => `- ${entry.id}${modeNote(entry.id)}: ${entry.note}`),
    '',
    '## In scope',
    ...scope.inScope.map((item) => `- ${item}`),
  ];
  if (scope.outOfScope.length > 0) {
    lines.push(
      '',
      '## Out of scope',
      ...scope.outOfScope.map(
        (entry) =>
          `- ${entry.item}: ${entry.reason} Instead: ${entry.placeholder}`,
      ),
    );
  }
  lines.push(
    ...assumptionLines(scope.assumptions),
    ...questionLines(scope.questions),
  );
  return `${lines.join('\n')}\n`;
}

export function renderFlows(flows: Flows, scope: Scope): string {
  const roles = new Map(scope.roles.map((role) => [role.id, role.name]));
  const lines = [`# ${scope.app.name}: user flows`];
  for (const flow of flows.flows)
    lines.push('', ...flowLines(flow, roles.get(flow.role) ?? flow.role));
  lines.push(
    ...assumptionLines(flows.assumptions, 'New assumptions'),
    ...questionLines(flows.questions, 'New questions'),
  );
  return `${lines.join('\n')}\n`;
}

function flowLines(flow: Flow, roleName: string): string[] {
  const lines = [
    `## ${flow.id} ${flow.name}`,
    `${roleName} · ${flow.category} · Goal: ${flow.goal}`,
  ];
  if (flow.preconditions.length > 0)
    lines.push(`Before: ${flow.preconditions.join('; ')}`);
  lines.push('');
  flow.steps.forEach((step, i) => lines.push(...stepLines(step, i + 1)));
  if (flow.alternatives.length > 0) {
    lines.push(
      '',
      'Other paths',
      ...flow.alternatives.map((alternative) =>
        alternativeLine(flow, alternative),
      ),
    );
  }
  lines.push('', `Outcome: ${flow.outcome}`);
  return lines;
}

function stepLines(step: Step, number: number): string[] {
  if (step.kind === 'system')
    return [
      `${number}. (system) ${step.websiteResponse}`,
      ...effectLines(step),
    ];
  if (step.fields.length === 0)
    return [
      `${number}. ${step.userAction} ${step.websiteResponse}`,
      ...effectLines(step),
    ];
  return [
    `${number}. ${step.userAction}`,
    ...step.fields.map((field) => `   - ${fieldLine(field)}`),
    `   ${step.websiteResponse}`,
    ...effectLines(step),
  ];
}

function effectLines(step: Step): string[] {
  if (step.effects.length === 0) return [];
  return [
    `   Changes: ${step.effects.map((effect) => `${effect.change}s ${effect.noun}`).join(', ')}.`,
  ];
}

function fieldLine(field: Field): string {
  const rules = [field.required ? 'required' : 'optional'];
  if (field.maxLength !== null && field.minLength !== null)
    rules.push(`${field.minLength} to ${field.maxLength} characters`);
  else if (field.maxLength !== null)
    rules.push(`up to ${field.maxLength} characters`);
  else if (field.minLength !== null)
    rules.push(`at least ${field.minLength} characters`);
  if (field.min !== null && field.max !== null)
    rules.push(`${field.min} to ${field.max}`);
  else if (field.min !== null) rules.push(`at least ${field.min}`);
  else if (field.max !== null) rules.push(`at most ${field.max}`);
  if (field.options.length > 0)
    rules.push(`one of: ${field.options.join(', ')}`);
  return `${field.label} (${rules.join(', ')}), e.g. "${field.example}"`;
}

function alternativeLine(flow: Flow, alternative: Alternative): string {
  const position = (id: string) =>
    flow.steps.findIndex((step) => step.id === id) + 1;
  const condition = alternative.condition.replace(/\.$/, '');
  const back =
    alternative.resumesAt === ''
      ? 'Flow ends.'
      : `Back to ${position(alternative.resumesAt)}.`;
  return `- ${alternative.id} (from ${position(alternative.from)}, ${alternative.kind}) ${condition}: ${alternative.websiteResponse} ${back}`;
}

function assumptionLines(
  assumptions: Assumption[],
  title = 'Assumptions',
): string[] {
  if (assumptions.length === 0) return [];
  return [
    '',
    `## ${title}`,
    ...assumptions.map(
      (a) =>
        `- ${a.id} (${a.kind}${a.affects.length > 0 ? `, affects ${a.affects.join(', ')}` : ''}): ${a.text}`,
    ),
  ];
}

function questionLines(questions: Question[], title = 'Questions'): string[] {
  if (questions.length === 0) return [];
  return [
    '',
    `## ${title}`,
    ...questions.map(
      (q) =>
        `- ${q.id}${q.blocking ? ' (blocking)' : ''}: ${q.question} Why: ${q.whyItMatters} Default: ${q.defaultAnswer}`,
    ),
  ];
}

const owner = (scope: Scope, belongsTo: string): string =>
  belongsTo === 'shared'
    ? 'shared'
    : `owned by ${scope.roles.find((role) => role.id === belongsTo)?.name ?? belongsTo}`;

function modeNote(id: string): string {
  const mode = capability(id)?.mode;
  return mode === 'simulate'
    ? ' (simulated)'
    : mode === 'skip'
      ? ' (skipped)'
      : '';
}
