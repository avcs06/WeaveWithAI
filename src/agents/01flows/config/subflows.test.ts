import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { Scope } from '../01scope/schema';
import { Catalog } from '../02catalog/schema';
import { Flows } from '../schema';
import { validateCatalog } from '../02catalog/validation/validation';
import {
  isStandardSubflowId,
  standardSubflowList,
  standardSubflows,
  withStandardSubflows,
} from './subflows';

const load = (name: string): unknown =>
  JSON.parse(
    readFileSync(
      new URL(`../__fixtures__/${name}`, import.meta.url),
      'utf8',
    ),
  );
const scope = Scope.parse(load('reading-list.scope.json'));
const catalog = Catalog.parse(load('reading-list.catalog.json'));
const flows = Flows.parse(load('reading-list.flows.json'));

describe('standard subflows', () => {
  it('are copied as they are into the reading-list fixtures', () => {
    const standard = standardSubflows();
    const copies = (doc: { subflows: { id: string }[] }) =>
      doc.subflows.filter((subflow) => isStandardSubflowId(subflow.id));
    expect(copies(catalog)).toEqual(standard);
    expect(copies(flows)).toEqual(standard);
  });

  it('pass the catalog rules on their own', () => {
    const bare = withStandardSubflows({ ...catalog, subflows: [] });
    expect(
      validateCatalog(bare, scope).filter(
        (issue) => issue.severity === 'mandatory',
      ),
    ).toEqual([]);
  });

  it('come first under their own ids and replace a model-written copy of a standard id', () => {
    const own = {
      ...catalog.subflows[0]!,
      id: 'SF01',
      name: 'Sign in when needed',
    };
    const rewritten = {
      ...catalog.subflows[0]!,
      name: 'The model rewrote STD01',
    };
    const doc = withStandardSubflows({
      ...catalog,
      subflows: [rewritten, own],
    });
    expect(doc.subflows.map((subflow) => subflow.id)).toEqual([
      'STD01',
      'SF01',
    ]);
    expect(doc.subflows[0]?.name).toBe('Confirm deletion');
    expect(isStandardSubflowId('STD01')).toBe(true);
    expect(isStandardSubflowId('SF01')).toBe(false);
    expect(standardSubflowList()).toContain('STD01 Confirm deletion:');
  });
});
