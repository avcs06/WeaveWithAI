import type { Issue } from '../../../core/issues';
import { type Rule, runRules } from '../../../core/rules';
import type { Contract } from '../schema';
import type { ContractInput } from './helpers';
import { rule as contract001 } from './rules/contract-001-names';
import { rule as contract002 } from './rules/contract-002-references';
import { rule as contract003 } from './rules/contract-003-nouns';
import { rule as contract004 } from './rules/contract-004-reserved';
import { rule as contract007 } from './rules/contract-007-inputs';
import { rule as contract010 } from './rules/contract-010-coverage';
import { rule as contract011 } from './rules/contract-011-effects';

// One file per rule in ./rules. To add a rule: create its file, import it here, add it to the list.

export type ContractContext = Omit<ContractInput, 'contract'>;

export const contractRules: readonly Rule<ContractInput>[] = [
  contract001,
  contract002,
  contract003,
  contract004,
  contract007,
  contract010,
  contract011,
];

export function validateContract(contract: Contract, ctx: ContractContext): Issue[] {
  return runRules(contractRules, { contract, ...ctx });
}
