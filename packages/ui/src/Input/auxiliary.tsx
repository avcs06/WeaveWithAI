'use client';

import { classNames } from '@packages/styles/classNames';
import { SEARCH_DEBOUNCE_MS } from '@packages/utils/constants';
import { composeHandlers } from '@packages/utils/events';
import { useBoundState } from '@packages/utils/hooks';
import { Eye, EyeOff, Search, X } from 'lucide-react';
import React, {
  type KeyboardEvent,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { IconButton } from '../Button';
import { mergeRefs, useIsDisabled } from '../utils';

import { InputBase } from './Input';
import { fieldButton, searchField } from './Input.css';

import type {
  FieldButtonProps,
  NumberInputProps,
  PasswordInputProps,
  SearchInputProps,
} from './Input.types';

/** A button in the field's box, as tall as its line so the box keeps its height. */
const FieldButton = ({ label, size, ...props }: FieldButtonProps) => (
  <IconButton
    {...props}
    variant="base"
    look="ghost"
    size={size === 'md' ? 'sm' : 'xs'}
    tooltip={label}
    className={fieldButton}
  />
);

/**
 * A search field: filters a list or searches a source as the user types. It
 * shows what's typed at once and sends `onChange` after a pause; Enter sends
 * it at once, Escape and the clear button empty it.
 *
 * @invalidAlternative input[type="search"], Input[type="search"], [role="searchbox"]
 * @invalidAlternative Input[placeholder*="search" i], Input[aria-label*="search" i], input[placeholder*="search" i], input[aria-label*="search" i]
 */
export const SearchInput = ({
  value,
  onChange,
  variant = 'base',
  leftIcon = <Search aria-hidden />,
  ref,
  onBlur,
  onKeyDown,
  className,
  ...props
}: SearchInputProps) => {
  const [text, setText, flush] = useBoundState(
    value,
    onChange,
    SEARCH_DEBOUNCE_MS,
  );
  const inputRef = useRef<HTMLElement>(null);
  const { isDisabled } = useIsDisabled(props);

  const search = (next: string) => {
    setText(next);
    // Emptied, the whole list comes back at once.
    if (!next) flush();
  };

  const clearOnEscape = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Escape' || !text || isDisabled) return;
    event.preventDefault();
    search('');
  };

  return (
    <InputBase
      {...props}
      ref={mergeRefs(ref, inputRef)}
      type="search"
      variant={variant}
      leftIcon={leftIcon}
      autoComplete="off"
      value={text}
      onChange={search}
      // Sent at once, so a submit or the caller's handler reads it.
      onBlur={(event) => {
        flush();
        onBlur?.(event);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') flush();
        composeHandlers(onKeyDown, clearOnEscape)(event);
      }}
      rightAddOn={
        text &&
        !isDisabled && (
          <FieldButton
            label="Clear search"
            size={props.size}
            onClick={() => {
              search('');
              inputRef.current?.focus();
            }}
          >
            <X />
          </FieldButton>
        )
      }
      className={classNames(searchField, className)}
    />
  );
};

/**
 * A password field, with a button at its end that shows or hides the text.
 * `autoComplete` says which password: `current-password` to sign in,
 * `new-password` to sign up or change it.
 *
 * @invalidAlternative input[type="password"], Input[type="password"], input[autoComplete*="password"], Input[autoComplete*="password"]
 */
export const PasswordInput = (props: PasswordInputProps) => {
  const [visible, setVisible] = useState(false);
  const { isDisabled } = useIsDisabled(props);

  return (
    <InputBase
      {...props}
      type={visible ? 'text' : 'password'}
      rightAddOn={
        // One name, with the state in `aria-pressed`: a name that changes
        // on the focused button often isn't announced.
        <FieldButton
          label="Show password"
          size={props.size}
          disabled={isDisabled}
          aria-pressed={visible}
          onClick={() => setVisible(!visible)}
        >
          {visible ? <EyeOff /> : <Eye />}
        </FieldButton>
      }
    />
  );
};

const toText = (number: number | null) => (number === null ? '' : `${number}`);

/** How many decimal places a number is written with: 2 for 0.25. */
const decimalsOf = (number: number) => `${number}`.split('.')[1]?.length ?? 0;

