import React, { useState } from 'react';

import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { Input, NumberInput } from '../Input';
import { Select, SelectOption } from '../Select';
import { StoryPage, StorySection } from '../StoryLayout';
import { caption, mutedText } from '../StoryStyles.css';
import { Textarea } from '../Textarea';

import { Form, FormRow } from '.';

import type { Meta, StoryObj } from '@storybook/react-vite';

export default { title: 'UI/Form' } satisfies Meta;
// The page renders its own forms, so the story takes no args.
type Story = StoryObj;

const FormStories = () => {
  const [title, setTitle] = useState(true);
  const [error, setError] = useState(false);
  const [actions, setActions] = useState(true);
  const [fill, setFill] = useState(false);
  const [row, setRow] = useState(true);
  const [saved, setSaved] = useState('');
  const [name, setName] = useState('');
  const [venue, setVenue] = useState('');
  const [capacity, setCapacity] = useState<number | null>(null);
  const [room, setRoom] = useState('');
  const [notes, setNotes] = useState('');

  return (
    <StoryPage>
      <p className={`${caption} ${mutedText}`}>
        A form&apos;s layout: fields at the form&apos;s field width (1x, or a
        multiple), then its error and its actions. The browser&apos;s own
        validation is off.
      </p>

      <StorySection title="Features">
        <div className="flex-row-gap-4 flex-wrap">
          <Checkbox checked={title} onCheckedChange={setTitle}>
            Title
          </Checkbox>
          <Checkbox checked={error} onCheckedChange={setError}>
            Error
          </Checkbox>
          <Checkbox checked={actions} onCheckedChange={setActions}>
            Actions
          </Checkbox>
          <Checkbox checked={fill} onCheckedChange={setFill}>
            Fill
          </Checkbox>
          <Checkbox checked={row} onCheckedChange={setRow}>
            Row of fields
          </Checkbox>
        </div>
        <Form
          title={title ? 'New event' : undefined}
          description={title ? 'What, where and how many.' : undefined}
          error={error ? 'Could not save the event. Try again.' : undefined}
          fill={fill}
          onSubmit={(event) => {
            event.preventDefault();
            setSaved('Saved');
          }}
          actions={
            actions ? (
              <>
                <Button variant="base">Cancel</Button>
                <Button type="submit">Save</Button>
              </>
            ) : undefined
          }
        >
          <Input
            label="Title"
            width="1.5x"
            autoComplete="off"
            value={name}
            onChange={setName}
          />
          <Select
            label="Venue"
            placeholder="Choose a venue"
            value={venue}
            onChange={setVenue}
          >
            <SelectOption value="hall" label="Harbor Hall" />
            <SelectOption value="mill" label="Old Mill" />
          </Select>
          {row ? (
            <FormRow>
              <NumberInput
                label="Capacity"
                width="0.5x"
                autoComplete="off"
                value={capacity}
                onChange={setCapacity}
              />
              <Input
                label="Room"
                width="0.5x"
                autoComplete="off"
                value={room}
                onChange={setRoom}
              />
            </FormRow>
          ) : (
            <NumberInput
              label="Capacity"
              width="0.5x"
              autoComplete="off"
              value={capacity}
              onChange={setCapacity}
            />
          )}
          <Textarea label="Notes" width="2x" value={notes} onChange={setNotes} />
          <p role="status">{saved}</p>
        </Form>
      </StorySection>
    </StoryPage>
  );
};

export const Overview: Story = { render: () => <FormStories /> };
