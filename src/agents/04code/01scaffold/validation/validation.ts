import type { Issue } from '../../../../core/issues';
import { type Rule, runRules } from '../../../../core/rules';
import { type AppliedInput, rule as theme003 } from './rules/theme-003-applied';

const scaffoldRules: readonly Rule<AppliedInput>[] = [theme003];

export function validateApplied(input: AppliedInput): Issue[] {
  return runRules(scaffoldRules, input);
}
