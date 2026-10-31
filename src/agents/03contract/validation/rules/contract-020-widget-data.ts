import type { Issue } from '../../../../core/issues';
import { defineRule } from '../../../../core/rules';
import { RECORD_FIELDS } from '../../schema';
import type { ContractInput } from '../helpers';

/**
 * CONTRACT-020 · mandatory
 * Every value a widget shows is a field of the entity for its noun, and the
 * widget's entry in widgets reads that entity through a list or get; a widget
 * that repeats over a noun reads its list. A form whose flow creates the
 * record shows what the user types in, so it reads nothing for it. Entries
 * name catalog widgets and list or get operations.
 * Pass: W06 shows Book.title and reads listBooks.
 * Fail: W06 has no entry.
 */
const RECORD = new Set<string>(RECORD_FIELDS);
const flowOf = (step: string) => step.split('.')[0] ?? '';

export const rule = defineRule<ContractInput>(
  'CONTRACT-020',
  'mandatory',
  ({ contract, widgets }, fail) => {
    const issues: Issue[] = [];
    const ops = new Map(contract.operations.map((op) => [op.id, op]));
    const ids = new Set(widgets.map((w) => w.id));
    for (const entry of contract.widgets) {
      if (!ids.has(entry.widget))
        issues.push(fail(`widgets names ${entry.widget}, which is not a widget of the catalog.`, entry.widget));
      for (const id of entry.reads) {
        const kind = ops.get(id)?.kind;
        if (kind !== 'list' && kind !== 'get')
          issues.push(fail(`${entry.widget} reads ${id}, which is not a list or get operation.`, entry.widget));
      }
    }
    for (const widget of widgets) {
      const reads = contract.widgets
        .filter((entry) => entry.widget === widget.id)
        .flatMap((entry) => entry.reads.flatMap((id) => ops.get(id) ?? []));
      const flows = new Set(widget.flowSteps.map(flowOf));
      const created = (entity: string) =>
        contract.operations.some(
          (op) => op.entity === entity && op.kind === 'create' && op.flowSteps.some((s) => flows.has(flowOf(s))),
        );
      const shown = new Map<string, Set<string>>(widget.repeat ? [[widget.repeat, new Set()]] : []);
      for (const value of widget.data) {
        const [noun = '', attribute = ''] = value.split('.');
        shown.set(noun, (shown.get(noun) ?? new Set()).add(attribute));
      }
      for (const [noun, attributes] of shown) {
        const entity = contract.entities.find((e) => e.noun === noun);
        if (!entity) {
          issues.push(fail(`${widget.id} shows ${noun}, but no entity implements it; add one.`, widget.id));
          continue;
        }
        for (const attribute of attributes)
          if (!RECORD.has(attribute) && !entity.fields.some((f) => f.name === attribute))
            issues.push(
              fail(`${widget.id} shows ${noun}.${attribute}, but ${entity.name} has no field ${attribute}; add it.`, widget.id),
            );
        if (noun === widget.repeat) {
          if (!reads.some((op) => op.entity === entity.name && op.kind === 'list'))
            issues.push(
              fail(`${widget.id} repeats over ${noun}, but none of its reads lists ${entity.name}; add a list operation on ${entity.name}.`, widget.id),
            );
        } else if (!reads.some((op) => op.entity === entity.name) && !created(entity.name))
          issues.push(
            fail(
              `${widget.id} shows ${entity.name} records, but nothing loads them for it; add a list or get operation on ${entity.name} to its reads in widgets.`,
              widget.id,
            ),
          );
      }
    }
    return issues;
  },
);
