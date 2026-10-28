/**
 * Avatar: a round picture of a person, or their initials without one. Use it
 * beside a name in lists, tables and headers,
 * or on its own for a row of attendees or a profile control.
 *
 * When not to use:
 * - A picture that isn't a person (an event cover, a venue): a plain image.
 * - An avatar that opens something: put it in a Link or Button, don't give
 *   the Avatar an `onClick`.
 *
 * Pitfalls:
 * - It is hidden from assistive tech by default, since the name beside it
 *   is read already. Alone, pass `aria-hidden={false}` so each one is read,
 *   and it takes a tab stop to show its name; inside a link or button it
 *   takes none. The name tooltip shows only then, not beside a visible name.
 * - An empty `name` shows "?" and is always hidden.
 * - The initials are the first letters of the first and last words of
 *   `name`: "Ada Byron Lovelace" is "AL"; one word gives its first letter.
 * - A photo that fails to load falls back to the initials.
 * - Pictures sit in a `<ul role="list" aria-label="…">` when there are
 *   several, so screen readers count them.
 */
import { Avatar } from '@packages/ui/Avatar';
import { PlainButton } from '@packages/ui/Button';
import { Dropdown } from '@packages/ui/Dropdown';
import { Link } from '@packages/ui/Link';
import { Select, SelectOption } from '@packages/ui/Select';
import { Truncate } from '@packages/ui/Truncate';
import React, { useState } from 'react';

// Setup: stand-ins for your app's data and requests, not part of the pattern.
// Mock data: a small inline picture standing in for an uploaded photo.
const photo = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="hsl(210 55% 55%)"/><circle cx="32" cy="25" r="12" fill="white" fill-opacity="0.85"/><rect x="10" y="42" width="44" height="32" rx="16" fill="white" fill-opacity="0.85"/></svg>',
)}`;

// A photo that fails to load: data that isn't an image, so no request.
const brokenPhoto = 'data:,not-an-image';

const attendees = ['Ada Lovelace', 'Grace Hopper', 'Alan Turing'];

// Usage: the patterns to copy.
/**
 * Beside a name: `size="sm"` in table rows and dense lists. It stays hidden
 * from screen readers, since the name beside it is read already.
 */
const BesideName = () => (
  <div className="flex-row-gap-2 items-center min-w-0">
    <Avatar size="sm" name="Ada Lovelace" />
    <Truncate>Ada Lovelace</Truncate>
  </div>
);

/**
 * On its own, like a row of attendees with no names shown: `aria-hidden={false}`
 * makes each one read and focusable, and shows its name in a tooltip, so
 * keyboard users can reach the name.
 */
const OnItsOwn = () => (
  // eslint-disable-next-line jsx-a11y/no-redundant-roles -- Safari drops list semantics once list-style is none.
  <ul role="list" aria-label="Attendees" className="flex-row-gap-2">
    {attendees.map((name) => (
      <li key={name}>
        <Avatar name={name} aria-hidden={false} />
      </li>
    ))}
  </ul>
);

/**
 * Avatar alone in a link: the control carries the label, so the Avatar stays
 * hidden and doesn't repeat it.
 */
const ProfileLink = () => (
  <Link href="/profile" aria-label="Your profile">
    <Avatar name="Ada Lovelace" />
  </Link>
);

/**
 * An avatar that opens the account menu: PlainButton makes it the menu's
 * trigger and takes the name; the avatar inside stays hidden.
 */
const AccountMenu = () => {
  const [status, setStatus] = useState('');

  return (
    <div className="flex-row-gap-2 items-center">
      <Dropdown
        menu={
          <>
            <Dropdown.Item onSelect={() => setStatus('Opening your profile')}>
              Profile
            </Dropdown.Item>
            <Dropdown.Item onSelect={() => setStatus('Signed out')}>
              Sign out
            </Dropdown.Item>
          </>
        }
      >
        <PlainButton aria-label="Account menu for Ada Lovelace">
          <span>
            <Avatar name="Ada Lovelace" />
          </span>
        </PlainButton>
      </Dropdown>
      <p role="status">{status}</p>
    </div>
  );
};

/**
 * With a photo: `src` fills the circle; the name labels the avatar. The
 * initials show if the photo fails to load, and while `src` is empty.
 */
const WithPhoto = () => (
  <div className="flex-row-gap-2 items-center">
    <Avatar src={photo} name="Grace Hopper" />
    <Avatar src={brokenPhoto} name="Grace Hopper" />
  </div>
);

/** No name: a "?" that is hidden from assistive tech, for unknown people. */
const Unknown = () => <Avatar name="" />;

/**
 * In a menu row: each option's children draw its row, with a small Avatar
 * beside the name. For a table cell, see the Table recipe's organizer column.
 */
const AssigneeSelect = () => {
  const [value, setValue] = useState('');
  return (
    <Select
      label="Assignee"
      placeholder="Unassigned"
      size="md"
      value={value}
      onChange={setValue}
      className="w-full"
    >
      {attendees.map((name) => (
        <SelectOption key={name} value={name} label={name}>
          <span className="flex-row-gap-2 items-center">
            <Avatar size="sm" name={name} />
            {name}
          </span>
        </SelectOption>
      ))}
    </Select>
  );
};

export default function AvatarRecipe() {
  return (
    <div className="flex-col-gap-6">
      <BesideName />
      <OnItsOwn />
      <ProfileLink />
      <AccountMenu />
      <WithPhoto />
      <Unknown />
      <AssigneeSelect />
    </div>
  );
}
