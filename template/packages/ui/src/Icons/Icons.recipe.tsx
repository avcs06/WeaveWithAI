/**
 * Icons: LoadingIcon, CheckIcon and MinusIcon, which replace their lucide
 * counterparts so every control draws them the same way. Any other icon comes
 * from lucide-react. Size them with an `icon-size-*` class (body, label,
 * heading, …) to match the text beside them, not lucide's `size` prop.
 *
 * When not to use:
 * - A control that loads: Button, IconButton and Select have `loading` and
 *   `loadingWithReason`, which draw the spinner and disable the control. Never
 *   put a LoadingIcon inside one.
 *
 * Pitfalls:
 * - The icons are hidden from assistive tech. One that carries meaning alone
 *   needs `role="img"` and an `aria-label`.
 * - A spinner is silent: keep it with its text in a `role="status"` element
 *   that is already on the page when the work starts, so the change is read.
 */
import { CheckIcon, LoadingIcon, MinusIcon } from '@packages/ui/Icons';
import { Input } from '@packages/ui/Input';
import React, { useState } from 'react';

// Usage: the patterns to copy.
/**
 * Work in progress beside text, here an autosave: the status element is on
 * the page from the start and announces its text as it changes; the spinner
 * stays hidden because the text says it.
 */
const AutosaveStatus = () => {
  const [title, setTitle] = useState('Launch party');
  const [saving, setSaving] = useState(false);

  const save = (next: string) => {
    setTitle(next);
    setSaving(true);
    setTimeout(() => setSaving(false), 800);
  };

  return (
    <div className="flex-col-gap-2 items-start">
      <Input
        label="Event title"
        autoComplete="off"
        delay={500}
        value={title}
        onChange={save}
      />
      <div role="status" className="flex-row-gap-2 items-center">
        {saving ? (
          <>
            <LoadingIcon className="icon-size-body" />
            <span>Saving…</span>
          </>
        ) : (
          'All changes saved'
        )}
      </div>
    </div>
  );
};

/** A spinner with no text beside it: `aria-label` names it. */
const Standalone = () => (
  <div role="status">
    <LoadingIcon className="icon-size-body" aria-label="Loading attendees" />
  </div>
);

/**
 * A glyph that carries the meaning in a cell with no text: `role="img"` and
 * an `aria-label`. Here, ticket features.
 */
const TicketFeatures = () => (
  <dl className="flex-col-gap-2">
    <div className="flex-row-gap-2 items-center">
      <dt>Workshop access</dt>
      <dd>
        <CheckIcon
          className="icon-size-body"
          role="img"
          aria-label="Included"
        />
      </dd>
    </div>
    <div className="flex-row-gap-2 items-center">
      <dt>Recordings</dt>
      <dd>
        <MinusIcon
          className="icon-size-body"
          role="img"
          aria-label="Not included"
        />
      </dd>
    </div>
  </dl>
);

/** Beside text that says it already: the icon stays hidden. */
const BesideText = () => (
  <div className="flex-col-gap-2">
    <div className="flex-row-gap-2 items-center">
      <CheckIcon className="icon-size-body" />
      <span>Saved</span>
    </div>
    <div className="flex-row-gap-2 items-center">
      <MinusIcon className="icon-size-body" />
      <span>Recordings not included</span>
    </div>
  </div>
);

export default function IconsRecipe() {
  return (
    <div className="flex-col-gap-6">
      <AutosaveStatus />
      <Standalone />
      <TicketFeatures />
      <BesideText />
    </div>
  );
}
