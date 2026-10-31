import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { splitIssues } from '../../core/issues';
import {
  catalogMutations,
  flowMutations,
  scopeMutations,
} from './__fixtures__/mutations';
import { Scope } from './01scope/schema';
import { Catalog } from './02catalog/schema';
import { Flows } from './schema';
import { scopeRules, validateScope } from './01scope/validation/validation';
import { catalogFlowRules, catalogRules, validateCatalog } from './02catalog/validation/validation';
import { validateBatch } from './03expand/validation/validation';
import { flowRules, validateFlows } from './04reconcile/validation/validation';

const load = (name: string): unknown =>
  JSON.parse(
    readFileSync(new URL(`./__fixtures__/${name}`, import.meta.url), 'utf8'),
  );
// Parsing through the schemas also proves the fixtures are valid artifacts.
const scope = Scope.parse(load('reading-list.scope.json'));
const flows = Flows.parse(load('reading-list.flows.json'));
const catalog = Catalog.parse(load('reading-list.catalog.json'));

const ruleIds = (issues: { rule: string }[]) =>
  issues.map((issue) => issue.rule);

describe('the reading-list fixture', () => {
  it('passes every scope rule', () => {
    const { mandatory, warnings } = splitIssues(validateScope(scope));
    if (warnings.length > 0) console.log('scope warnings:', warnings);
    expect(mandatory).toEqual([]);
  });

  it('passes every catalog rule', () => {
    const { mandatory, warnings } = splitIssues(
      validateCatalog(catalog, scope),
    );
    if (warnings.length > 0) console.log('catalog warnings:', warnings);
    expect(mandatory).toEqual([]);
  });

  it('passes every flow rule', () => {
    const { mandatory, warnings } = splitIssues(validateFlows(flows, scope));
    if (warnings.length > 0) console.log('flow warnings:', warnings);
    expect(mandatory).toEqual([]);
  });
});

describe('every rule has a failing fixture', () => {
  it('pairs each rule with exactly one mutation', () => {
    expect(Object.keys(scopeMutations).sort()).toEqual(
      scopeRules.map((rule) => rule.id).sort(),
    );
    expect(Object.keys(catalogMutations).sort()).toEqual(
      catalogRules.map((rule) => rule.id).sort(),
    );
    expect(Object.keys(flowMutations).sort()).toEqual(
      flowRules.map((rule) => rule.id).sort(),
    );
    // The flow rules the catalog reuses are flow rules, so the flow mutations cover them.
    expect(flowRules).toEqual(expect.arrayContaining([...catalogFlowRules]));
  });

  it.each(scopeRules.map((rule) => rule.id))(
    '%s fires on its mutation and not on the valid scope',
    (id) => {
      const mutate = scopeMutations[id];
      if (!mutate) throw new Error(`no mutation for ${id}`);
      expect(ruleIds(validateScope(mutate(scope)))).toContain(id);
      expect(ruleIds(validateScope(scope))).not.toContain(id);
    },
  );

  it.each(catalogRules.map((rule) => rule.id))(
    '%s fires on its mutation and not on the valid catalog',
    (id) => {
      const mutate = catalogMutations[id];
      if (!mutate) throw new Error(`no mutation for ${id}`);
      expect(ruleIds(validateCatalog(mutate(catalog), scope))).toContain(id);
      expect(ruleIds(validateCatalog(catalog, scope))).not.toContain(id);
    },
  );

  it.each(flowRules.map((rule) => rule.id))(
    '%s fires on its mutation and not on the valid flows',
    (id) => {
      const mutate = flowMutations[id];
      if (!mutate) throw new Error(`no mutation for ${id}`);
      expect(ruleIds(validateFlows(mutate(flows), scope))).toContain(id);
      expect(ruleIds(validateFlows(flows, scope))).not.toContain(id);
    },
  );
});

describe('choices from records (FL12)', () => {
  it('FLOW-005 accepts a choice that takes its options from a vocabulary noun, and flags a noun the scope does not have', () => {
    const fromShelves = structuredClone(flows);
    const shelf = fromShelves.fields.find((field) => field.id === 'FD05');
    if (!shelf) throw new Error('fixture changed');
    shelf.options = [];
    shelf.optionsFrom = 'Shelf';
    expect(ruleIds(validateFlows(fromShelves, scope))).not.toContain(
      'FLOW-005',
    );

    shelf.optionsFrom = 'Genre';
    expect(ruleIds(validateFlows(fromShelves, scope))).toContain('FLOW-005');
  });
});

describe('one expansion batch (FL9)', () => {
  const batch = (flowIds: string[]) => ({
    flows: flows.flows.filter((flow) => flowIds.includes(flow.id)),
    newFields: [],
    newForms: [],
    newSubflows: [],
  });

  it('resolves the standard subflow its delete step runs, and leaves the catalog subflows to the catalog', () => {
    expect(validateBatch(batch(['F05']), catalog, scope)).toEqual([]);

    const brokenCatalog = structuredClone(catalog);
    brokenCatalog.subflows[0]!.steps[0]!.websiteResponse = '';
    expect(
      ruleIds(validateBatch(batch(['F01']), brokenCatalog, scope)),
    ).not.toContain('FLOW-004');
    expect(
      ruleIds(
        validateFlows({ ...flows, subflows: brokenCatalog.subflows }, scope),
      ),
    ).toContain('FLOW-004');
  });
});

describe("the spec's hand-broken flows", () => {
  it('fail exactly FLOW-007 and FLOW-011', () => {
    const broken = structuredClone(flows);
    const addBook = broken.flows.find((flow) => flow.id === 'F03');
    const signIn = broken.flows.find((flow) => flow.id === 'F02');
    if (!addBook || !signIn) throw new Error('fixture changed');
    // A form without an invalid path, a field name the catalog does not define.
    addBook.alternatives = addBook.alternatives.filter(
      (alternative) => alternative.kind !== 'invalid',
    );
    signIn.steps[1]!.fields = ['FD01', 'FD99'];

    const { mandatory } = splitIssues(validateFlows(broken, scope));
    expect([...new Set(ruleIds(mandatory))].sort()).toEqual([
      'FLOW-007',
      'FLOW-011',
    ]);
  });
});
