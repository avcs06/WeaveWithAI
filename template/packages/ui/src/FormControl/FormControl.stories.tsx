import { AtSign, Search } from 'lucide-react';
import React, { type ReactNode, useState } from 'react';

import { Checkbox } from '../Checkbox';
import { Link } from '../Link';
import { StoryPage, StorySection } from '../StoryLayout';
import { caption, controlWidth, mutedText } from '../StoryStyles.css';

import { FormControl } from '.';

import type { FormControlOwnProps } from './FormControl.types';
import type { Meta, StoryObj } from '@storybook/react-vite';
export default { title: 'UI/FormControl' } satisfies Meta;
// The page renders its own fields, so the story takes no args.
type Story = StoryObj;

/** A custom control: a native input gets the control props. */
const TextField = (props: FormControlOwnProps) => {
  const [value, setValue] = useState('');
  return (
    <FormControl {...props} className={controlWidth}>
      {({ isDisabled, ...controlProps }) => (
        <input
          {...controlProps}
          value={value}
          placeholder={props.placeholder}
          readOnly={isDisabled}
          onChange={(event) => setValue(event.target.value)}
          className="flex-fill-x"
        />
      )}
    </FormControl>
  );
};

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex-col-gap-2">
    <p className={`${caption} ${mutedText}`}>{label}</p>
    <div className="flex-row-gap-4 items-start flex-wrap">{children}</div>
  </div>
);

