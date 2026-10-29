import type { Field, Flows, Scope } from '../schema';

/** Each mutation copies the fixture and breaks exactly one rule. */
const edit =
  <T>(change: (copy: T) => void) =>
  (value: T): T => {
    const copy = structuredClone(value);
    change(copy);
    return copy;
  };

function field(
  flows: Flows,
  flowId: string,
  stepIndex: number,
  name: string,
): Field {
  const found = flows.flows
    .find((flow) => flow.id === flowId)
    ?.steps[stepIndex]?.fields.find((f) => f.name === name);
  if (!found)
    throw new Error(
      `fixture has no field ${name} at ${flowId} step ${stepIndex}`,
    );
  return found;
}

function flow(flows: Flows, id: string) {
  const found = flows.flows.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`fixture has no flow ${id}`);
  return found;
}

export const scopeMutations: Record<string, (scope: Scope) => Scope> = {
  'SCOPE-001': edit((s) =>
    s.roles.push({ ...s.roles[0]!, name: 'Reader again' }),
  ),
  'SCOPE-002': edit((s) => (s.vocabulary[0]!.noun = 'books')),
  'SCOPE-003': edit((s) => (s.questions[0]!.defaultAnswer = '')),
  'SCOPE-004': edit((s) =>
    s.capabilities.push({
      id: 'maps',
      needed: true,
      note: 'Readers find bookshops nearby.',
    }),
  ),
  'SCOPE-005': edit((s) => (s.assumptions[1]!.id = 'A1')),
  'SCOPE-006': edit((s) => (s.inScope = s.inScope.slice(0, 2))),
};

export const flowMutations: Record<string, (flows: Flows) => Flows> = {
  'FLOW-001': edit((f) => (flow(f, 'F01').steps[0]!.id = 'F01-S01')),
  'FLOW-002': edit((f) => (flow(f, 'F06').steps[0]!.id = 'F06.S02')),
  'FLOW-003': edit((f) => (flow(f, 'F03').role = 'librarian')),
  'FLOW-004': edit((f) => (flow(f, 'F03').steps[0]!.userAction = '')),
  'FLOW-005': edit((f) => (field(f, 'F03', 1, 'shelf').options = ['To read'])),
  'FLOW-006': edit((f) => (field(f, 'F03', 1, 'author').name = 'Author')),
  'FLOW-007': edit((f) => (field(f, 'F02', 1, 'password').type = 'text')),
  'FLOW-008': edit(
    (f) => (flow(f, 'F05').steps[0]!.effects[0]!.noun = 'Novel'),
  ),
  'FLOW-009': edit((f) => {
    for (const step of flow(f, 'F04').steps) step.effects = [];
    flow(f, 'F05').steps[0]!.effects = [];
  }),
  'FLOW-010': edit((f) => {
    flow(f, 'F03').steps[1]!.effects.push({ noun: 'Shelf', change: 'create' });
    flow(f, 'F04').steps[0]!.effects.push({ noun: 'Shelf', change: 'read' });
  }),
  'FLOW-011': edit((f) => flow(f, 'F03').alternatives.splice(0, 1)),
  'FLOW-012': edit((f) => flow(f, 'F04').alternatives.splice(0, 1)),
  'FLOW-013': edit((f) => flow(f, 'F05').alternatives.splice(0, 1)),
  'FLOW-014': edit(
    (f) => (f.flows = f.flows.filter((candidate) => candidate.id !== 'F06')),
  ),
  'FLOW-015': edit((f) => {
    for (const candidate of f.flows) candidate.category = 'auth';
  }),
  'FLOW-016': edit((f) => (flow(f, 'F03').alternatives[0]!.from = 'F03.S09')),
  'FLOW-017': edit(
    (f) =>
      (flow(f, 'F03').steps[1]!.websiteResponse +=
        ' The endpoint returns the book.'),
  ),
  'FLOW-018': edit(
    (f) =>
      (flow(f, 'F03').steps[0]!.websiteResponse =
        'The website opens a modal with an empty book form.'),
  ),
  'FLOW-019': edit((f) => (flow(f, 'F03').outcome = '')),
  'FLOW-020': edit((f) => {
    const only = flow(f, 'F06').steps[0]!;
    flow(f, 'F06').steps = Array.from({ length: 17 }, (_, i) => ({
      ...only,
      id: `F06.S${String(i + 1).padStart(2, '0')}`,
    }));
  }),
  'FLOW-021': edit((f) => (field(f, 'F03', 1, 'title').example = '')),
  'FLOW-022': edit(
    (f) =>
      (flow(f, 'F03').steps[1]!.websiteResponse +=
        ' The website sends an email to confirm.'),
  ),
  'FLOW-023': edit((f) => (f.assumptions[0]!.id = 'A02')),
};
