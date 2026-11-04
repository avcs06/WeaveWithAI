import { ArrowRight } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { StoryPage, StorySection } from '../StoryLayout';

import { Popover } from './Popover';

import type { Meta, StoryObj } from '@storybook/react-vite';

export default { title: 'UI/Popover' } satisfies Meta;
// The page renders its own buttons, so the story takes no args.
type Story = StoryObj;

const PopoverButtonStories = () => {
  const [disabled, setDisabled] = useState(false);
  const [reason, setReason] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingReason, setLoadingReason] = useState(false);
  const [disableWhileLoading, setDisableWhileLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [alignStart, setAlignStart] = useState(false);
  const [open, setOpen] = useState(false);
  const [checkedInOnly, setCheckedInOnly] = useState(false);
  // A reason replaces plain `loading`: they can't be set together.
  const features = {
    ...(reason
      ? { disabledWithReason: 'Choose an event first' }
      : { disabled }),
    disableWhileLoading,
    modal,
    align: alignStart ? ('start' as const) : ('end' as const),
    ...(loadingReason
      ? { loadingWithReason: 'Loading the venues' }
      : { loading }),
  };

  return (
    <StoryPage>
      <div className="flex-row-gap-4 flex-wrap">
        <Checkbox checked={disabled} onCheckedChange={setDisabled}>
          disabled
        </Checkbox>
        <Checkbox checked={reason} onCheckedChange={setReason}>
          Disabled reason
        </Checkbox>
        <Checkbox checked={loading} onCheckedChange={setLoading}>
          loading
        </Checkbox>
        <Checkbox checked={loadingReason} onCheckedChange={setLoadingReason}>
          loading reason
        </Checkbox>
        <Checkbox
          checked={disableWhileLoading}
          onCheckedChange={setDisableWhileLoading}
        >
          disableWhileLoading
        </Checkbox>
        <Checkbox checked={modal} onCheckedChange={setModal}>
          Modal
        </Checkbox>
        <Checkbox checked={alignStart} onCheckedChange={setAlignStart}>
          Align start
        </Checkbox>
      </div>

      <StorySection title="PopoverButton">
        <div className="flex-row-gap-2 items-center flex-wrap">
          <Popover
            {...features}
            aria-label="Attendee filters"
            open={open}
            onOpenChange={setOpen}
            menu={
              <div className="flex-col-gap-3 px-3 py-1">
                <Checkbox
                  checked={checkedInOnly}
                  onCheckedChange={setCheckedInOnly}
                >
                  Checked-in attendees only
                </Checkbox>
                <Button onClick={() => setOpen(false)}>Apply filters</Button>
              </div>
            }
          >
            <Popover.Button tooltip="Filter the attendee list">
              Filters
            </Popover.Button>
          </Popover>
          <Popover
            {...features}
            aria-label="Venue details"
            menu={<p className="px-3 py-1">Main hall · 120 seats</p>}
          >
            <Popover.Button size="md" look="ghost" rightIcon={<ArrowRight />}>
              Venue details
            </Popover.Button>
          </Popover>
        </div>
      </StorySection>
    </StoryPage>
  );
};

export const Overview: Story = { render: () => <PopoverButtonStories /> };