const FormControlStories = () => {
  const [open, setOpen] = useState(false);
  const [md, setMd] = useState(false);
  const [base, setBase] = useState(false);
  const [required, setRequired] = useState(true);
  const [hint, setHint] = useState(true);
  const [rightSlot, setRightSlot] = useState(false);
  const [helpText, setHelpText] = useState(true);
  const [leftIcon, setLeftIcon] = useState(false);
  const [rightAddOn, setRightAddOn] = useState(false);
  const [error, setError] = useState(false);
  const [warning, setWarning] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [reason, setReason] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [readOnlyReason, setReadOnlyReason] = useState(false);
  const [loadingReason, setLoadingReason] = useState(false);
  const [disableWhileLoading, setDisableWhileLoading] = useState(true);
  const [tooltip, setTooltip] = useState(false);

  const features: FormControlOwnProps = {
    label: 'Email',
    placeholder: 'you@example.com',
    look: open ? 'open' : 'outline',
    size: md ? 'md' : 'sm',
    variant: base ? 'base' : 'default',
    required,
    hint: hint ? 'Where we send receipts' : undefined,
    labelRightSlot: rightSlot ? <Link href="#help">Help</Link> : undefined,
    helpText: helpText ? 'We never share it.' : undefined,
    leftIcon: leftIcon ? <AtSign /> : undefined,
    rightAddOn: rightAddOn ? <span>.com</span> : undefined,
    error: error && 'Enter a valid email',
    warning: warning && 'This domain often bounces',
    success: success && 'Verified',
    // A reason replaces plain `loading`: they can't be set together.
    ...(loadingReason
      ? { loadingWithReason: 'Checking availability' }
      : { loading }),
    disableWhileLoading,
    // A reason replaces plain `disabled`: they can't be set together.
    ...(reason
      ? { disabledWithReason: 'Verified emails can’t change' }
      : { disabled }),
    ...(readOnlyReason
      ? { readOnlyWithReason: 'Set by your workspace' }
      : { readOnly }),
    tooltip: tooltip ? 'Used to sign in' : undefined,
  };

  return (
    <StoryPage>
      <p className={`${caption} ${mutedText}`}>
        FormControl wraps a control: the label, the box with its icons and
        tooltip, and the help text and status message.
      </p>

      <StorySection title="Sizes and variants">
        {(['sm', 'md'] as const).map((size) => (
          <Row key={size} label={size === 'sm' ? 'sm (default)' : 'md'}>
            <TextField label="Default" size={size} placeholder="Name" />
            <TextField
              label="Base"
              size={size}
              variant="base"
              placeholder="Name"
            />
          </Row>
        ))}
      </StorySection>

      <StorySection title="Looks">
        <Row label="outline (default), open: a bottom border, 2px when focused">
          <TextField label="Outline" placeholder="Name" />
          <TextField label="Open" look="open" placeholder="Name" />
        </Row>
      </StorySection>

      <StorySection title="Status">
        <Row label="A message under the help text; error wins over warning and success">
          <TextField
            label="Error"
            error="Enter a valid email"
            helpText="For receipts"
          />
          <TextField label="Warning" warning="This domain often bounces" />
          <TextField label="Success" success="Verified" look="open" />
          <TextField label="Style only" error />
        </Row>
      </StorySection>

      <StorySection title="Label">
        <Row label="Required, a hint, a slot at the end, and a label cut to one line">
          <TextField label="Email" required hint="Where we send receipts" />
          <TextField
            label="Email"
            labelRightSlot={<Link href="#help">Help</Link>}
          />
          <TextField label="The email address we send every receipt to" />
        </Row>
      </StorySection>

      <StorySection title="Icons, add-ons and states">
        <Row label="An icon wins over an add-on; loading shows a spinner">
          <TextField label="Icon" leftIcon={<Search />} placeholder="Search" />
          <TextField
            label="Add-ons"
            leftAddOn={<span>https://</span>}
            rightAddOn={<span>.com</span>}
          />
          <TextField label="Loading" loading leftIcon={<Search />} />
        </Row>
        <Row label="Disabled, read-only and loading, each with a reason in the box's tooltip">
          <TextField
            label="Disabled"
            disabledWithReason="Verified emails can’t change"
          />
          <TextField
            label="Read-only"
            readOnlyWithReason="Set by your workspace"
          />
          <TextField
            label="Loading"
            loadingWithReason="Checking availability"
          />
        </Row>
      </StorySection>

      <StorySection title="Features">
        <div className="flex-row-gap-4 flex-wrap">
          <Checkbox checked={open} onCheckedChange={setOpen}>
            Look: open
          </Checkbox>
          <Checkbox checked={md} onCheckedChange={setMd}>
            Size: md
          </Checkbox>
          <Checkbox checked={base} onCheckedChange={setBase}>
            Variant: base
          </Checkbox>
          <Checkbox checked={required} onCheckedChange={setRequired}>
            Required
          </Checkbox>
          <Checkbox checked={hint} onCheckedChange={setHint}>
            Hint
          </Checkbox>
          <Checkbox checked={rightSlot} onCheckedChange={setRightSlot}>
            Label right slot
          </Checkbox>
          <Checkbox checked={helpText} onCheckedChange={setHelpText}>
            Help text
          </Checkbox>
          <Checkbox checked={leftIcon} onCheckedChange={setLeftIcon}>
            Left icon
          </Checkbox>
          <Checkbox checked={rightAddOn} onCheckedChange={setRightAddOn}>
            Right add-on
          </Checkbox>
          <Checkbox checked={error} onCheckedChange={setError}>
            Error
          </Checkbox>
          <Checkbox checked={warning} onCheckedChange={setWarning}>
            Warning
          </Checkbox>
          <Checkbox checked={success} onCheckedChange={setSuccess}>
            Success
          </Checkbox>
          <Checkbox checked={loading} onCheckedChange={setLoading}>
            Loading
          </Checkbox>
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
          <Checkbox checked={loadingReason} onCheckedChange={setLoadingReason}>
            Loading reason
          </Checkbox>
          <Checkbox
            checked={disableWhileLoading}
            onCheckedChange={setDisableWhileLoading}
          >
            disableWhileLoading
          </Checkbox>
          <Checkbox checked={tooltip} onCheckedChange={setTooltip}>
            Tooltip
          </Checkbox>
        </div>
        <TextField {...features} />
      </StorySection>
    </StoryPage>
  );
};

export const Overview: Story = { render: () => <FormControlStories /> };
