import type { Issue } from '../../../../core/issues';
import { type Rule, runRules } from '../../../../core/rules';
import type { Scope } from '../../../01flows/01scope/schema';
import type { Flows } from '../../../01flows/schema';
import type { Architecture } from '../schema';
import type { ArchitectureInput } from './helpers';
import { rule as arch001 } from './rules/arch-001-trace';

// One file per rule in ./rules. To add a rule: create its file, import it here, add it to the list.

export const architectureRules: readonly Rule<ArchitectureInput>[] = [arch001];

/** The architect's answer against the scope and the flows it was written from. */
export function validateArchitecture(architecture: Architecture, scope: Scope, flows: Flows): Issue[] {
  return runRules(architectureRules, { architecture, scope, flows });
}
