/**
 * Event helpers from `@packages/utils/events`:
 * - `composeHandlers(handler, own)`: runs the caller's `handler`, then the
 *   component's `own` unless the handler called `event.preventDefault()`.
 * - `preventDefault` and `stopPropagation`: call the event's method, so they
 *   work as a handler (`onMouseDown={preventDefault}`). They take React and DOM
 *   events.
 *
 * Use `composeHandlers` when an app block wraps a design-system component and
 * still lets its caller pass the same handler and opt out of the block's own
 * behavior. Not for: a handler of your own that doesn't take the caller's
 * (call it directly), or a design-system component's props, which already
 * compose their own handlers.
 *
 * Pitfalls:
 * - The opt-out is `event.preventDefault()` in the caller's handler. A
 *   default already prevented before the handler ran, by a child as the
 *   event bubbled up, isn't an opt-out: `own` still runs.
 * - `composeHandlers` returns a new function on every render: pass it to a
 *   component, not to a hook's deps.
 * - `stopPropagation` hides the event from every ancestor's handler,
 *   including ones that close menus: stop only the event the parent would
 *   misread.
 */
import { Button, type ButtonProps } from '@packages/ui/Button';
import { Checkbox } from '@packages/ui/Checkbox';
import { Input } from '@packages/ui/Input';
import {
  composeHandlers,
  preventDefault,
  stopPropagation,
} from '@packages/utils/events';
import React, { useEffect, useRef, useState } from 'react';

// Usage: the patterns to copy.
/**
 * An app block around Button: Register counts a registration, unless the
 * caller's `onClick` calls `event.preventDefault()`.
 */
const RegisterButton = ({
  onClick,
  onRegister,
  ...props
}: ButtonProps & { onRegister: () => void }) => (
  <Button {...props} onClick={composeHandlers(onClick, onRegister)}>
    Register
  </Button>
);

/** The caller opts out for one case: the terms aren't accepted. */
const TermsRegistration = () => {
  const [accepted, setAccepted] = useState(false);
  const [registrations, setRegistrations] = useState(0);

  return (
    <div className="flex-col-gap-2 items-start">
      <Checkbox checked={accepted} onCheckedChange={setAccepted}>
        I accept the event terms
      </Checkbox>
      <RegisterButton
        onClick={(event) => {
          if (!accepted) event.preventDefault();
        }}
        onRegister={() => setRegistrations(registrations + 1)}
      />
      <p role="status">{registrations} registrations</p>
    </div>
  );
};

/**
 * `preventDefault` as a handler: pressing the button doesn't take focus from
 * the field, so typing carries on where it was.
 */
const AnnouncementField = () => {
  const [text, setText] = useState('');

  return (
    <div className="flex-row-gap-2 items-end">
      <Input
        label="Announcement"
        autoComplete="off"
        value={text}
        onChange={setText}
      />
      <Button
        variant="base"
        onMouseDown={preventDefault}
        onClick={() => setText(`${text} 🎉`)}
      >
        Add party emoji
      </Button>
    </div>
  );
};

/**
 * `stopPropagation`: the page has a "/" shortcut that jumps to search. In the
 * note field "/" is ordinary text, so the field stops its key events and the
 * shortcut never sees them.
 */
const NotesWithShortcut = () => {
  const searchRef = useRef<HTMLElement>(null);
  const [search, setSearch] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    const jumpToSearch = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.target === searchRef.current) return;
      event.preventDefault();
      searchRef.current?.focus();
    };

    window.addEventListener('keydown', jumpToSearch);
    return () => window.removeEventListener('keydown', jumpToSearch);
  }, []);

  return (
    <div className="flex-col-gap-2">
      <Input
        ref={searchRef}
        label="Search sessions (press /)"
        autoComplete="off"
        value={search}
        onChange={setSearch}
      />
      <Input
        label="Session note"
        autoComplete="off"
        value={note}
        onChange={setNote}
        onKeyDown={stopPropagation}
      />
    </div>
  );
};

export default function EventsRecipe() {
  return (
    <div className="flex-col-gap-4">
      <TermsRegistration />
      <AnnouncementField />
      <NotesWithShortcut />
    </div>
  );
}
