import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { splitIssues } from '../../core/issues';
import {
  catalogMutations,
  flowMutations,
  scopeMutations,
} from './__fixtures__/mutations';
import { Catalog, Flows, Scope } from './schema';
import {
  catalogFlowRules,
  catalogRules,
  flowRules,
  scopeRules,
  validateCatalog,
  validateFlows,
  validateScope,
} from './validate';

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

describe('simulated capabilities (FL7)', () => {
  it('FLOW-022 allows a simulated mention once the scope marks the capability needed, and flags it otherwise', () => {
    const mutate = flowMutations['FLOW-022'];
    if (!mutate) throw new Error('no mutation for FLOW-022');
    const emailing = mutate(flows);
    expect(ruleIds(validateFlows(emailing, scope))).toContain('FLOW-022');

    const needsEmail = structuredClone(scope);
    needsEmail.capabilities.push({
      id: 'emailSending',
      needed: true,
      note: 'Confirms each new book.',
    });
    expect(ruleIds(validateFlows(emailing, needsEmail))).not.toContain(
      'FLOW-022',
    );
  });

  it('SCOPE-004 ignores a needed simulated capability and requires an out-of-scope entry for a skipped one', () => {
    const simulated = structuredClone(scope);
    simulated.capabilities.push({
      id: 'payments',
      needed: true,
      note: 'Readers buy books.',
    });
    expect(ruleIds(validateScope(simulated))).not.toContain('SCOPE-004');

    const skipped = structuredClone(scope);
    skipped.capabilities.push({
      id: 'maps',
      needed: true,
      note: 'Bookshops nearby.',
    });
    expect(ruleIds(validateScope(skipped))).toContain('SCOPE-004');
    skipped.outOfScope.push({
      item: 'Bookshop map',
      reason: 'Maps (geolocation) are skipped.',
      placeholder: 'The website shows the bookshop address as text.',
    });
    expect(ruleIds(validateScope(skipped))).not.toContain('SCOPE-004');
  });
});

describe("the spec's hand-broken flows", () => {
  it('fail exactly FLOW-007, FLOW-011 and FLOW-017', () => {
    const broken = structuredClone(flows);
    const addBook = broken.flows.find((flow) => flow.id === 'F03');
    const signIn = broken.flows.find((flow) => flow.id === 'F02');
    if (!addBook || !signIn) throw new Error('fixture changed');
    // A form without an invalid path, a field name the catalog does not define, the word "endpoint".
    addBook.alternatives = addBook.alternatives.filter(
      (alternative) => alternative.kind !== 'invalid',
    );
    signIn.steps[1]!.fields = ['FD01', 'FD99'];
    addBook.steps[1]!.websiteResponse += ' The endpoint returns the book.';

    const { mandatory } = splitIssues(validateFlows(broken, scope));
    expect([...new Set(ruleIds(mandatory))].sort()).toEqual([
      'FLOW-007',
      'FLOW-011',
      'FLOW-017',
    ]);
  });
});
