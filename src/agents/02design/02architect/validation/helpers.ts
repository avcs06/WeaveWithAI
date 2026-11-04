import type { Scope } from '../../../01flows/01scope/schema';
import type { Flows } from '../../../01flows/schema';
import type { Architecture } from '../schema';

export type ArchitectureInput = { architecture: Architecture; scope: Scope; flows: Flows };
