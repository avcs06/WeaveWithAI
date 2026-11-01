import type { Issue } from '../../../../core/issues';
import { type Rule, runRules } from '../../../../core/rules';
import { rule as seed001, type SeedInput } from './rules/seed-001-refs';

export const seedRules: readonly Rule<SeedInput>[] = [seed001];

export function validateSeed(input: SeedInput): Issue[] {
  return runRules(seedRules, input);
}
