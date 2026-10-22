import React, { useState } from 'react';

import { StorySwitch } from '../StoryControls';
import { StoryPage, StorySection } from '../StoryLayout';
import { caption, mutedText } from '../StoryStyles.css';

import { Link } from './Link';
import { linkRecipe } from './Link.recipes.css';

import type { LinkProps } from './Link.types';

import type { Meta, StoryObj } from '@storybook/react-vite';

const variants = Object.keys(linkRecipe.classNames.variants.variant) as Array<
  NonNullable<LinkProps['variant']>
>;

const meta = {
  title: 'UI/Link',
  component: Link,
  parameters: { controls: { disable: true } },
} satisfies Meta<typeof Link>;

export default meta;
// The page renders its own links, so the story takes no args.
type Story = StoryObj;

const LinkStories = () => {
  const [disabled, setDisabled] = useState(false);
  const [reason, setReason] = useState(false);
  // A reason replaces plain `disabled`: they can't be set together.
  const disabledState = reason
    ? { disabledWithReason: 'Opens once the event has ended' }
    : { disabled };

  return (
    <StoryPage>
      <p className={`${caption} ${mutedText}`}>
        Tab to a link to see its focus ring, or press and hold one.
      </p>

      <StorySection title="Variants">
        <div className="flex-row-gap-4 flex-wrap">
          {variants.map((variant) => (
            <Link key={variant} href="#link" variant={variant}>
              {variant}
            </Link>
          ))}
        </div>
      </StorySection>

      <StorySection title="In text">
        <p>
          Read the <Link href="#link">event guidelines</Link> before you
          publish, and check the{' '}
          <Link href="#link">
            checklist for venues that sell tickets at the door
          </Link>{' '}
          when it wraps onto a second line.
        </p>
      </StorySection>

      <StorySection title="States">
        <div className="flex-row-gap-4 flex-wrap">
          <Link href="#link">Enabled</Link>
          <Link href="#link" disabled>
            Disabled
          </Link>
          <Link
            href="#link"
            disabledWithReason="Opens once the event has ended"
          >
            Disabled with a reason
          </Link>
        </div>
      </StorySection>

      {/* The child stands in for a router's link, like Next.js's. */}
      <StorySection title="asChild">
        <div className="flex-row-gap-4 flex-wrap">
          <Link asChild>
            <a href="#link">Child anchor</a>
          </Link>
          <Link asChild disabledWithReason="Opens once the event has ended">
            <a href="#link">Disabled child anchor</a>
          </Link>
        </div>
      </StorySection>

      <StorySection title="Features">
        <div className="flex-row-gap-4 flex-wrap">
          <StorySwitch
            label="Disabled"
            checked={disabled}
            onChange={setDisabled}
          />
          <StorySwitch
            label="Disabled reason"
            checked={reason}
            onChange={setReason}
          />
        </div>
        <div className="flex-row-gap-4 flex-wrap">
          {variants.map((variant) => (
            <Link
              key={variant}
              href="#link"
              variant={variant}
              {...disabledState}
            >
              Attendance report ({variant})
            </Link>
          ))}
        </div>
      </StorySection>

      {/*
        Commented out until it loads again: next/link reads `process.env`,
        which Storybook's Vite build doesn't define. Restoring it takes
        `import { NextLink } from './auxiliary';`.

      <StorySection title="NextLink">
        <p className={`${caption} ${mutedText}`}>
          Link around Next.js&apos;s Link. Outside a Next.js app it navigates
          like a plain anchor.
        </p>
        <div className="flex-row-gap-4 flex-wrap">
          {variants.map((variant) => (
            <NextLink
              key={variant}
              href="#next-link"
              variant={variant}
              {...disabledState}
            >
              Attendance report ({variant})
            </NextLink>
          ))}
        </div>
      </StorySection>
      */}
    </StoryPage>
  );
};

export const Overview: Story = { render: () => <LinkStories /> };
