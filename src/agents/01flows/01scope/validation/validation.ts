import type { Issue } from '../../../../core/issues';
import { type Rule, runRules } from '../../../../core/rules';
import type { Scope } from '../schema';
import { rule as scope001 } from './rules/scope-001-roles';
import { rule as scope002 } from './rules/scope-002-vocabulary';
import { rule as scope003 } from './rules/scope-003-questions';
import { rule as scope005 } from './rules/scope-005-ids';
import { rule as scope006 } from './rules/scope-006-summary-and-size';

// One file per rule in ./rules. To add a rule: create its file, import it here, add it to its list.

export const scopeRules: readonly Rule<Scope>[] = [
  scope001,
  scope002,
  scope003,
  scope005,
  scope006,
];

export const validateScope = (scope: Scope): Issue[] =>
  runRules(scopeRules, scope);
