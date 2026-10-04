/**
 * Icons: lucide-react for everything. These three replace their lucide
 * counterparts, so every control draws them the same way. Size icons with an
 * `icon-size-*` class (body, label, heading, …) to match the text beside them.
 */
import { CheckIcon, LoadingIcon, MinusIcon } from '@packages/ui/Icons';
import React from 'react';

/** Work in progress: LoadingIcon spins and is named "Loading". */
const InProgress = () => (
  <div className="flex-row-gap-2 items-center">
    <LoadingIcon className="icon-size-body" />
    <span>Saving…</span>
  </div>
);

/** Done and partly done: CheckIcon and MinusIcon, as in checkboxes. */
const DoneAndPartial = () => (
  <div className="flex-col-gap-2">
    <div className="flex-row-gap-2 items-center">
      <CheckIcon className="icon-size-body" />
      <span>Saved</span>
    </div>
    <div className="flex-row-gap-2 items-center">
      <MinusIcon className="icon-size-body" />
      <span>2 of 5 synced</span>
    </div>
  </div>
);

export default function IconsRecipe() {
  return (
    <div className="flex-col-gap-6">
      <InProgress />
      <DoneAndPartial />
    </div>
  );
}
