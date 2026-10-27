import React, { useState } from 'react';

import { Checkbox } from '../Checkbox';
import { formControlRecipe } from '../FormControl/FormControl.recipes.css';
import { Radio, RadioGroup } from '../Radio';
import { StoryPage, StorySection } from '../StoryLayout';

import { Textarea, type TextareaProps } from '.';

import type { DisabledProps } from '../utils';
import type { Meta, StoryObj } from '@storybook/react-vite';

const textareaVariants = Object.keys(
  formControlRecipe.classNames.variants.variant,
) as Array<keyof typeof formControlRecipe.classNames.variants.variant>;
const textareaSizes = Object.keys(
  formControlRecipe.classNames.variants.size,
) as Array<keyof typeof formControlRecipe.classNames.variants.size>;
const textareaLooks = Object.keys(
  formControlRecipe.classNames.variants.border,
) as Array<keyof typeof formControlRecipe.classNames.variants.border>;

const meta = {
  title: 'UI/Textarea',
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
const field = { width: 280 } as const;

type FieldProps = Pick<
  TextareaProps,
  | 'size'
  | 'variant'
  | 'look'
  | 'rows'
  | 'placeholder'
  | 'hint'
  | 'helpText'
  | 'required'
  | 'maxLength'
  | 'labelRightSlot'
  | 'tooltip'
  | 'error'
  | 'warning'
  | 'success'
> &
  DisabledProps & {
    initial?: string;
  } & ({ label: string } | { 'aria-label': string });

/** A Textarea that keeps its own text. */
const Field = ({ initial = '', ...props }: FieldProps) => {
  const [value, setValue] = useState(initial);
  return (
    <div style={field}>
      <Textarea
        {...props}
        value={value}
        onChange={setValue}
        className="w-full"
      />
    </div>
  );
};

const maxLength = 200;
const description = 'Two days of talks on design systems and accessible forms.';

const TextareaStories = () => {
  const [disabled, setDisabled] = useState(false);
  const [reason, setReason] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [readOnlyReason, setReadOnlyReason] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingReason, setLoadingReason] = useState(false);
  const [hint, setHint] = useState(false);
  const [helpText, setHelpText] = useState(false);
  const [required, setRequired] = useState(false);
  const [counter, setCounter] = useState(false);
  const [tooltip, setTooltip] = useState(false);
  const [status, setStatus] = useState<
    'none' | 'error' | 'warning' | 'success'
  >('none');
  const [variant, setVariant] =
    useState<(typeof textareaVariants)[number]>('default');
  const [size, setSize] = useState<(typeof textareaSizes)[number]>('sm');
  const [look, setLook] = useState<(typeof textareaLooks)[number]>('outline');
  const [text, setText] = useState(description);

  return (
    <StoryPage>
      <StorySection title="Sizes, variants and looks">
        {textareaSizes.map((size) => (
          <div key={size}>
            <p style={caption}>size: {size}</p>
            <div style={row}>
              {textareaVariants.map((variant) =>
                textareaLooks.map((look) => (
                  <Field
                    key={`${variant}-${look}`}
                    label={`${variant}, ${look}`}
                    size={size}
                    variant={variant}
                    look={look}
                    placeholder="Describe the event"
                  />
                )),
              )}
            </div>
          </div>
        ))}
      </StorySection>

      <StorySection title="Rows">
        <div style={row}>
          <Field label="1 row" rows={1} />
          <Field label="3 rows (default)" />
          <Field label="6 rows" rows={6} />
        </div>
      </StorySection>

      <StorySection title="Status">
        <div style={row}>
          <Field
            label="Error"
            initial="Fun"
            error="Add at least 20 characters"
          />
          <Field
            label="Warning"
            initial={description}
            warning="Long descriptions get cut off in emails"
          />
          <Field label="Success" initial={description} success="Looks good" />
        </div>
      </StorySection>

      <StorySection title="States">
        <div style={row}>
          <Field
            label="Disabled with a reason"
            initial={description}
            disabledWithReason="Locked once the event is published"
          />
          <Field
            label="Read-only with a reason"
            initial={description}
            readOnlyWithReason="Set by your organization"
          />
          <Field
            label="Loading with a reason"
            initial={description}
            loadingWithReason="Saving the description"
          />
          <Field label="Disabled" initial={description} disabled />
          <Field label="Read-only" initial={description} readOnly />
          <Field label="Loading" initial={description} loading />
        </div>
      </StorySection>

      <StorySection title="Labels and messages">
        <div style={row}>
          <Field label="With a hint" hint="Shown on the event page" />
          <Field label="With help text" helpText="Shown above the schedule." />
          <Field
            label="Required"
            required
            helpText="Describe the event in a few lines."
          />
          <Field
            label="With a counter"
            initial={description}
            maxLength={maxLength}
            labelRightSlot={`${description.length}/${maxLength}`}
          />
          <Field label="With a tooltip" tooltip="Shown to attendees" />
          <Field aria-label="Notes to attendees" placeholder="Notes" />
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
          <Checkbox checked={readOnly} onCheckedChange={setReadOnly}>
            Read-only
          </Checkbox>
          <Checkbox
            checked={readOnlyReason}
            onCheckedChange={setReadOnlyReason}
          >
            Read-only reason
          </Checkbox>
          <Checkbox checked={loading} onCheckedChange={setLoading}>
            Loading
          </Checkbox>
          <Checkbox checked={loadingReason} onCheckedChange={setLoadingReason}>
            Loading reason
          </Checkbox>
          <Checkbox checked={hint} onCheckedChange={setHint}>
            Hint
          </Checkbox>
          <Checkbox checked={helpText} onCheckedChange={setHelpText}>
            Help text
          </Checkbox>
          <Checkbox checked={required} onCheckedChange={setRequired}>
            Required
          </Checkbox>
          <Checkbox checked={counter} onCheckedChange={setCounter}>
            Counter
          </Checkbox>
          <Checkbox checked={tooltip} onCheckedChange={setTooltip}>
            Tooltip
          </Checkbox>
        </div>
        <RadioGroup
          label="Status"
          value={status}
          onChange={(next) => setStatus(next as typeof status)}
          className="flex-row-gap-4 flex-wrap"
        >
          {(['none', 'error', 'warning', 'success'] as const).map((option) => (
            <Radio key={option} value={option}>
              {option}
            </Radio>
          ))}
        </RadioGroup>
        <RadioGroup
          label="Variant"
          value={variant}
          onChange={(next) => setVariant(next as typeof variant)}
          className="flex-row-gap-4 flex-wrap"
        >
          {textareaVariants.map((option) => (
            <Radio key={option} value={option}>
              {option}
            </Radio>
          ))}
        </RadioGroup>
        <RadioGroup
          label="Size"
          value={size}
          onChange={(next) => setSize(next as typeof size)}
          className="flex-row-gap-4 flex-wrap"
        >
          {textareaSizes.map((option) => (
            <Radio key={option} value={option}>
              {option}
            </Radio>
          ))}
        </RadioGroup>
        <RadioGroup
          label="Look"
          value={look}
          onChange={(next) => setLook(next as typeof look)}
          className="flex-row-gap-4 flex-wrap"
        >
          {textareaLooks.map((option) => (
            <Radio key={option} value={option}>
              {option}
            </Radio>
          ))}
        </RadioGroup>
        <div style={field}>
          <Textarea
            label="Description"
            placeholder="Describe the event"
            variant={variant}
            size={size}
            look={look}
            required={required}
            maxLength={counter ? maxLength : undefined}
            labelRightSlot={counter ? `${text.length}/${maxLength}` : undefined}
            hint={hint ? 'Shown on the event page' : undefined}
            helpText={helpText ? 'Shown above the schedule.' : undefined}
            tooltip={tooltip ? 'Shown to attendees' : undefined}
            error={status === 'error' && 'Add at least 20 characters'}
            warning={
              status === 'warning' && 'Long descriptions get cut off in emails'
            }
            success={status === 'success' && 'Looks good'}
            value={text}
            onChange={setText}
            className="w-full"
            // A reason replaces its plain state: they can't be set together.
            {...(reason
              ? { disabledWithReason: 'Locked once the event is published' }
              : { disabled })}
            {...(readOnlyReason
              ? { readOnlyWithReason: 'Set by your organization' }
              : { readOnly })}
            {...(loadingReason
              ? { loadingWithReason: 'Saving the description' }
              : { loading })}
          />
        </div>
      </StorySection>
    </StoryPage>
  );
};

export const Overview: Story = { render: () => <TextareaStories /> };
