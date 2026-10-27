/**
 * Switch: an on/off setting that takes effect as soon as it's flipped, like
 * notifications or a public profile; its children are its label.
 *
 * When not to use:
 * - A choice that applies only when a form is submitted, or consent like
 *   "I agree": Checkbox.
 * - One choice out of a few options: ChipGroup `mode="single"`; out of a
 *   longer list, Select.
 * - Toggling filters above a list or table: ChipGroup `mode="multiple"`.
 * - Running an action, like "Send now": Button. A switch states a setting.
 *
 * Pitfalls:
 * - A switch is controlled: `checked` and `onCheckedChange`, both required.
 *   Save in `onCheckedChange`, and set `checked` back if the save fails.
 * - Every switch needs a name: its children are the label, or `aria-label` or
 *   `aria-labelledby` when the row around it says what it is.
 * - Say why it can't be flipped: `disabledWithReason` or
 *   `readOnlyWithReason`, not a bare `disabled`. A read-only switch keeps
 *   its tab stop, so its state can still be read.
 * - The label says what's on, not the action: "Email reminders", not "Turn
 *   on email reminders".
 */
import { Switch } from '@packages/ui/Switch';
import React, { useState } from 'react';

// Setup: stand-ins for your app's data and requests, not part of the pattern.
const sessions = [
  { id: 'keynote', title: 'Opening keynote', live: true },
  { id: 'design', title: 'Design systems at scale', live: false },
];

// Stands in for a request to the server.
const saveSetting = (on: boolean) =>
  new Promise<boolean>((resolve) => {
    setTimeout(() => resolve(on), 400);
  });

// Usage: the patterns to copy.
/**
 * A setting saved as it changes: the switch flips at once, and flips back if
 * the save fails. `hint` explains it, `tooltip` adds detail on hover and
 * focus.
 */
const EmailReminders = () => {
  const [on, setOn] = useState(true);

  const change = (next: boolean) => {
    setOn(next);
    saveSetting(next).catch(() => setOn(!next));
  };

  return (
    <Switch
      checked={on}
      onCheckedChange={change}
      hint="A day before each session you saved"
      tooltip="Sent to the address on your ticket"
    >
      Email reminders
    </Switch>
  );
};

/**
 * A switch per row, named by the row: `aria-labelledby` points at the
 * title, so the switch has no label of its own.
 */
const LiveSessions = () => {
  const [live, setLive] = useState(
    () =>
      new Set(sessions.filter((session) => session.live).map(({ id }) => id)),
  );

  const toggle = (id: string, on: boolean) =>
    setLive((current) => {
      const next = new Set(current);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  return (
    <ul className="flex-col-gap-2">
      {sessions.map((session) => (
        <li key={session.id} className="flex-row-gap-3 items-center">
          <span id={`session-${session.id}`} className="flex-fill-x">
            {session.title}
          </span>
          <Switch
            aria-labelledby={`session-${session.id}`}
            checked={live.has(session.id)}
            onCheckedChange={(on) => toggle(session.id, on)}
          />
        </li>
      ))}
    </ul>
  );
};

/**
 * Named without visible text: `aria-label`, where the screen around it shows
 * what it does, like a toolbar's dark-mode switch.
 */
const DarkPreview = () => {
  const [dark, setDark] = useState(false);
  return (
    <Switch
      aria-label="Dark preview"
      checked={dark}
      onCheckedChange={setDark}
    />
  );
};

/**
 * Switches that can't be flipped, each with its reason in the tooltip:
 * `disabledWithReason` while it doesn't apply, `readOnlyWithReason` when
 * someone else sets it. A bare `disabled` or `readOnly` gives no reason.
 */
const LockedSettings = ({ hasStarted = true }: { hasStarted?: boolean }) => {
  const [refunds, setRefunds] = useState(true);
  const [badgePhoto, setBadgePhoto] = useState(true);

  return (
    <div className="flex-col-gap-3">
      <Switch
        checked={refunds}
        onCheckedChange={setRefunds}
        disabledWithReason={
          hasStarted ? 'Refunds close when the event starts' : undefined
        }
      >
        Allow refunds
      </Switch>
      <Switch
        checked={badgePhoto}
        onCheckedChange={setBadgePhoto}
        readOnlyWithReason="Set by your organization"
      >
        Badge photo
      </Switch>
    </div>
  );
};

export default function SwitchRecipe() {
  return (
    <div className="flex-col-gap-6">
      <EmailReminders />
      <LiveSessions />
      <DarkPreview />
      <LockedSettings />
    </div>
  );
}
