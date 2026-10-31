import type { Issue } from '../../../../core/issues';
import { type Rule, runRules } from '../../../../core/rules';
import type { Scope } from '../../../01flows/01scope/schema';
import type { Brief } from '../schema';
import type { BriefInput } from './helpers';
import { rule as brief001 } from './rules/brief-001-ranges';
import { rule as brief002 } from './rules/brief-002-entities';
import { rule as brief003 } from './rules/brief-003-hues-apart';

// One file per rule in ./rules. To add a rule: create its file, import it here, add it to its list.

export const briefRules: readonly Rule<BriefInput>[] = [
  brief001,
  brief002,
  brief003,
];

export function validateBrief(brief: Brief, scope: Scope): Issue[] {
  return runRules(briefRules, { brief, scope });
}
