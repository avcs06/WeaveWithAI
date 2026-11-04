import React, { useState } from 'react';

import { Checkbox } from '../Checkbox';
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
  const [plain, setPlain] = useState(false);
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

      <StorySection title="Destinations">
        <div className="flex-row-gap-4 flex-wrap">
          <Link
            href="https://example.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Event website (opens in a new tab)
          </Link>
          <Link href="mailto:events@example.com">Email the organizer</Link>
          <Link href="tel:+15550100">Call the organizer</Link>
          <Link href="/files/attendance-report.pdf" download>
            Download attendance report (PDF)
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
          <Checkbox checked={disabled} onCheckedChange={setDisabled}>
            Disabled
          </Checkbox>
          <Checkbox checked={reason} onCheckedChange={setReason}>
            Disabled reason
          </Checkbox>
          <Checkbox checked={plain} onCheckedChange={setPlain}>
            Look: plain
          </Checkbox>
        </div>
        <div className="flex-row-gap-4 flex-wrap">
          {variants.map((variant) => (
            <Link
              key={variant}
              href="#link"
              variant={variant}
              look={plain ? 'plain' : undefined}
              {...disabledState}
            >
              Attendance report ({variant})
            </Link>
          ))}
        </div>
      </StorySection>
    </StoryPage>
  );
};

export const Overview: Story = { render: () => <LinkStories /> };