/** The number typed so far: `null` while empty, or only a sign or a point. */
const toNumber = (text: string) => {
  const number = Number(text);
  return text === '' || Number.isNaN(number) ? null : number;
};

// PageUp and PageDown take ten steps.
const stepKeys: Record<string, number> = {
  ArrowUp: 1,
  ArrowDown: -1,
  PageUp: 10,
  PageDown: -10,
};

/**
 * A number field: a price, a count, a capacity. `onChange` gets the number
 * as it's typed, or after `delay`; `null` while empty. The arrow keys and
 * PageUp/PageDown step it, Home and End go to `min` and `max`, and blur or
 * Enter moves it into them.
 *
 * @invalidAlternative input[type="number"], Input[type="number"], [role="spinbutton"], input[inputMode="decimal"], Input[inputMode="decimal"]
 */
export const NumberInput = <D extends number = never>({
  value,
  onChange,
  delay,
  onBlur,
  onKeyDown,
  min = -Infinity,
  max = Infinity,
  step = 1,
  allowDecimal = true,
  allowNegative = true,
  ...props
}: NumberInputProps<D>) => {
  const [fieldValue, report, flush] = useBoundState(value, onChange, delay);

  const [text, setText] = useState(toText(fieldValue));
  const [lastFieldValue, setLastFieldValue] = useState(fieldValue);
  const { isDisabled } = useIsDisabled(props);
  const pattern = new RegExp(
    `^${allowNegative ? '-?' : ''}\\d*${allowDecimal ? '(\\.\\d*)?' : ''}$`,
  );

  // A waiting edit is sent as the field goes, not dropped.
  useLayoutEffect(() => flush, [flush]);

  // A new value replaces the text, unless the text already means it: "1."
  // stays while it's 1.
  if (fieldValue !== lastFieldValue) {
    setLastFieldValue(fieldValue);
    if (fieldValue !== toNumber(text)) setText(toText(fieldValue));
  }

  const change = (typed: string) => {
    // Full-width digits, a decimal comma and pasted spaces read as plain.
    const next = typed.normalize('NFKC').trim().replace(',', '.');
    if (!pattern.test(next)) return;
    setText(next);
    const number = toNumber(next);
    if (number !== fieldValue) report(number);
  };

  // A step never goes below zero when negatives can't be typed.
  const lowest = allowNegative ? min : Math.max(min, 0);
  const clamp = (number: number) => Math.min(max, Math.max(lowest, number));
  const bounds: Record<string, number> = { Home: lowest, End: max };

  const commit = (number: number | null) => {
    setText(toText(number));
    if (number !== fieldValue) report(number);
  };

  // Moved into `min` and `max` and sent at once, so a click that moved focus,
  // like Save, or Enter's submit reads it.
  const settle = () => {
    if (isDisabled) return;
    const number = toNumber(text);
    commit(number === null ? null : clamp(number));
    flush();
  };

  const stepBy = (event: KeyboardEvent<HTMLInputElement>) => {
    if (isDisabled || event.nativeEvent.isComposing) return;
    const steps = stepKeys[event.key];
    const current = toNumber(text) ?? 0;
    // Rounded to the places of the step and the number: in floating point,
    // 0.1 + 0.1 + 0.1 is 0.30000000000000004.
    const places = Math.max(decimalsOf(step), decimalsOf(current));
    const next = steps
      ? clamp(Number((current + steps * step).toFixed(places)))
      : bounds[event.key];
    // Without a bound to go to, Home and End move the caret.
    if (next === undefined || !Number.isFinite(next)) return;
    event.preventDefault();
    commit(next);
  };

  return (
    <InputBase
      {...props}
      role="spinbutton"
      aria-valuemin={Number.isFinite(lowest) ? lowest : undefined}
      aria-valuemax={Number.isFinite(max) ? max : undefined}
      aria-valuenow={toNumber(text) ?? undefined}
      // iOS's number keypads have no minus key.
      inputMode={lowest < 0 ? 'text' : allowDecimal ? 'decimal' : 'numeric'}
      value={text}
      onChange={change}
      onKeyDown={(event) => {
        if (event.key === 'Enter') settle();
        composeHandlers(onKeyDown, stepBy)(event);
      }}
      onBlur={(event) => {
        settle();
        onBlur?.(event);
      }}
    />
  );
};
