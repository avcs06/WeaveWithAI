import type { Subflow } from '../stages/flows/schema';

/**
 * Subflows every app has, written once here and present in every catalog, so the model reuses them by id instead of
 * writing its own. Their ids have their own prefix, STD01, STD02, ..., so they never collide with the model's SF01,
 * SF02, ...; design-system subflows join with source 'design-system' and the prefix DS. Conventions: the step that runs
 * a subflow carries the effects the subflow applies to this flow's records (STD01 deletes the record named there); an
 * alternative inside the subflow with `resumesAt: ""` hands back to the calling flow, whose own alternatives of the same
 * kind from that step say what the website shows next. Without them the flow continues after "confirm" and ends after
 * "cancel", "denied" or "notFound".
 */
export type StandardSubflow = Subflow & {
  source: 'standard' | 'design-system';
  /** How a flow uses it; goes to the model with the id and name, so the prompt text itself names no subflow. */
  use: string;
};

export const STANDARD_SUBFLOWS: readonly StandardSubflow[] = [
  {
    id: 'STD01',
    name: 'Confirm deletion',
    source: 'standard',
    use: 'the step where the user chooses to delete runs it: its userAction is that choice, its effects the delete; confirm and cancel both hand back to the flow that ran it, which continues after confirm and ends after cancel; add confirm or cancel alternatives from that step only when the website shows something afterwards',
    steps: [
      {
        id: 'STD01.S01',
        kind: 'system',
        userAction: '',
        websiteResponse:
          'The website asks to confirm the deletion and says what else will be removed with it.',
        fields: [],
        form: '',
        subflow: '',
        effects: [],
      },
    ],
    alternatives: [
      {
        id: 'STD01.A01',
        from: 'STD01.S01',
        kind: 'confirm',
        condition: 'The user confirms.',
        websiteResponse:
          'The website deletes the record and what belongs to it.',
        resumesAt: '',
      },
      {
        id: 'STD01.A02',
        from: 'STD01.S01',
        kind: 'cancel',
        condition: 'The user cancels.',
        websiteResponse: 'Nothing is deleted; the record stays as it was.',
        resumesAt: '',
      },
    ],
  },
];

/** A registry id, so the rules accept it where a model-written subflow id must be SF01, SF02, ... */
export const isStandardSubflowId = (id: string): boolean =>
  STANDARD_SUBFLOWS.some((subflow) => subflow.id === id);

/** One line per standard subflow with its use, for the catalog message. */
export const standardSubflowList = (): string =>
  STANDARD_SUBFLOWS.map(
    (subflow) => `${subflow.id} ${subflow.name}: ${subflow.use}`,
  ).join('; ');

/** The subflows as the flows schema knows them, without the registry's own fields. */
export const standardSubflows = (): Subflow[] =>
  STANDARD_SUBFLOWS.map(
    ({ source: _source, use: _use, ...subflow }) => subflow,
  );

/** The standard subflows first, then the document's own; a standard id written by the model is replaced by ours. */
export function withStandardSubflows<T extends { subflows: Subflow[] }>(
  doc: T,
): T {
  return {
    ...doc,
    subflows: [
      ...standardSubflows(),
      ...doc.subflows.filter((subflow) => !isStandardSubflowId(subflow.id)),
    ],
  };
}
