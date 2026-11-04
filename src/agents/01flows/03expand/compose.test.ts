import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { Catalog } from '../02catalog/schema';
import { type Flow, Flows } from '../schema';
import { assemble, dropUnused, groupsOf } from './compose';

const load = (name: string): unknown =>
  JSON.parse(
    readFileSync(new URL(`../__fixtures__/${name}`, import.meta.url), 'utf8'),
  );

const flows = Flows.parse(load('reading-list.flows.json'));

const catalog = Catalog.parse(load('reading-list.catalog.json'));

const isbn = { ...flows.fields[2]!, id: 'FD06', label: 'ISBN' };

const flow = (id: string): Flow => {
  const found = flows.flows.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`no ${id}`);
  return found;
};

describe('groupsOf', () => {
  it('groups the flows that share a role and a record, in the order the catalog first names each group', () => {
    expect(groupsOf(catalog)).toEqual([
      ['F01', 'F02', 'F06'],
      ['F03', 'F04', 'F05'],
    ]);
    expect(groupsOf({ ...catalog, flows: [] })).toEqual([]);
  });
});

describe('assemble', () => {
  it('orders flows as the catalog does and keeps the first definition of every part', () => {
    const extraField = { ...flows.fields[0]!, id: 'FD06', label: 'ISBN' };
    const dupField = { ...flows.fields[2]!, label: 'Book title' }; // FD03 again: the catalog's wins
    const batch1 = {
      flows: [flow('F03'), flow('F01')],
      newFields: [dupField],
      newForms: [],
    };
    const batch2 = {
      flows: [flow('F02'), flow('F04'), flow('F05'), flow('F06')],
      newFields: [extraField],
      newForms: [],
    };
    const doc = assemble(catalog, [batch1, batch2]);

    expect(doc.flows.map((candidate) => candidate.id)).toEqual([
      'F01',
      'F02',
      'F03',
      'F04',
      'F05',
      'F06',
    ]);
    expect(doc.fields.find((field) => field.id === 'FD03')?.label).toBe(
      'Title',
    );
    expect(doc.fields.map((field) => field.id)).toContain('FD06');
    expect(doc.forms).toEqual(catalog.forms);
    expect(Flows.parse(doc)).toBeTruthy();
  });

  it('appends a flow a batch added beyond the catalog', () => {
    const extra = { ...flow('F06'), id: 'F07', name: 'Extra' };
    const doc = assemble(catalog, [
      {
        flows: [...flows.flows, extra],
        newFields: [],
        newForms: [],
      },
    ]);
    expect(doc.flows.map((candidate) => candidate.id)).toEqual([
      'F01',
      'F02',
      'F03',
      'F04',
      'F05',
      'F06',
      'F07',
    ]);
  });

  /** The flow with its first step also asking for `field`. */
  const asking = (id: string, field: string): Flow => {
    const base = flow(id);
    return {
      ...base,
      steps: base.steps.map((step, i) =>
        i === 0 ? { ...step, fields: [...step.fields, field] } : step,
      ),
    };
  };
  const firstStepFields = (doc: Flows, id: string) =>
    doc.flows.find((candidate) => candidate.id === id)?.steps[0]?.fields;

  it('gives two calls that both add FD06 an id each, and each call\'s steps follow its own', () => {
    const search = { ...isbn, noun: '', label: 'Search' };
    const doc = assemble(catalog, [
      { flows: [asking('F03', 'FD06')], newFields: [isbn], newForms: [] },
      { flows: [asking('F04', 'FD06')], newFields: [search], newForms: [] },
    ]);
    expect(doc.fields.map((field) => `${field.id} ${field.label}`)).toEqual(
      expect.arrayContaining(['FD06 ISBN', 'FD07 Search']),
    );
    expect(firstStepFields(doc, 'F03')).toContain('FD06');
    expect(firstStepFields(doc, 'F04')).toContain('FD07');
  });

  it('merges a new field equal to one another call added, even when its meaning is worded otherwise', () => {
    const doc = assemble(catalog, [
      { flows: [asking('F03', 'FD06')], newFields: [isbn], newForms: [] },
      {
        flows: [asking('F04', 'FD07')],
        newFields: [{ ...isbn, id: 'FD07', meaning: 'The book number' }],
        newForms: [],
      },
    ]);
    expect(doc.fields.filter((field) => field.label === 'ISBN')).toHaveLength(1);
    expect(firstStepFields(doc, 'F04')).toContain('FD06');
  });
});

describe('dropUnused', () => {
  it('drops the fields and forms no step asks for, and keeps the fields a used form holds', () => {
    const doc = dropUnused({
      ...flows,
      fields: [...flows.fields, { ...isbn, id: 'FD09' }],
      forms: [...flows.forms, { id: 'FM09', name: 'Unused', fields: ['FD09'] }],
    });
    expect(doc.fields).toEqual(flows.fields);
    expect(doc.forms).toEqual(flows.forms);
  });
});

