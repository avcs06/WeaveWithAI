import { Globe } from 'lucide-react';
import React, { type ReactNode, useEffect, useState } from 'react';

import { Avatar } from '../Avatar';
import { Checkbox } from '../Checkbox';
import { StoryPage, StorySection } from '../StoryLayout';
import { caption, controlWidth, mutedText } from '../StoryStyles.css';

import { MultiSelect, SelectOption, Select } from '.';

import type { SelectBaseProps } from './Select.types';
import type { Meta, StoryObj } from '@storybook/react-vite';

export default { title: 'UI/Select' } satisfies Meta;
// The page renders its own selects, so the story takes no args.
type Story = StoryObj;

const countries = [
  { value: 'ar', label: 'Argentina' },
  { value: 'br', label: 'Brazil' },
  { value: 'cl', label: 'Chile' },
  { value: 'co', label: 'Colombia' },
  { value: 'pe', label: 'Peru' },
  { value: 'uy', label: 'Uruguay' },
];

const countryOptions = countries.map(({ value, label }) => (
  <SelectOption
    key={value}
    value={value}
    label={label}
    // A data prop: it reaches onChange with the option.
    code={value.toUpperCase()}
  />
));

type DemoProps = SelectBaseProps & {
  /** Each demo draws its own trigger: the country, or how many are chosen. */
  customTrigger?: boolean;
  children?: ReactNode;
};

function SingleDemo({
  children = countryOptions,
  customTrigger,
  ...props
}: DemoProps) {
  const [value, setValue] = useState('');
  return (
    <Select
      {...props}
      value={value}
      onChange={setValue}
      renderTrigger={
        customTrigger
          ? ({ selected }) => `Ships to ${selected.label}`
          : undefined
      }
      className={controlWidth}
    >
      {children}
    </Select>
  );
}

function MultipleDemo({
  children = countryOptions,
  customTrigger,
  ...props
}: DemoProps) {
  const [values, setValues] = useState<string[]>([]);
  return (
    <MultiSelect
      {...props}
      value={values}
      onChange={setValues}
      renderTrigger={
        customTrigger
          ? ({ selected }) => `${selected.length} chosen`
          : undefined
      }
      className={controlWidth}
    >
      {children}
    </MultiSelect>
  );
}

/** Server search: results come after a delay, `loading` meanwhile. */
const ServerDemo = ({ multiple }: { multiple: boolean }) => {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState(countries);
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState<string[]>([]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setResults(
        countries.filter(({ label }) =>
          label.toLowerCase().startsWith(search.toLowerCase()),
        ),
      );
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [search]);

  const options = results.map(({ value, label }) => (
    <SelectOption key={value} value={value} label={label} />
  ));

  const shared = {
    label: 'Country',
    allowSearch: true,
    onSearch: setSearch,
    loading,
    className: controlWidth,
  } as SelectBaseProps;

  return multiple ? (
    <MultiSelect {...shared} value={values} onChange={setValues}>
      {options}
    </MultiSelect>
  ) : (
    <Select
      {...shared}
      value={values[0] ?? ''}
      onChange={(value) => setValues([value])}
    >
      {options}
    </Select>
  );
};

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex-col-gap-2">
    <p className={`${caption} ${mutedText}`}>{label}</p>
    <div className="flex-row-gap-4 items-start flex-wrap">{children}</div>
  </div>
);

