import { AtSign } from 'lucide-react';
import React, { type ReactNode, useState } from 'react';

import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { StoryPage, StorySection } from '../StoryLayout';
import { caption, controlWidth, mutedText } from '../StoryStyles.css';

import { Input, type InputProps, PasswordInput, SearchInput } from '.';

import type { Meta, StoryObj } from '@storybook/react-vite';
export default { title: 'UI/Input' } satisfies Meta;
// The page renders its own inputs, so the story takes no args.
type Story = StoryObj;

// Partial of a union too large for TS to match against Input's: cast back.
const Field = (props: Partial<InputProps> & { autoComplete: string }) => {
  const [value, setValue] = useState('');
  return (
    <Input<never>
      {...(props as InputProps)}
      value={value}
      onChange={setValue}
      className={controlWidth}
    />
  );
};

/**
 * A Field that can wait 500ms: `delay` takes a literal, so it can't be a prop
 * of Field.
 */
const DelayableField = ({
  delayed,
  ...props
}: Partial<InputProps> & { autoComplete: string; delayed: boolean }) => {
  const [value, setValue] = useState('');
  const shared = { value, onChange: setValue, className: controlWidth };
  return delayed ? (
    <Input<500> {...(props as InputProps<500>)} {...shared} delay={500} />
  ) : (
    <Input<never> {...(props as InputProps)} {...shared} />
  );
};

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex-col-gap-2">
    <p className={`${caption} ${mutedText}`}>{label}</p>
    <div className="flex-row-gap-4 items-start flex-wrap">{children}</div>
  </div>
);

const Password = () => {
  const [value, setValue] = useState('');
  return (
    <PasswordInput
      label="Password"
      autoComplete="current-password"
      value={value}
      onChange={setValue}
      className={controlWidth}
    />
  );
};

/** What a debounced search sent, beside what's typed. */
const Search = () => {
  const [search, setSearch] = useState('');
  return (
    <div className="flex-col-gap-2">
      <SearchInput
        aria-label="Search events"
        placeholder="Search events"
        value={search}
        onChange={setSearch}
        className={controlWidth}
      />
      <p className={`${caption} ${mutedText}`}>
        Sent after the pause: “{search}”
      </p>
      <Button variant="base" onClick={() => setSearch('')}>
        Clear from outside
      </Button>
    </div>
  );
};

const InputStories = () => {
  const [open, setOpen] = useState(false);
  const [md, setMd] = useState(false);
  const [base, setBase] = useState(false);
  const [leftIcon, setLeftIcon] = useState(false);
  const [leftAddOn, setLeftAddOn] = useState(false);
  const [delayed, setDelayed] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingReason, setLoadingReason] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [reason, setReason] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [readOnlyReason, setReadOnlyReason] = useState(false);
  const [disableWhileLoading, setDisableWhileLoading] = useState(true);

  return (
    <StoryPage>
      <StorySection title="Sizes, variants and looks">
        {(['sm', 'md'] as const).map((size) => (
          <Row key={size} label={size === 'sm' ? 'sm (default)' : 'md'}>
            <Field
              label="Default"
              size={size}
              autoComplete="name"
              placeholder="Name"
            />
            <Field
              label="Base"
              size={size}
              variant="base"
              autoComplete="name"
              placeholder="Name"
            />
            <Field
              label="Open"
              size={size}
              look="open"
              autoComplete="name"
              placeholder="Name"
            />
          </Row>
        ))}
      </StorySection>

      <StorySection title="Native attributes">
        <Row label="type, maxLength and autoComplete reach the field">
          <Field label="Email" type="email" autoComplete="email" />
          <Field
            label="Code"
            maxLength={6}
            autoComplete="one-time-code"
            helpText="Six characters"
          />
          <Password />
        </Row>
      </StorySection>

      <StorySection title="Add-ons and delay">
        <Row label="A string add-on, and onChange after a 500ms pause">
          <Field label="Website" autoComplete="url" leftAddOn="https://" />
          <DelayableField label="Name" autoComplete="name" delayed />
        </Row>
      </StorySection>

      <StorySection title="Status and states">
        <Row label="Status messages, and disabled with a reason">
          <Field
            label="Email"
            autoComplete="email"
            error="Enter a valid email"
          />
          <Field
            label="Email"
            autoComplete="email"
            warning="This domain often bounces"
          />
          <Field label="Email" autoComplete="email" success="Verified" />
          <Field
            label="Email"
            autoComplete="email"
            loadingWithReason="Checking availability"
          />
          <Field
            label="Email"
            autoComplete="email"
            disabledWithReason="Verified emails can’t change"
          />
          <Field
            label="Email"
            autoComplete="email"
            readOnlyWithReason="This email is managed by your organization"
          />
        </Row>
      </StorySection>

      <StorySection title="SearchInput">
        <Row label="Base variant, a search icon, and onChange after a 300ms pause">
          <Search />
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
          <Checkbox checked={leftIcon} onCheckedChange={setLeftIcon}>
            Left icon
          </Checkbox>
          <Checkbox checked={leftAddOn} onCheckedChange={setLeftAddOn}>
            Left add-on
          </Checkbox>
          <Checkbox checked={delayed} onCheckedChange={setDelayed}>
            Delay
          </Checkbox>
          <Checkbox checked={error} onCheckedChange={setError}>
            Error
          </Checkbox>
          <Checkbox checked={loading} onCheckedChange={setLoading}>
            Loading
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
        </div>
        <DelayableField
          label="Email"
          autoComplete="email"
          placeholder="you@example.com"
          look={open ? 'open' : 'outline'}
          size={md ? 'md' : 'sm'}
          variant={base ? 'base' : 'default'}
          leftIcon={leftIcon ? <AtSign /> : undefined}
          leftAddOn={leftAddOn ? 'https://' : undefined}
          delayed={delayed}
          disableWhileLoading={disableWhileLoading}
          {...(readOnlyReason
            ? {
                readOnlyWithReason:
                  'This email is managed by your organization',
              }
            : { readOnly })}
          error={error && 'Enter a valid email'}
          // A reason replaces its plain state: they can't be set together.
          {...(loadingReason
            ? { loadingWithReason: 'Checking availability' }
            : { loading })}
          {...(reason
            ? { disabledWithReason: 'Verified emails can’t change' }
            : { disabled })}
        />
      </StorySection>
    </StoryPage>
  );
};

export const Overview: Story = { render: () => <InputStories /> };
