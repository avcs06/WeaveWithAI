import type { Catalog, Field, Flow, Flows, Scope } from '../schema';

/** Each mutation copies the fixture and breaks exactly one rule. */
const edit =
  <T>(change: (copy: T) => void) =>
  (value: T): T => {
    const copy = structuredClone(value);
    change(copy);
    return copy;
  };

function field(flows: Pick<Flows, 'fields'>, id: string): Field {
  const found = flows.fields.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`fixture has no field ${id}`);
  return found;
}

function flow<T extends { id: string }>(doc: { flows: T[] }, id: string): T {
  const found = doc.flows.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`fixture has no flow ${id}`);
  return found;
}

const step = (flows: Flows, flowId: string, index: number) => {
  const found = flow<Flow>(flows, flowId).steps[index];
  if (!found) throw new Error(`fixture has no step ${index} in ${flowId}`);
  return found;
};

export const scopeMutations: Record<string, (scope: Scope) => Scope> = {
  'SCOPE-001': edit((s) =>
    s.roles.push({ ...s.roles[0]!, name: 'Reader again' }),
  ),
  'SCOPE-002': edit((s) => (s.vocabulary[0]!.noun = 'books')),
  'SCOPE-003': edit((s) => (s.questions[0]!.defaultAnswer = '')),
  'SCOPE-005': edit((s) => (s.assumptions[1]!.id = 'A1')),
  'SCOPE-006': edit((s) => (s.inScope = s.inScope.slice(0, 2))),
};

export const catalogMutations: Record<string, (catalog: Catalog) => Catalog> = {
  'CAT-001': edit((c) => (flow(c, 'F03').description = '')),
  'CAT-002': edit((c) => (c.forms[0]!.fields = [])),
  'CAT-003': edit((c) => (c.subflows[0]!.steps = [])),
};

export const flowMutations: Record<string, (flows: Flows) => Flows> = {
  'FLOW-001': edit((f) => (step(f, 'F01', 0).id = 'F01-S01')),
  'FLOW-002': edit((f) => (step(f, 'F06', 0).id = 'F06.S02')),
  'FLOW-003': edit((f) => (flow(f, 'F03').role = 'librarian')),
  'FLOW-004': edit((f) => (step(f, 'F03', 0).userAction = '')),
  'FLOW-005': edit((f) => (field(f, 'FD05').options = ['To read'])),
  'FLOW-006': edit((f) => {
    field(f, 'FD04').id = 'author';
    f.forms[0]!.fields = ['FD03', 'author', 'FD05'];
  }),
  'FLOW-007': edit((f) => step(f, 'F03', 1).fields.push('FD99')),
  'FLOW-008': edit((f) => (step(f, 'F05', 0).effects[0]!.noun = 'Novel')),
  'FLOW-009': edit((f) => {
    for (const s of flow(f, 'F04').steps) s.effects = [];
    step(f, 'F05', 0).effects = [];
  }),
  'FLOW-011': edit((f) => flow(f, 'F03').alternatives.splice(0, 1)),
  'FLOW-012': edit((f) => flow(f, 'F04').alternatives.splice(0, 1)),
  // The deleting step backs out through the subflow it runs or its own paths; both go.
  'FLOW-013': edit((f) => {
    f.subflows[0]!.alternatives = [];
    const remove = flow(f, 'F05');
    remove.alternatives = remove.alternatives.filter(
      (alternative) => alternative.from !== 'F05.S02',
    );
  }),
  'FLOW-014': edit(
    (f) => (f.flows = f.flows.filter((candidate) => candidate.id !== 'F06')),
  ),
  'FLOW-015': edit((f) => {
    for (const candidate of f.flows) candidate.category = 'auth';
  }),
  'FLOW-016': edit((f) => (flow(f, 'F03').alternatives[0]!.from = 'F03.S09')),
  'FLOW-019': edit((f) => (flow(f, 'F03').outcome = '')),
  'FLOW-020': edit((f) => {
    const only = step(f, 'F06', 0);
    flow(f, 'F06').steps = Array.from({ length: 17 }, (_, i) => ({
      ...only,
      id: `F06.S${String(i + 1).padStart(2, '0')}`,
    }));
  }),
  'FLOW-021': edit((f) => (field(f, 'FD03').example = '')),
  'FLOW-023': edit((f) => (f.assumptions[0]!.id = 'A02')),
  'FLOW-024': edit((f) =>
    f.fields.push({ ...field(f, 'FD03'), id: 'FD06', label: 'ISBN' }),
  ),
};
