import type { Scope } from './01scope/schema';
import {
  type Alternative,
  type Assumption,
  type Field,
  type Flow,
  type Flows,
  type Form,
  type Question,
  stepFields,
} from './schema';

export function flowLines(flow: Flow, roleName: string, doc: Flows): string[] {
  const lines = [
    `## ${flow.id} ${flow.name}`,
    `${roleName} · ${flow.noun === '' ? flow.kind : `${flow.kind} ${flow.noun}`} · Goal: ${flow.goal}`,
    `Starts: ${flow.start}`,
  ];
  if (flow.preconditions.length > 0)
    lines.push(`Before: ${flow.preconditions.join('; ')}`);
  lines.push('', ...stepsLines(flow, doc));
  lines.push('', `Outcome: ${flow.outcome}`);
  return lines;
}

/** Numbered steps, then the other paths. */
function stepsLines(flow: Flow, doc: Flows): string[] {
  const lines: string[] = [];
  flow.steps.forEach((step, i) => {
    const number = `${i + 1}.`;
    const fields = stepFields(step, doc);
    const form = doc.forms.find((candidate) => candidate.id === step.form);
    if (step.kind === 'system')
      lines.push(`${number} (system) ${step.websiteResponse}`);
    else if (fields.length === 0)
      lines.push(`${number} ${step.userAction} ${step.websiteResponse}`);
    else {
      lines.push(
        `${number} ${step.userAction}${form ? ` (${form.name})` : ''}`,
        ...fields.map((field) => `   - ${fieldLine(field)}`),
        `   ${step.websiteResponse}`,
      );
    }
    if (step.effects.length > 0) {
      lines.push(
        `   Changes: ${step.effects.map((effect) => `${effect.change}s ${effect.noun}`).join(', ')}.`,
      );
    }
  });
  if (flow.alternatives.length > 0) {
    lines.push(
      '',
      'Other paths',
      ...flow.alternatives.map(
        (alternative) => `- ${alternativeLine(flow, alternative)}`,
      ),
    );
  }
  return lines;
}

export function fieldLine(field: Field): string {
  const rules = [field.required ? 'required' : 'optional'];
  const lengths = [
    'text',
    'longText',
    'email',
    'password',
    'url',
    'phone',
  ].includes(field.type);
  const unit = lengths ? ' characters' : '';
  if (field.min !== null && field.max !== null)
    rules.push(`${field.min} to ${field.max}${unit}`);
  else if (field.max !== null)
    rules.push(`${lengths ? 'up to' : 'at most'} ${field.max}${unit}`);
  else if (field.min !== null) rules.push(`at least ${field.min}${unit}`);
  const pick = field.type === 'multiChoice' ? 'any of' : 'one of';
  if (field.options.length > 0)
    rules.push(`${pick}: ${field.options.join(', ')}`);
  if (field.optionsFrom !== '')
    rules.push(`${pick} the ${field.optionsFrom} records`);
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
  return `${alternative.id} (from ${position(alternative.from)}, ${alternative.kind}) ${condition}: ${alternative.websiteResponse} ${back}`;
}

/** The reusable parts, once per document: the fields noun by noun, those no record keeps last, then the forms. */
export function partLines(doc: Pick<Flows, 'fields' | 'forms'>): string[] {
  const lines: string[] = [];
  if (doc.fields.length > 0) lines.push('', '## Fields');
  const nouns = [...new Set(doc.fields.map((field) => field.noun))].sort(
    (a, b) => Number(a === '') - Number(b === ''),
  );
  for (const noun of nouns)
    lines.push(
      '',
      `### ${noun === '' ? 'Kept by no record' : noun}`,
      ...doc.fields
        .filter((field) => field.noun === noun)
        .map((field) => `- ${field.id} ${fieldLine(field)}. ${field.meaning}`),
    );
  if (doc.forms.length > 0)
    lines.push(
      '',
      '## Forms',
      ...doc.forms.map(
        (form: Form) => `- ${form.id} ${form.name}: ${form.fields.join(', ')}`,
      ),
    );
  return lines;
}

export function assumptionLines(
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

export function questionLines(
  questions: Question[],
  title = 'Questions',
): string[] {
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

export const roleNames = (scope: Scope) =>
  new Map(scope.roles.map((role) => [role.id, role.name]));
