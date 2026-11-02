import React from 'react';

import { StoryPage, StorySection } from '../StoryLayout';
import { caption, mutedText } from '../StoryStyles.css';

import { Numeral } from './Numeral';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'UI/Numeral',
  component: Numeral,
  // The figure is required; the story renders its own.
  args: { children: 0 },
  parameters: { controls: { disable: true } },
} satisfies Meta<typeof Numeral>;

export default meta;
type Story = StoryObj<typeof meta>;

const figures = ['1', '11', '111', '1,111'];

const NumeralStories = () => (
  <StoryPage>
    <StorySection title="In a column">
      <p className={`${caption} ${mutedText}`}>
        Aligned to the end, the digits line up.
      </p>
      <div className="flex-col-gap-1 items-end" style={{ width: 120 }}>
        {figures.map((figure) => (
          <Numeral key={figure}>{figure}</Numeral>
        ))}
      </div>
    </StorySection>

    <StorySection title="Beside text">
      <p>
        Pages read this week: <Numeral>1,834</Numeral>
      </p>
    </StorySection>

    <StorySection title="Sizes from around it">
      <div className="flex-row-gap-4 items-end">
        <span className="text-body">
          <Numeral>42</Numeral>
        </span>
        <span className="text-heading">
          <Numeral>42</Numeral>
        </span>
        <span className="text-display">
          <Numeral>42</Numeral>
        </span>
      </div>
    </StorySection>
  </StoryPage>
);

export const Overview: Story = { render: () => <NumeralStories /> };
