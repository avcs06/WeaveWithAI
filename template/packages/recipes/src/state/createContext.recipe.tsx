/**
 * createContext: a context for a component tree, with its provider and hook
 * (`[Provider, useValue]`). For values a parent passes down to parts at any
 * depth: a form section's size and lock, a reply's depth, the organizer.
 * Outside any provider the hook returns the defaults.
 *
 * Not for: state many unrelated components change (createStore), state per
 * instance with actions (createStoreContext), or a value passed one level
 * down (a prop).
 *
 * Pitfalls:
 * - An object takes each key as a prop. List every key in the defaults,
 *   `undefined` included: only those update consumers. A missing key is
 *   passed on, but changing it alone updates nothing.
 * - Anything else takes `value`, compared as React does: a number, a
 *   function, an array, and an object type that can be `null`.
 * - A value that changes every render (an inline function, a new array)
 *   updates every consumer every render: pass a stable one, or use a store.
 * - Consumers outside a provider silently get the defaults: when a missing
 *   provider is a bug, use a nullable default and check it.
 */
import { Button } from '@packages/ui/Button';
import { Input } from '@packages/ui/Input';
import { createContext } from '@packages/utils/state';
import React, { type ReactNode, useState } from 'react';

// Setup: stand-ins for your app's data and requests, not part of the pattern.
const organizer: Organizer = { name: 'Riverside Events' };

// Usage: the patterns to copy.
type SectionOptions = { size: 'sm' | 'md'; readOnlyReason: string | undefined };

/** An object: the provider takes each key as a prop. */
const [SectionOptionsProvider, useSectionOptions] =
  createContext<SectionOptions>({ size: 'md', readOnlyReason: undefined });

const SectionInput = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) => {
  const { size, readOnlyReason } = useSectionOptions();

  return (
    <Input
      label={label}
      autoComplete="off"
      size={size}
      {...(readOnlyReason ? { readOnlyWithReason: readOnlyReason } : {})}
      value={value}
      onChange={onChange}
    />
  );
};

/**
 * Settings every field of a section follows, here the size and a lock with
 * its reason, without passing them to each field.
 */
const VenueSection = ({ published }: { published: boolean }) => {
  const [name, setName] = useState('Riverside Hall');
  const [city, setCity] = useState('Lisbon');

  return (
    <SectionOptionsProvider
      size="sm"
      readOnlyReason={published ? 'Venue is fixed once published' : undefined}
    >
      <div className="flex-col-gap-2">
        <SectionInput label="Venue name" value={name} onChange={setName} />
        <SectionInput label="City" value={city} onChange={setCity} />
      </div>
    </SectionOptionsProvider>
  );
};

/** Outside a provider the defaults apply: a medium, editable field. */
const OrganizerNote = () => {
  const [note, setNote] = useState('');
  return (
    <SectionInput label="Note to attendees" value={note} onChange={setNote} />
  );
};

/**
 * A single value: the provider takes `value`. A nested provider overrides its
 * parent for its subtree, so each reply is one level deeper.
 */
const [ThreadDepthProvider, useThreadDepth] = createContext(0);

const Reply = ({
  author,
  children,
}: {
  author: string;
  children?: ReactNode;
}) => {
  const depth = useThreadDepth() + 1;

  return (
    <ThreadDepthProvider value={depth}>
      <div className="flex-col-gap-1">
        <p>
          {author}, reply level {depth}
        </p>
        {children && <div className="flex-col-gap-1 pl-4">{children}</div>}
      </div>
    </ThreadDepthProvider>
  );
};

const Thread = () => (
  <Reply author="Ada Lovelace">
    <Reply author="Grace Hopper">
      <Reply author="Alan Turing" />
    </Reply>
  </Reply>
);

type Organizer = { name: string };

/**
 * An object type that can be `null`: pass it as `value`. The default says
 * "no organizer", and consumers handle it.
 */
const [OrganizerProvider, useOrganizer] = createContext<Organizer | null>(null);

const HostedBy = () => {
  const host = useOrganizer();
  return host ? <p>Hosted by {host.name}</p> : null;
};

/** A function: the callback a part calls, kept stable by the provider's owner. */
const [RegisterProvider, useRegister] = createContext<(id: string) => void>(
  () => undefined,
);

const SessionRow = ({ id, title }: { id: string; title: string }) => {
  const register = useRegister();
  return (
    <li>
      {title}{' '}
      <Button variant="base" onClick={() => register(id)}>
        Add {title} to my agenda
      </Button>
    </li>
  );
};

/** An array: consumers re-render when the array itself is replaced. */
const [AgendaProvider, useAgenda] = createContext<readonly string[]>([]);

const AgendaCount = () => (
  <p role="status">{useAgenda().length} sessions saved</p>
);

const SessionPicker = () => {
  const [agenda, setAgenda] = useState<readonly string[]>([]);
  const register = (id: string) =>
    setAgenda((current) => (current.includes(id) ? current : [...current, id]));

  return (
    <RegisterProvider value={register}>
      <AgendaProvider value={agenda}>
        <ul>
          <SessionRow id="keynote" title="Opening keynote" />
          <SessionRow id="panel" title="Ticketing panel" />
        </ul>
        <AgendaCount />
      </AgendaProvider>
    </RegisterProvider>
  );
};

export default function CreateContextRecipe() {
  return (
    <div className="flex-col-gap-4">
      <VenueSection published />
      <OrganizerNote />
      <Thread />
      <OrganizerProvider value={organizer}>
        <HostedBy />
      </OrganizerProvider>
      <HostedBy />
      <SessionPicker />
    </div>
  );
}
