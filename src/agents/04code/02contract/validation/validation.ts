import type { Issue } from '../../../../core/issues';
import { type Rule, runRules } from '../../../../core/rules';
import { rule as seed001, type SeedInput } from './rules/seed-001-refs';
import { rule as seed002 } from './rules/seed-002-rows';
import { rule as seed003 } from './rules/seed-003-required';
import { rule as seed004 } from './rules/seed-004-dates';

const seedRules: readonly Rule<SeedInput>[] = [seed001, seed002, seed003, seed004];

export function validateSeed(input: SeedInput): Issue[] {
  return runRules(seedRules, input);
}
