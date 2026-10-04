/**
 * Avatar: a round picture of a person, or their initials when there's no
 * picture. Hovering it shows the name. Use it beside a name in lists, tables
 * and headers.
 */
import { Avatar } from '@packages/ui/Avatar';
import { Truncate } from '@packages/ui/Truncate';
import React from 'react';

const photo = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="hsl(210 55% 55%)"/><circle cx="32" cy="25" r="12" fill="white" fill-opacity="0.85"/><rect x="10" y="42" width="44" height="32" rx="16" fill="white" fill-opacity="0.85"/></svg>',
)}`;

/**
 * Beside a name: `size="sm"` in table rows and dense lists. It's hidden from
 * screen readers by default, since the name beside it is read already.
 */
const BesideName = () => (
  <div className="flex-row-gap-2 items-center min-w-0">
    <Avatar size="sm" name="Ada Lovelace" />
    <Truncate>Ada Lovelace</Truncate>
  </div>
);

/**
 * On its own, like a row of attendees: `aria-hidden={false}`, so screen
 * readers read each name.
 */
const OnItsOwn = () => (
  <div className="flex-row-gap-2 items-center">
    <Avatar name="Ada Lovelace" aria-hidden={false} />
    <Avatar name="Grace Hopper" aria-hidden={false} />
    <Avatar name="Alan Turing" aria-hidden={false} />
  </div>
);

/**
 * With a photo: `src` fills the circle, with `name` as its alt text. The
 * initials show if the photo fails to load.
 */
const WithPhoto = () => <Avatar src={photo} name="Grace Hopper" />;

/** Sizes: `sm` 28px, `md` 36px (default), `lg` 56px for profile headers. */
const Sizes = () => (
  <div className="flex-row-gap-3 items-center">
    <Avatar size="sm" name="Alan Turing" />
    <Avatar size="md" name="Alan Turing" />
    <Avatar size="lg" name="Alan Turing" />
  </div>
);

export default function AvatarRecipe() {
  return (
    <div className="flex-col-gap-6">
      <BesideName />
      <OnItsOwn />
      <WithPhoto />
      <Sizes />
    </div>
  );
}
