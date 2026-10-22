/**
 * Button: an action. `default` is the main action of a view (one per view),
 * `base` a secondary one, `danger` one that deletes or can't be undone.
 * `look="ghost"` makes any of them quiet, for toolbars and rows.
 */
import { Button, IconButton } from '@packages/ui/Button';
import { Play, Plus, Settings, Trash2 } from 'lucide-react';
import React, { useState } from 'react';

/** A form's actions: the main one last, the secondary one `base`. */
const FormActions = () => (
  <div className="flex-row-gap-2 flex-wrap">
    <Button variant="base">Cancel</Button>
    <Button type="submit">Save</Button>
  </div>
);

/**
 * With an icon: `leftIcon` before the label, `rightIcon` after it.
 * `size="md"` sits beside md inputs.
 */
const WithIcon = () => (
  <Button leftIcon={<Plus />} size="md">
    New event
  </Button>
);

/**
 * Saving: `loading` shows a spinner in place of the icon, and the button
 * can't be pressed again until it's done. `loadingWithReason` does too and
 * says why on hover. Set one of the two, not both.
 */
const Saving = () => {
  const [saving, setSaving] = useState(false);
  return (
    <Button
      loadingWithReason={saving ? 'Saving your changes' : undefined}
      onClick={() => setSaving(true)}
    >
      Save
    </Button>
  );
};

/**
 * Play and stop in one button: `disableWhileLoading={false}` keeps it
 * pressable while loading, so the press that started it can stop it.
 */
const RunAndStop = () => {
  const [running, setRunning] = useState(false);
  return (
    <Button
      leftIcon={<Play />}
      // here we are not disabling when loading, so loading reason is not mandatory
      loading={running}
      disableWhileLoading={false}
      onClick={() => setRunning(!running)}
    >
      {running ? 'Stop' : 'Run'}
    </Button>
  );
};

/**
 * Unavailable: `disabledWithReason` disables it and says why on hover. Plain
 * `disabled` needs a comment saying why there's no reason.
 */
const Unavailable = () => (
  <Button disabledWithReason="Add a date before publishing">Publish</Button>
);

/**
 * Icon only: `IconButton` needs `aria-label`; a `tooltip` shows the same
 * name to sighted users.
 */
const IconOnly = () => (
  <div className="flex-row-gap-2">
    <IconButton
      variant="base"
      look="ghost"
      aria-label="Settings"
      tooltip="Settings"
    >
      <Settings />
    </IconButton>
    <IconButton variant="danger" aria-label="Delete event" tooltip="Delete">
      <Trash2 />
    </IconButton>
  </div>
);

export default function ButtonRecipe() {
  return (
    <div className="flex-col-gap-4 items-start">
      <FormActions />
      <WithIcon />
      <Saving />
      <RunAndStop />
      <Unavailable />
      <IconOnly />
    </div>
  );
}
