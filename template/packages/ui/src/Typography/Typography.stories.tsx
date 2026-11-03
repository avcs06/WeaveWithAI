import React from 'react';

import { StoryPage, StorySection } from '../StoryLayout';

import {
  Caption,
  Code,
  CodeBlock,
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
  Kbd,
  List,
  ListItem,
  Mark,
  Paragraph,
  Quote,
  Separator,
  Time,
} from '.';

import type { TextColor, TextFont } from '.';
import type { Meta, StoryObj } from '@storybook/react-vite';

export default { title: 'UI/Typography' } satisfies Meta;
// The page renders every element, so the story takes no args.
type Story = StoryObj;

const fonts: TextFont[] = ['ui', 'display', 'mono'];
const colors: TextColor[] = [
  'default',
  'muted',
  'primary',
  'success',
  'warning',
  'error',
  'info',
];

const TypographyStories = () => (
  <StoryPage>
    <StorySection title="Paragraph">
      <div className="flex-col-gap-3">
        {fonts.map((font) => (
          <Paragraph key={font} font={font}>
            The {font} font at the body&apos;s size and line height.
          </Paragraph>
        ))}
      </div>
    </StorySection>

    <StorySection title="Colors">
      <div className="flex-col-gap-1">
        {colors.map((color) => (
          <Paragraph key={color} color={color}>
            {color}
          </Paragraph>
        ))}
      </div>
    </StorySection>

    <StorySection title="Caption">
      <div className="flex-col-gap-1">
        <Paragraph>Spring launch plan</Paragraph>
        <Caption>Updated 2 Nov 2026, muted by default</Caption>
        <Caption color="primary">Or in another color</Caption>
      </div>
    </StorySection>

    <StorySection title="List">
      <div className="flex-row-gap-10">
        <List>
          <ListItem>First point</ListItem>
          <ListItem>
            Second point
            <List>
              <ListItem>Inside it</ListItem>
            </List>
          </ListItem>
        </List>
        <List ordered>
          <ListItem>First step</ListItem>
          <ListItem>Second step</ListItem>
        </List>
      </div>
    </StorySection>

    <StorySection title="DescriptionList">
      <DescriptionList>
        <DescriptionTerm>Placed</DescriptionTerm>
        <DescriptionDetails>2 Nov 2026</DescriptionDetails>
        <DescriptionTerm>A longer label that wraps</DescriptionTerm>
        <DescriptionDetails>Courier, 3 to 5 days</DescriptionDetails>
      </DescriptionList>
    </StorySection>

    <StorySection title="Quote">
      <div className="flex-col-gap-4">
        <Quote>Without a source.</Quote>
        <Quote source="Priya, Bengaluru">With its source under it.</Quote>
      </div>
    </StorySection>

    <StorySection title="Code">
      <div className="flex-col-gap-3">
        <Paragraph>
          Run <Code>pnpm dev</Code> to start.
        </Paragraph>
        <CodeBlock>{`pnpm install\npnpm dev -- --port 3001 --a-long-flag-that-scrolls-sideways-inside-the-block`}</CodeBlock>
      </div>
    </StorySection>

    <StorySection title="Kbd">
      <div className="flex-col-gap-1">
        <Paragraph>
          Press <Kbd>Ctrl K</Kbd> to search, always in the mono font.
        </Paragraph>
        <Paragraph>
          Or <Kbd color="primary">Esc</Kbd> in another color.
        </Paragraph>
      </div>
    </StorySection>

    <StorySection title="Mark">
      <div className="flex-col-gap-1">
        <Paragraph>
          Spring <Mark>launch</Mark> plan
        </Paragraph>
        <Paragraph color="muted">
          A <Mark>match</Mark> keeps the color around it, or{' '}
          <Mark color="error">takes its own</Mark>.
        </Paragraph>
      </div>
    </StorySection>

    <StorySection title="Separator">
      <div className="flex-col-gap-3">
        <Paragraph>Above the line</Paragraph>
        <Separator />
        <div className="flex-row-gap-3">
          <Paragraph>In a row</Paragraph>
          <Separator orientation="vertical" />
          <Paragraph>Vertical, as tall as the row</Paragraph>
        </div>
      </div>
    </StorySection>

    <StorySection title="Time">
      <div className="flex-col-gap-1">
        <Paragraph>
          A day: <Time value="2026-11-07" />
        </Paragraph>
        <Paragraph>
          A moment with its time:{' '}
          <Time value="2026-11-09T10:30:00.000Z" withTime />
        </Paragraph>
      </div>
    </StorySection>
  </StoryPage>
);

export const Overview: Story = { render: () => <TypographyStories /> };
