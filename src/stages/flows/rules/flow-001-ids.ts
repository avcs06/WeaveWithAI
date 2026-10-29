/**
 * FLOW-001 · mandatory
 * Flow ids are F01, F02, ...; step ids F01.S01 and alternative ids F01.A01 start with their flow's id; no id is used twice.
 * Pass: { id: 'F03', steps: [{ id: 'F03.S01' }], alternatives: [{ id: 'F03.A01' }] }
 * Fail: { id: 'F3' } · step 'F01-S01' · step 'F02.S01' inside flow F03 · 'F03.S01' used twice
 */
import type { Issue } from '../../../core/issues';
import { defineRule, duplicates } from '../../../core/rules';
import type { FlowInput } from './helpers';

export const FLOW_ID = /^F\d{2,}$/;
export const STEP_ID = /^F\d{2,}\.S\d{2,}$/;
export const ALTERNATIVE_ID = /^F\d{2,}\.A\d{2,}$/;

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
    for (const flow of flows.flows) {
      if (!FLOW_ID.test(flow.id))
        issues.push(
          fail(`Flow id "${flow.id}" is malformed; use F01, F02, ...`, flow.id),
        );
      const groups: {
        items: { id: string }[];
        pattern: RegExp;
        letter: string;
      }[] = [
        { items: flow.steps, pattern: STEP_ID, letter: 'S' },
        { items: flow.alternatives, pattern: ALTERNATIVE_ID, letter: 'A' },
      ];
      for (const { items, pattern, letter } of groups) {
        for (const item of items) {
          if (!pattern.test(item.id) || !item.id.startsWith(`${flow.id}.`)) {
            issues.push(
              fail(
                `Id "${item.id}" in ${flow.id} is malformed; use ${flow.id}.${letter}01, ${flow.id}.${letter}02, ...`,
                item.id,
              ),
            );
          }
        }
        for (const id of duplicates(items, (item) => item.id)) {
          issues.push(
            fail(
              `Id "${id}" appears twice in ${flow.id}; renumber so every id is unique.`,
              id,
            ),
          );
        }
      }
    }
    return issues;
  },
);
