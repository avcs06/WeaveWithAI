import type { Scope } from './01scope/schema';
import { isStandardSubflowId } from './config/subflows';
import {
  type Alternative,
  type Assumption,
  type Field,
  type Flow,
  type Flows,
  type Form,
  type Question,
  type StepContainer,
  stepFields,
} from './schema';

export function flowLines(flow: Flow, roleName: string, doc: Flows): string[] {
  const lines = [
    `## ${flow.id} ${flow.name}`,
    `${roleName} · ${flow.category} · Goal: ${flow.goal}`,
  ];
  if (flow.preconditions.length > 0)
    lines.push(`Before: ${flow.preconditions.join('; ')}`);
  lines.push('', ...stepsLines(flow, doc, ''));
  lines.push('', `Outcome: ${flow.outcome}`);
  return lines;
}

const HANDS_BACK = 'Back to the calling flow.';

/** Numbered steps, then the other paths; a subflow step shows the subflow's steps indented under it. */
function stepsLines(
  container: StepContainer,
  doc: Flows,
  indent: string,
  ends = 'Flow ends.',
): string[] {
  const lines: string[] = [];
  container.steps.forEach((step, i) => {
    const number = `${indent}${i + 1}.`;
    const subflow = doc.subflows.find(
      (candidate) => candidate.id === step.subflow,
    );
    const fields = stepFields(step, doc);
    const form = doc.forms.find((candidate) => candidate.id === step.form);
    if (subflow)
      lines.push(
        `${number} ${step.userAction === '' ? '' : `${step.userAction} `}${subflow.name} (subflow ${subflow.id}):`,
        ...stepsLines(subflow, doc, `${indent}   `, HANDS_BACK),
      );
    else if (step.kind === 'system')
      lines.push(`${number} (system) ${step.websiteResponse}`);
    else if (fields.length === 0)
      lines.push(`${number} ${step.userAction} ${step.websiteResponse}`);
    else {
      lines.push(
        `${number} ${step.userAction}${form ? ` (${form.name})` : ''}`,
        ...fields.map((field) => `${indent}   - ${fieldLine(field)}`),
        `${indent}   ${step.websiteResponse}`,
      );
    }
    if (step.effects.length > 0) {
      lines.push(
        `${indent}   Changes: ${step.effects.map((effect) => `${effect.change}s ${effect.noun}`).join(', ')}.`,
      );
    }
  });
  if (container.alternatives.length > 0) {
    lines.push(
      '',
      `${indent}Other paths`,
      ...container.alternatives.map(
        (alternative) =>
          `${indent}- ${alternativeLine(container, alternative, ends)}`,
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

function alternativeLine(
  container: StepContainer,
  alternative: Alternative,
  ends: string,
): string {
  const position = (id: string) =>
    container.steps.findIndex((step) => step.id === id) + 1;
  const condition = alternative.condition.replace(/\.$/, '');
  const back =
    alternative.resumesAt === ''
      ? ends
      : `Back to ${position(alternative.resumesAt)}.`;
  return `${alternative.id} (from ${position(alternative.from)}, ${alternative.kind}) ${condition}: ${alternative.websiteResponse} ${back}`;
}

/** The reusable parts, once per document. */
export function partLines(
  doc: Pick<Flows, 'fields' | 'forms' | 'subflows'>,
): string[] {
  const lines: string[] = [];
  if (doc.fields.length > 0)
    lines.push(
      '',
      '## Fields',
      ...doc.fields.map(
        (field) => `- ${field.id} ${fieldLine(field)}. ${field.meaning}`,
      ),
    );
  if (doc.forms.length > 0)
    lines.push(
      '',
      '## Forms',
      ...doc.forms.map(
        (form: Form) => `- ${form.id} ${form.name}: ${form.fields.join(', ')}`,
      ),
    );
  for (const subflow of doc.subflows) {
    lines.push(
      '',
      `## ${subflow.id} ${subflow.name} (${isStandardSubflowId(subflow.id) ? 'standard subflow' : 'subflow'})`,
      '',
      ...stepsLines(
        subflow,
        { ...emptyDoc, ...doc, subflows: [] } as Flows,
        '',
        HANDS_BACK,
      ),
    );
  }
  return lines;
}

const emptyDoc: Flows = {
  flows: [],
  fields: [],
  forms: [],
  subflows: [],
  assumptions: [],
  questions: [],
};

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
