import { Ticket } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { Radio, RadioGroup } from '../Radio';
import { StoryPage, StorySection } from '../StoryLayout';

import { toastStatusRecipe } from './Toast.recipes.css';

import {
  clearToasts,
  dismissToast,
  toast,
  updateToast,
  type ToastStatus,
} from '.';

import type { Meta, StoryObj } from '@storybook/react-vite';

const statuses = Object.keys(
  toastStatusRecipe.classNames.variants.status,
) as ToastStatus[];

const durations = { short: 2000, default: undefined, never: Infinity };

const meta = {
  title: 'UI/Toast',
  parameters: { controls: { disable: true } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const row = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
  alignItems: 'center',
} as const;
const caption = {
  margin: '0 0 8px',
  fontFamily: 'system-ui',
  fontSize: 13,
} as const;

const longDescription =
  'Attendees who saved the session get an email with the new time and room, and the agenda updates for everyone at once.';

/** A loading toast that becomes the outcome after a second. */
const Update = ({ outcome }: { outcome: 'success' | 'error' }) => (
  <Button
    variant="base"
    onClick={() => {
      const id = toast({ title: 'Publishing the schedule', status: 'loading' });
      setTimeout(
        () =>
          updateToast(
            id,
            outcome === 'success'
              ? { title: 'Schedule published', status: 'success' }
              : {
                  title: 'Couldn’t publish the schedule',
                  description: 'Check your connection and try again.',
                  status: 'error',
                },
          ),
        1000,
      );
    }}
  >
    Loading, then {outcome}
  </Button>
);

/** A toast that stays, closed from the page; it says when it closed. */
const Persistent = () => {
  const [id, setId] = useState<string>();
  const [closes, setCloses] = useState(0);

  return (
    <div>
      <p style={caption}>onClose ran {closes} times</p>
      <div style={row}>
        <Button
          variant="base"
          onClick={() =>
            setId(
              toast({
                title: 'Connection lost',
                status: 'warning',
                duration: Infinity,
                closable: true,
                onClose: () => {
                  setCloses((count) => count + 1);
                  setId(undefined);
                },
              }),
            )
          }
        >
          Show until dismissed
        </Button>
        <Button
          variant="base"
          {...(id ? {} : { disabledWithReason: 'Show the toast first' })}
          onClick={() => id && dismissToast(id)}
        >
          dismissToast
        </Button>
      </div>
    </div>
  );
};

const ToastStories = () => {
  const [status, setStatus] = useState<ToastStatus>('info');
  const [duration, setDuration] = useState<keyof typeof durations>('default');
  const [description, setDescription] = useState(true);
  const [longTitle, setLongTitle] = useState(false);
  const [icon, setIcon] = useState(false);
  const [action, setAction] = useState(false);
  const [closable, setClosable] = useState(false);

  return (
    <StoryPage>
      <StorySection title="Statuses">
        <div style={row}>
          {statuses.map((option) => (
            <Button
              key={option}
              variant="base"
              onClick={() =>
                toast({
                  title: `A ${option} toast`,
                  description: 'Session saved for 120 attendees.',
                  status: option,
                })
              }
            >
              status: {option}
            </Button>
          ))}
        </div>
      </StorySection>

      <StorySection title="Content">
        <div style={row}>
          <Button
            variant="base"
            onClick={() => toast({ title: 'Session saved' })}
          >
            Title only
          </Button>
          <Button
            variant="base"
            onClick={() =>
              toast({
                title:
                  'Opening keynote moved to the main hall, starting at nine',
                description: longDescription,
              })
            }
          >
            Long title and description
          </Button>
          <Button
            variant="base"
            onClick={() =>
              toast({ title: 'Ticket transferred', icon: <Ticket /> })
            }
          >
            Custom icon
          </Button>
        </div>
      </StorySection>

      <StorySection title="Actions">
        <div style={row}>
          <Button
            variant="base"
            onClick={() =>
              toast({
                title: 'Speaker removed',
                action: {
                  label: 'Undo',
                  altText: 'Add them back from the speakers list',
                },
              })
            }
          >
            Action
          </Button>
          <Button
            variant="base"
            onClick={() => toast({ title: 'Session saved', closable: true })}
          >
            Closable
          </Button>
          <Button
            variant="base"
            onClick={() =>
              toast({
                title: 'Speaker removed',
                closable: true,
                action: {
                  label: 'Undo',
                  altText: 'Add them back from the speakers list',
                },
              })
            }
          >
            Action and close
          </Button>
        </div>
      </StorySection>

      <StorySection title="Updating and closing">
        <div style={row}>
          <Update outcome="success" />
          <Update outcome="error" />
          <Button
            variant="base"
            onClick={() =>
              toast({ title: 'Gone in two seconds', duration: 2000 })
            }
          >
            duration: 2000
          </Button>
          <Button variant="base" onClick={clearToasts}>
            clearToasts
          </Button>
        </div>
        <Persistent />
      </StorySection>

      <StorySection title="Features">
        <div className="flex-row-gap-4 flex-wrap">
          <Checkbox checked={description} onCheckedChange={setDescription}>
            Description
          </Checkbox>
          <Checkbox checked={longTitle} onCheckedChange={setLongTitle}>
            Long title
          </Checkbox>
          <Checkbox checked={icon} onCheckedChange={setIcon}>
            Custom icon
          </Checkbox>
          <Checkbox checked={action} onCheckedChange={setAction}>
            Action
          </Checkbox>
          <Checkbox checked={closable} onCheckedChange={setClosable}>
            Closable
          </Checkbox>
        </div>
        <RadioGroup
          label="Status"
          value={status}
          onChange={(next) => setStatus(next as ToastStatus)}
          className="flex-row-gap-4 flex-wrap"
        >
          {statuses.map((option) => (
            <Radio key={option} value={option}>
              {option}
            </Radio>
          ))}
        </RadioGroup>
        <RadioGroup
          label="Duration"
          value={duration}
          onChange={(next) => setDuration(next as keyof typeof durations)}
          className="flex-row-gap-4 flex-wrap"
        >
          {Object.keys(durations).map((option) => (
            <Radio key={option} value={option}>
              {option}
            </Radio>
          ))}
        </RadioGroup>
        <div style={row}>
          <Button
            onClick={() =>
              toast({
                title: longTitle
                  ? 'Opening keynote moved to the main hall, starting at nine'
                  : 'Session saved',
                description: description ? longDescription : undefined,
                status,
                icon: icon ? <Ticket /> : undefined,
                action: action
                  ? {
                      label: 'Undo',
                      altText: 'Undo it from the session page',
                    }
                  : undefined,
                closable,
                duration: durations[duration],
              })
            }
          >
            Show toast
          </Button>
        </div>
      </StorySection>
    </StoryPage>
  );
};

export const Overview: Story = { render: () => <ToastStories /> };
