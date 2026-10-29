/**
 * FLOW-001 · mandatory
 * Flow ids are F01, F02, ... and subflow ids SF01, SF02, ...; step ids F01.S01 and alternative ids F01.A01 start with their container's id; no id is used twice.
 * Pass: { id: 'F03', steps: [{ id: 'F03.S01' }], alternatives: [{ id: 'F03.A01' }] } · a subflow { id: 'SF01', steps: [{ id: 'SF01.S01' }] }
 * Fail: { id: 'F3' } · step 'F01-S01' · step 'F02.S01' inside flow F03 · 'F03.S01' used twice
 */
import type { Issue } from '../../../core/issues';
import { defineRule, duplicates } from '../../../core/rules';
import { containers, type FlowInput } from './helpers';

export const FLOW_ID = /^F\d{2,}$/;
export const SUBFLOW_ID = /^SF\d{2,}$/;
const CHILD_ID = /^S?F\d{2,}\.[SA]\d{2,}$/;

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
      if (!SUBFLOW_ID.test(subflow.id))
        issues.push(
          fail(
            `Subflow id "${subflow.id}" is malformed; use SF01, SF02, ...`,
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
        for (const item of items) {
          if (
            !CHILD_ID.test(item.id) ||
            !item.id.startsWith(`${container.id}.${letter}`)
          ) {
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
