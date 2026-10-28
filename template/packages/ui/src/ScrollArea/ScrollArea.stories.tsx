import React, { useState } from 'react';

import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { Radio, RadioGroup } from '../Radio';
import { StoryPage, StorySection } from '../StoryLayout';

import { FlexScrollArea, ScrollArea, type ScrollAreaProps } from '.';

import type { Meta, StoryObj } from '@storybook/react-vite';

const orientations = ['vertical', 'horizontal', 'both'] as const;

const meta = {
  title: 'UI/ScrollArea',
  parameters: { controls: { disable: true } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const row = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 16,
  alignItems: 'flex-start',
} as const;
const caption = {
  margin: '0 0 8px',
  fontFamily: 'system-ui',
  fontSize: 13,
} as const;
const box = { width: 280, height: 140 } as const;

const sessions = [
  { time: '09:00', title: 'Opening keynote', room: 'Main hall' },
  { time: '10:30', title: 'Design systems at scale', room: 'Room 2' },
  { time: '12:00', title: 'Lunch', room: 'Terrace' },
  { time: '13:30', title: 'Accessible forms workshop', room: 'Room 4' },
  { time: '15:00', title: 'Panel: shipping faster', room: 'Main hall' },
  { time: '16:30', title: 'Closing drinks', room: 'Terrace' },
];

const longLine =
  'Doors open at 08:30, and the opening keynote starts in the main hall at 09:00 sharp.';

/** Paragraphs that scroll up and down, and a line that runs sideways. */
const Content = ({ long = true }: { long?: boolean }) => (
  <div className="flex-col-gap-2 p-2">
    {(long ? sessions : sessions.slice(0, 1)).map((session) => (
      <p key={session.time} style={{ whiteSpace: 'nowrap' }}>
        {session.time} {session.title}, {session.room}.{long && ` ${longLine}`}
      </p>
    ))}
  </div>
);

const Area = ({
  orientation,
  long,
  ...props
}: Pick<ScrollAreaProps, 'orientation' | 'aria-label'> & {
  long?: boolean;
}) => (
  <ScrollArea {...props} orientation={orientation} style={box}>
    <Content long={long} />
  </ScrollArea>
);

/** Lines of the schedule, repeating, for an area that grows with them. */
const scheduleLines = (count: number) =>
  Array.from({ length: count }, (_, index) => {
    const session = sessions[index % sessions.length];
    return `${session.time} ${session.title}, ${session.room}`;
  });

/** Takes its content's height until it reaches its max height, then scrolls. */
const GrowingAreas = () => {
  const [lines, setLines] = useState(2);

  const list = (
    <ul className="flex-col-gap-2 p-2">
      {scheduleLines(lines).map((line, index) => (
        <li key={index}>{line}</li>
      ))}
    </ul>
  );

  return (
    <>
      <div className="flex-row-gap-2">
        <Button variant="base" onClick={() => setLines(lines + 1)}>
          Add line
        </Button>
        <Button
          variant="base"
          onClick={() => setLines(lines - 1)}
          {...(lines > 1
            ? {}
            : { disabledWithReason: 'One line is the least' })}
        >
          Remove line
        </Button>
      </div>
      <div style={row}>
        <div>
          <p style={caption}>ScrollArea, max-height 160px · {lines} lines</p>
          <ScrollArea
            orientation="vertical"
            aria-label="Growing schedule"
            style={{ width: 280, maxHeight: 160 }}
          >
            {list}
          </ScrollArea>
        </div>
        <div>
          <p style={caption}>FlexScrollArea in a column, max-height 220px</p>
          <section
            className="flex-col-gap-2"
            style={{ width: 280, maxHeight: 220 }}
          >
            <h3>Day one</h3>
            <FlexScrollArea
              orientation="vertical"
              aria-label="Growing sessions"
            >
              {list}
            </FlexScrollArea>
            <p>{lines} sessions</p>
          </section>
        </div>
      </div>
    </>
  );
};

const ScrollAreaStories = () => {
  const [orientation, setOrientation] =
    useState<(typeof orientations)[number]>('both');
  const [long, setLong] = useState(true);

  return (
    <StoryPage>
      <StorySection title="Orientation">
        <div style={row}>
          {orientations.map((option) => (
            <div key={option}>
              <p style={caption}>orientation: {option}</p>
              <Area orientation={option} aria-label={`Schedule, ${option}`} />
            </div>
          ))}
        </div>
      </StorySection>

      <StorySection title="Content that fits">
        <div>
          <p style={caption}>No scrollbars while nothing overflows</p>
          <Area aria-label="Short schedule" long={false} />
        </div>
      </StorySection>

      <StorySection title="Grows to a max height">
        <GrowingAreas />
      </StorySection>

      <StorySection title="FlexScrollArea">
        <div>
          <p style={caption}>Header and footer stay put in a 220px column</p>
          <section
            className="flex-col-gap-2"
            style={{ width: 280, height: 220 }}
          >
            <h3>Day one</h3>
            <FlexScrollArea orientation="vertical" aria-label="Sessions">
              <ul className="flex-col-gap-3 pr-3">
                {sessions.map((session) => (
                  <li key={session.time} className="flex-col-gap-0.5">
                    <strong>
                      {session.time} {session.title}
                    </strong>
                    <span>{session.room}</span>
                  </li>
                ))}
              </ul>
            </FlexScrollArea>
            <p>{sessions.length} sessions</p>
          </section>
        </div>
      </StorySection>

      <StorySection title="Features">
        <div className="flex-row-gap-4 flex-wrap">
          <Checkbox checked={long} onCheckedChange={setLong}>
            Long content
          </Checkbox>
        </div>
        <RadioGroup
          label="Orientation"
          value={orientation}
          onChange={(next) => setOrientation(next as typeof orientation)}
          className="flex-row-gap-4 flex-wrap"
        >
          {orientations.map((option) => (
            <Radio key={option} value={option}>
              {option}
            </Radio>
          ))}
        </RadioGroup>
        <Area orientation={orientation} aria-label="Schedule" long={long} />
      </StorySection>
    </StoryPage>
  );
};

export const Overview: Story = { render: () => <ScrollAreaStories /> };
