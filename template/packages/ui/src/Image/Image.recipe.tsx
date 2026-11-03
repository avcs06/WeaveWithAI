/**
 * Image: a picture in a box of a set width and height, such as a product
 * photo, a cover or a logo. The box narrows with its parent and keeps its
 * ratio, so the page doesn't jump while the picture loads. A missing or
 * broken picture leaves the box in place, with an image icon in the middle.
 *
 * When not to use:
 * - A person's picture or initials: Avatar.
 * - An icon: a lucide-react icon.
 * - A band of color or a gradient: a background from the theme's tokens.
 *
 * Pitfalls:
 * - `width` and `height` are the box at full width. Give the picture's own
 *   ratio; in a narrower parent the box narrows and keeps it.
 * - `alt` says what the picture shows. Use "" only for a picture that
 *   decorates, such as the backdrop behind a headline.
 * - Text over a picture sits on a surface of its own, such as a Card, so it
 *   stays readable on any picture.
 * - Leave `src` out when a record has no picture yet: the box keeps its place.
 */
import { Card } from '@packages/ui/Card';
import { Image } from '@packages/ui/Image';
import { Paragraph } from '@packages/ui/Typography';
import React from 'react';

// Setup: stand-ins for your app's data, not part of the pattern.
const picture = (width: number, height: number, from: string, to: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><linearGradient id="g"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient><rect width="100%" height="100%" fill="url(#g)"/></svg>`,
  )}`;
const mug = picture(400, 300, '#9A3412', '#FDBA74');
const logo = picture(200, 60, '#1E3A8A', '#93C5FD');
const banner = picture(1200, 400, '#134E4A', '#5EEAD4');

// Usage: the patterns to copy.
/** A photo that fills its box: `cover` crops what does not fit. */
const Photo = () => (
  <Image
    src={mug}
    alt="A rust-glazed mug on a wooden table"
    width={400}
    height={300}
    fit="cover"
  />
);

/** A logo or a screenshot shown whole: `contain` leaves room around it. */
const Logo = () => (
  <Image
    src={logo}
    alt="Jaipur Studio"
    width={240}
    height={120}
    fit="contain"
  />
);

/** A record with no picture yet: the box keeps its place with an icon. */
const NoPicture = () => (
  <Image alt="Blue vase" width={400} height={300} fit="cover" />
);

/** A backdrop with content over it: the picture becomes the box's background. */
const Backdrop = () => (
  <Image
    src={banner}
    alt=""
    width={1200}
    height={400}
    fit="cover"
    className="flex-row-gap-0 items-center justify-center p-6"
  >
    <Card>
      <Paragraph>New glazes every month.</Paragraph>
    </Card>
  </Image>
);

export default function ImageRecipe() {
  return (
    <div className="flex-col-gap-6">
      <Photo />
      <Logo />
      <NoPicture />
      <Backdrop />
    </div>
  );
}
