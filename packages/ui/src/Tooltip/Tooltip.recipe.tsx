/**
 * Tooltip: a short hint on hover and focus. Controls take a `tooltip` prop
 * themselves; wrap other elements in `Tooltip`. The trigger must be focusable
 * so keyboard users can reach the hint.
 */
import { Button } from '@packages/ui/Button';
import { Tooltip } from '@packages/ui/Tooltip';
import React from 'react';

/** A hint for a control whose label doesn't say everything. */
const Hint = () => (
  <Tooltip tooltip="Saves a draft you can publish later">
    <Button variant="base">Save</Button>
  </Tooltip>
);

/**
 * Several messages: an array stacks them 8px apart, in order, like a
 * control's tooltip above its disabled reason. Empty entries are skipped.
 */
const Stacked = () => (
  <Tooltip tooltip={['Saves a draft', 'Offline: saved on this device']}>
    <Button variant="base">Save offline</Button>
  </Tooltip>
);

/** `side` places it: `top` (default), `right`, `bottom` or `left`. */
const Side = () => (
  <Tooltip tooltip="Opens the event's settings" side="right">
    <Button variant="base">Settings</Button>
  </Tooltip>
);

export default function TooltipRecipe() {
  return (
    <div className="flex-row-gap-4 items-center flex-wrap">
      <Hint />
      <Stacked />
      <Side />
    </div>
  );
}
