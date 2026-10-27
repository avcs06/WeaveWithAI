import React, { useState } from 'react';

import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { Radio, RadioGroup } from '../Radio';
import { StoryPage, StorySection } from '../StoryLayout';

import { dialogRecipe, glyphRecipe } from './Dialog.recipes.css';

import {
  Dialog,
  DialogResult,
  openConfirmationDialog,
  type ConfirmationDialogOptions,
} from '.';

import type { Meta, StoryObj } from '@storybook/react-vite';

const dialogSizes = Object.keys(dialogRecipe.classNames.variants.size) as Array<
  keyof typeof dialogRecipe.classNames.variants.size
>;
const glyphStatuses = Object.keys(
  glyphRecipe.classNames.variants.status,
) as Array<keyof typeof glyphRecipe.classNames.variants.status>;

const meta = {
  title: 'UI/Dialog',
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

const agenda = Array.from(
  { length: 40 },
  (_, index) =>
    `${9 + Math.floor(index / 4)}:${String((index % 4) * 15).padStart(2, '0')} Session ${index + 1}`,
);

const LongBody = () => (
  <ul className="flex-col-gap-2">
    {agenda.map((slot) => (
      <li key={slot}>{slot}</li>
    ))}
  </ul>
);

const actions = (close: () => void) => (
  <>
    <Button variant="base" onClick={close}>
      Cancel
    </Button>
    <Button onClick={close}>Save</Button>
  </>
);

/** Asks, and shows what the dialog resolved with. */
const Confirm = ({
  label,
  ...options
}: Omit<ConfirmationDialogOptions, 'footer'> & { label: string }) => {
  const [result, setResult] = useState<string>('not asked');

  const ask = async () => {
    const answer = await openConfirmationDialog({
      ...options,
      footer: (closeDialog) => (
        <>
          <Button
            variant="base"
            onClick={() => closeDialog(DialogResult.cancel)}
          >
            Keep it
          </Button>
          <Button
            variant={options.status === 'error' ? 'danger' : 'default'}
            onClick={() => closeDialog(DialogResult.confirm)}
          >
            Delete
          </Button>
        </>
      ),
    });
    setResult(answer ?? 'undefined');
  };

  return (
    <div>
      <p style={caption}>resolved: {result}</p>
      <Button variant="base" onClick={ask}>
        {label}
      </Button>
    </div>
  );
};

const DialogStories = () => {
  const [size, setSize] = useState<(typeof dialogSizes)[number]>('md');
  const [description, setDescription] = useState(true);
  const [body, setBody] = useState(true);
  const [longBody, setLongBody] = useState(false);
  const [footer, setFooter] = useState(true);
  const [closable, setClosable] = useState(true);
  const [open, setOpen] = useState(false);

  return (
    <StoryPage>
      <StorySection title="Sizes">
        <div style={row}>
          {dialogSizes.map((option) => (
            <Dialog
              key={option}
              size={option}
              title={`Size ${option}`}
              description="Shown to attendees."
              trigger={<Button variant="base">size: {option}</Button>}
              footer={actions}
            >
              Opening keynote, Hall A, 9:00.
            </Dialog>
          ))}
        </div>
      </StorySection>

      <StorySection title="Content">
        <div style={row}>
          <Dialog
            title="Title only"
            trigger={<Button variant="base">Title, body and footer</Button>}
            footer={actions}
          >
            Opening keynote, Hall A, 9:00.
          </Dialog>
          <Dialog
            title="No body"
            description="The footer follows the header directly."
            trigger={<Button variant="base">No body</Button>}
            footer={actions}
          />
          <Dialog
            title="No footer"
            description="The close button, Escape or a press outside closes it."
            trigger={<Button variant="base">No footer</Button>}
          >
            Opening keynote, Hall A, 9:00.
          </Dialog>
          {/* Lines under the header and above the footer show only while the
              body scrolls. */}
          <Dialog
            title="Day one agenda"
            trigger={<Button variant="base">Body that scrolls</Button>}
            footer={actions}
          >
            <LongBody />
          </Dialog>
        </div>
      </StorySection>

      <StorySection title="Closing">
        <div style={row}>
          <Dialog
            title="Code of conduct"
            closable={false}
            trigger={<Button variant="base">closable: false</Button>}
            footer={(close) => <Button onClick={close}>I agree</Button>}
          >
            No close button; Escape and a press outside do nothing.
          </Dialog>
          <Dialog
            title="Footer nodes"
            trigger={<Button variant="base">Footer as nodes</Button>}
            footer={<Button variant="base">Does not close</Button>}
          >
            The footer is given as nodes: its button doesn't get `close`.
          </Dialog>
        </div>
      </StorySection>

      <StorySection title="Controlled">
        <p style={caption}>open: {String(open)}</p>
        <div style={row}>
          <Button variant="base" onClick={() => setOpen(true)}>
            Open from outside
          </Button>
        </div>
        <Dialog
          title="Invite a speaker"
          open={open}
          onOpenChange={setOpen}
          footer={
            <Button variant="base" onClick={() => setOpen(false)}>
              Close from the footer
            </Button>
          }
        >
          Opened and closed through `open` and `onOpenChange`.
        </Dialog>
      </StorySection>

      <StorySection title="Confirmation dialog">
        <div style={row}>
          {glyphStatuses.map((status) => (
            <Confirm
              key={status}
              label={`status: ${status}`}
              status={status}
              title="Delete this session?"
              content="Its 120 attendees lose their seats."
            />
          ))}
          <Confirm label="Title only" title="Delete this session?" />
          <Confirm
            label="Not portalled"
            title="Delete this session?"
            content="Rendered in its own root, without a portal."
            portalled={false}
          />
        </div>
      </StorySection>

      <StorySection title="Features">
        <div className="flex-row-gap-4 flex-wrap">
          <Checkbox checked={description} onCheckedChange={setDescription}>
            Description
          </Checkbox>
          <Checkbox checked={body} onCheckedChange={setBody}>
            Body
          </Checkbox>
          <Checkbox checked={longBody} onCheckedChange={setLongBody}>
            Long body
          </Checkbox>
          <Checkbox checked={footer} onCheckedChange={setFooter}>
            Footer
          </Checkbox>
          <Checkbox checked={closable} onCheckedChange={setClosable}>
            Closable
          </Checkbox>
        </div>
        <RadioGroup
          label="Size"
          value={size}
          onChange={(next) => setSize(next as typeof size)}
          className="flex-row-gap-4 flex-wrap"
        >
          {dialogSizes.map((option) => (
            <Radio key={option} value={option}>
              {option}
            </Radio>
          ))}
        </RadioGroup>
        <div style={row}>
          <Dialog
            size={size}
            title="Edit session"
            description={
              description ? 'Attendees see the change at once.' : undefined
            }
            closable={closable}
            trigger={<Button>Open dialog</Button>}
            footer={footer || !closable ? actions : undefined}
          >
            {body &&
              (longBody ? <LongBody /> : 'Opening keynote, Hall A, 9:00.')}
          </Dialog>
        </div>
      </StorySection>
    </StoryPage>
  );
};

export const Overview: Story = { render: () => <DialogStories /> };
