/**
 * FLOW-001 · mandatory
 * Flow ids are F01, F02, ... and subflow ids SF01, SF02, ... (standard subflows keep their registry ids, STD01, ...); step ids F01.S01 and alternative ids F01.A01 start with their container's id; no id is used twice.
 * Pass: { id: 'F03', steps: [{ id: 'F03.S01' }], alternatives: [{ id: 'F03.A01' }] } · a subflow { id: 'SF01', steps: [{ id: 'SF01.S01' }] } · the standard { id: 'STD01' }
 * Fail: { id: 'F3' } · a subflow { id: 'STD09' } that is not in the registry · step 'F01-S01' · step 'F02.S01' inside flow F03 · 'F03.S01' used twice
 */
import type { Issue } from '../../../core/issues';
import { isStandardSubflowId } from '../config/subflows';
import { defineRule, duplicates } from '../../../core/rules';
import { containers, type FlowInput } from './helpers';

export const FLOW_ID = /^F\d{2,}$/;
/** A model-written subflow id; the standard subflows keep their registry ids. */
export const SUBFLOW_ID = /^SF\d{2,}$/;
export const isSubflowId = (id: string): boolean =>
  SUBFLOW_ID.test(id) || isStandardSubflowId(id);

export const rule = defineRule<FlowInput>(
  'FLOW-001',
  'mandatory',
  ({ flows }, fail) => {
    const issues: Issue[] = [];
    for (const id of duplicates(flows.flows, (flow) => flow.id)) {
      issues.push(
        fail(
          `Flow id "${id}" is used by more than one flow; number flows F01, F02, ... once each.`,
          id,
        ),
      );
    }
    for (const id of duplicates(flows.subflows, (subflow) => subflow.id)) {
      issues.push(
        fail(
          `Subflow id "${id}" is used more than once; number subflows SF01, SF02, ... once each.`,
          id,
        ),
      );
    }
    for (const flow of flows.flows) {
      if (!FLOW_ID.test(flow.id))
        issues.push(
          fail(`Flow id "${flow.id}" is malformed; use F01, F02, ...`, flow.id),
        );
    }
    for (const subflow of flows.subflows) {
      if (!isSubflowId(subflow.id))
        issues.push(
          fail(
            `Subflow id "${subflow.id}" is malformed; use SF01, SF02, ... (the standard subflows keep their own ids).`,
            subflow.id,
          ),
        );
    }
    for (const container of containers(flows)) {
      const groups: { items: { id: string }[]; letter: string }[] = [
        { items: container.steps, letter: 'S' },
        { items: container.alternatives, letter: 'A' },
      ];
      for (const { items, letter } of groups) {
        const childId = new RegExp(`^${container.id}\\.${letter}\\d{2,}$`);
        for (const item of items) {
          if (!childId.test(item.id)) {
            issues.push(
              fail(
                `Id "${item.id}" in ${container.id} is malformed; use ${container.id}.${letter}01, ${container.id}.${letter}02, ...`,
                item.id,
              ),
            );
          }
        }
        for (const id of duplicates(items, (item) => item.id)) {
          issues.push(
            fail(
              `Id "${id}" appears twice in ${container.id}; renumber so every id is unique.`,
              id,
            ),
          );
        }
      }
    }
    return issues;
  },
);
