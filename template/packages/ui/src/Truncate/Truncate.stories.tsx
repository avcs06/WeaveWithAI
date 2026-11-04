import React, { useState } from 'react';

import { Checkbox } from '../Checkbox';
import { StoryPage, StorySection } from '../StoryLayout';
import { caption, mutedText } from '../StoryStyles.css';

import { Truncate } from './Truncate';

import type { Meta, StoryObj } from '@storybook/react-vite';

const title =
  'Quarterly planning review for the platform, design and support teams';
const widths = [120, 240, 480];

const meta = {
  title: 'UI/Truncate',
  component: Truncate,
  parameters: { controls: { disable: true } },
} satisfies Meta<typeof Truncate>;

export default meta;
type Story = StoryObj<typeof meta>;

const TruncateStories = () => {
  const [customTooltip, setCustomTooltip] = useState(false);
  const [alwaysShowTooltip, setAlwaysShowTooltip] = useState(false);
  const tooltip = customTooltip ? 'Starts at 10:00 in Room 4' : undefined;

  return (
    <StoryPage>
      <p className={`${caption} ${mutedText}`}>
        Hover the text to see its tooltip.
      </p>

      <StorySection title="Widths">
        {widths.map((width) => (
          <div key={width} style={{ width, maxWidth: '100%' }}>
            <p className={`${caption} ${mutedText}`}>{width}px</p>
            <Truncate>{title}</Truncate>
          </div>
        ))}
      </StorySection>

      {/* Only sideways: descenders (g, y) survive a tight line height. */}
      <StorySection title="Tight line height">
        <div style={{ width: 160, lineHeight: 0 }} className="py-3">
          <Truncate>Gypsy dragonfly quarrying</Truncate>
        </div>
      </StorySection>

      <StorySection title="In a row">
        <div className="flex-row-gap-2 items-center" style={{ width: 240 }}>
          <span>Title:</span>
          <Truncate>{title}</Truncate>
        </div>
      </StorySection>

      <StorySection title="Features">
        <div className="flex-row-gap-4 flex-wrap">
          <Checkbox checked={customTooltip} onCheckedChange={setCustomTooltip}>
            Custom tooltip
          </Checkbox>
          <Checkbox
            checked={alwaysShowTooltip}
            onCheckedChange={setAlwaysShowTooltip}
          >
            alwaysShowTooltip
          </Checkbox>
        </div>
        <div style={{ width: 240 }} className="flex-col-gap-2">
          <Truncate tooltip={tooltip} alwaysShowTooltip={alwaysShowTooltip}>
            {title}
          </Truncate>
          <Truncate tooltip={tooltip} alwaysShowTooltip={alwaysShowTooltip}>
            Fits
          </Truncate>
        </div>
      </StorySection>
    </StoryPage>
  );
};

export const Overview: Story = { render: () => <TruncateStories /> };