const SelectStories = () => {
  const [multiple, setMultiple] = useState(false);
  const [searchable, setSearchable] = useState(true);
  const [server, setServer] = useState(false);
  const [allowClear, setAllowClear] = useState(true);
  const [md, setMd] = useState(false);
  const [open, setOpen] = useState(false);
  const [rightIcon, setRightIcon] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [reason, setReason] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [readOnlyReason, setReadOnlyReason] = useState(false);
  const [loadingReason, setLoadingReason] = useState(false);
  const [disableWhileLoading, setDisableWhileLoading] = useState(true);
  const [showCheckbox, setShowCheckbox] = useState(false);
  const [showCheckmark, setShowCheckmark] = useState(true);
  const [renderTrigger, setRenderTrigger] = useState(false);

  const sharedFeatures = {
    label: 'Country',
    helpText: 'Where we ship',
    allowClear,
    disableWhileLoading,
    showCheckbox,
    showCheckmark,
    size: md ? ('md' as const) : ('sm' as const),
    look: open ? 'open' : 'outline',
    rightIcon: rightIcon ? <Globe /> : undefined,
    error: error && 'Choose a country',
    customTrigger: renderTrigger,
    // A reason replaces plain `disabled`: they can't be set together.
    ...(reason ? { disabledWithReason: 'Shipping is paused' } : { disabled }),
    ...(readOnlyReason
      ? { readOnlyWithReason: 'Set by your workspace' }
      : { readOnly }),
    // Likewise `loading` and a reason.
    ...(loadingReason
      ? { loadingWithReason: 'Loading the countries' }
      : { loading }),
  };
  const features: DemoProps = searchable
    ? { ...sharedFeatures, allowSearch: true as const }
    : sharedFeatures;

  return (
    <StoryPage>
      <p className={`${caption} ${mutedText}`}>
        The trigger is one tab stop. Enter, Space, ArrowDown or typing opens it;
        Tab moves from the trigger to the search field to the options, Shift+Tab
        back. Delete clears when clearing is allowed.
      </p>

      <StorySection title="Modes">
        <Row label="Single and multiple, without and with client search">
          <SingleDemo label="Single" />
          <SingleDemo label="Single, allowSearch" allowSearch />
          <MultipleDemo label="Multiple" />
          <MultipleDemo label="Multiple, allowSearch" allowSearch allowClear />
        </Row>
        <Row label="Server search: onSearch after a pause, the spinner and a loading row while results load">
          <ServerDemo multiple={false} />
          <ServerDemo multiple />
        </Row>
      </StorySection>

      <StorySection title="Options">
        <Row label="Rich content, a disabled option with a reason, and none at all">
          <SingleDemo label="Owner">
            {['Ada Lovelace', 'Grace Hopper', 'Alan Turing'].map((name) => (
              <SelectOption key={name} value={name} label={name}>
                <div className="flex-row-gap-2 items-center">
                  <Avatar name={name} size="sm" />
                  {name}
                </div>
              </SelectOption>
            ))}
          </SingleDemo>
          <SingleDemo label="Country">
            {countryOptions}
            <SelectOption
              value="ve"
              label="Venezuela"
              disabledWithReason="We don't ship there yet"
            />
          </SingleDemo>
          <SingleDemo label="Empty">{null}</SingleDemo>
        </Row>
      </StorySection>

      <StorySection title="Sizes, looks and status">
        <Row label="sm (default) and md, outline (default) and open">
          <SingleDemo label="Small" />
          <MultipleDemo label="Medium" size="md" />
          <SingleDemo label="Open look" look="open" />
        </Row>
        <Row label="Status messages, and disabled, read-only and loading">
          <SingleDemo label="Error" error="Choose a country" />
          <SingleDemo label="Warning" warning="Shipping takes two weeks" />
          <SingleDemo
            label="Disabled"
            disabledWithReason="Shipping is paused"
          />
          <SingleDemo
            label="Read-only"
            readOnlyWithReason="Set by your workspace"
          />
          <SingleDemo label="Loading" loading />
          <SingleDemo
            label="Loading with a reason"
            loadingWithReason="Loading the countries"
          />
        </Row>
      </StorySection>

      <StorySection title="Features">
        <div className="flex-row-gap-4 flex-wrap">
          <Checkbox checked={multiple} onCheckedChange={setMultiple}>
            Multiple
          </Checkbox>
          <Checkbox checked={searchable} onCheckedChange={setSearchable}>
            Searchable
          </Checkbox>
          <Checkbox checked={server} onCheckedChange={setServer}>
            Server search
          </Checkbox>
          <Checkbox checked={allowClear} onCheckedChange={setAllowClear}>
            allowClear
          </Checkbox>
          <Checkbox checked={md} onCheckedChange={setMd}>
            Size: md
          </Checkbox>
          <Checkbox checked={open} onCheckedChange={setOpen}>
            Look: open
          </Checkbox>
          <Checkbox checked={rightIcon} onCheckedChange={setRightIcon}>
            Right icon
          </Checkbox>
          <Checkbox checked={error} onCheckedChange={setError}>
            Error
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
          <Checkbox checked={showCheckbox} onCheckedChange={setShowCheckbox}>
            showCheckbox
          </Checkbox>
          <Checkbox checked={showCheckmark} onCheckedChange={setShowCheckmark}>
            showCheckmark
          </Checkbox>
          <Checkbox checked={renderTrigger} onCheckedChange={setRenderTrigger}>
            renderTrigger
          </Checkbox>
        </div>
        {server ? (
          <ServerDemo multiple={multiple} />
        ) : multiple ? (
          <MultipleDemo {...features} />
        ) : (
          <SingleDemo {...features} />
        )}
      </StorySection>
    </StoryPage>
  );
};

export const Overview: Story = { render: () => <SelectStories /> };
