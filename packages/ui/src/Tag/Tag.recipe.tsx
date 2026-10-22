/**
 * Tag: a short label for a status, a category or a chosen filter. Its label
 * stays on one line; cut text shows in full on hover.
 */
import { Tag } from '@packages/ui/Tag';
import { CircleCheck } from 'lucide-react';
import React, { useState } from 'react';

/** Status: a status variant, `size="xs"` in table rows and dense lists. */
const Status = () => (
  <div className="flex-row-gap-2 flex-wrap">
    <Tag size="xs" variant="success" leftIcon={<CircleCheck />}>
      Paid
    </Tag>
    <Tag size="xs" variant="warning">
      Pending
    </Tag>
    <Tag size="xs" variant="error">
      Refunded
    </Tag>
  </div>
);

/**
 * Chosen filters: `closable` with `onClose` removes one; its close button is
 * read as "Remove" and the label. `disabledWithReason` keeps one that can't be
 * removed and says why on hover.
 */
const ChosenFilters = () => {
  const [teams, setTeams] = useState(['Design', 'Engineering', 'Sales']);
  const remove = (team: string) =>
    setTeams((current) => current.filter((entry) => entry !== team));

  return (
    <div className="flex-row-gap-2 flex-wrap">
      <Tag closable disabledWithReason="Set by your workspace">
        Region: Europe
      </Tag>
      {teams.map((team) => (
        <Tag key={team} closable onClose={() => remove(team)}>
          {team}
        </Tag>
      ))}
    </div>
  );
};

/** Category with a count: `rightAddOn`, an element, follows the label. */
const WithCount = () => (
  <Tag variant="default" rightAddOn={<span>12</span>}>
    Engineering
  </Tag>
);

export default function TagRecipe() {
  return (
    <div className="flex-col-gap-6">
      <Status />
      <ChosenFilters />
      <WithCount />
    </div>
  );
}
