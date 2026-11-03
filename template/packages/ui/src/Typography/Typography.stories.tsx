import React from 'react';

import { StoryPage, StorySection } from '../StoryLayout';

import {
  Code,
  CodeBlock,
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
  List,
  ListItem,
  Paragraph,
  Quote,
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
  </StoryPage>
);

export const Overview: Story = { render: () => <TypographyStories /> };
