import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AtSign } from 'lucide-react';
import React, { createRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import { Controller } from '../Form';
import { axe, renderUI } from '../test-utils';

import { NumberInput, PasswordInput, SearchInput } from './auxiliary';
import { Input } from './Input';

import type { InputProps, NumberInputProps } from './Input.types';
import type { DisabledProps } from '../utils';

const textbox = (name = 'Email') => screen.getByRole('textbox', { name });
const searchbox = (name = 'Search events') =>
  screen.getByRole('searchbox', { name });
const spinbutton = (name = 'Guests') =>
  screen.getByRole('spinbutton', { name });

const Email = ({
  onChange,
  ...props
}: Partial<InputProps> & { initial?: string }) => {
  const { initial = '', ...inputProps } = props;
  const [value, setValue] = useState(initial);
  return (
    <Input
      label="Email"
      autoComplete="email"
      {...inputProps}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
};

const Guests = ({
  onChange,
  initial = null,
  ...props
}: Partial<
  Omit<
    NumberInputProps,
    | 'value'
    | 'onChange'
    | 'delay'
    | 'disabled'
    | 'disabledWithReason'
    | 'readOnly'
    | 'readOnlyWithReason'
    | 'loading'
    | 'loadingWithReason'
    | 'disableWhileLoading'
  >
> &
  DisabledProps & {
    initial?: number | null;
    onChange?: (value: number | null) => void;
  }) => {
  const [value, setValue] = useState<number | null>(initial);
  return (
    <NumberInput
      label="Guests"
      autoComplete="off"
      {...props}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
};

describe('Input', () => {
  it('is a text field named by its label; onChange gets the text', async () => {
    const onChange = jest.fn();
    const { container } = renderUI(<Email onChange={onChange} />);
    await userEvent.tab();
    expect(textbox()).toHaveFocus();
    await userEvent.type(textbox(), 'ada');
    expect(textbox()).toHaveValue('ada');
    expect(onChange).toHaveBeenLastCalledWith('ada');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('passes native attributes to the field, and className to the FormControl', () => {
    const { container } = renderUI(
      <Email
        maxLength={10}
        autoComplete="email"
        type="email"
        placeholder="you@example.com"
        className="w-full"
      />,
    );
    const input = container.querySelector('input')!;
    expect(input).toHaveAttribute('maxlength', '10');
    expect(input).toHaveAttribute('autocomplete', 'email');
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('placeholder', 'you@example.com');
    expect(container.firstElementChild).toHaveClass('w-full');
    expect(input).not.toHaveClass('w-full');
  });

  it('a press anywhere in the box focuses the field', async () => {
    renderUI(<Email leftIcon={<AtSign data-testid="icon" />} />);
    await userEvent.click(screen.getByTestId('icon'));
    expect(textbox()).toHaveFocus();
  });

  it('a click on the label focuses the field', async () => {
    renderUI(<Email />);
    await userEvent.click(screen.getByText('Email'));
    expect(textbox()).toHaveFocus();
  });

  it('when disabled with a reason: read-only, unchanged by typing, its reason in its description, still a tab stop', async () => {
    const onChange = jest.fn();
    const { container } = renderUI(
      <Email
        initial="ada@example.com"
        disabledWithReason="Verified emails can't change"
        onChange={onChange}
      />,
    );
    expect(textbox()).toHaveAttribute('readonly');
    expect(textbox()).toHaveAttribute('aria-disabled', 'true');
    expect(textbox()).toHaveAttribute('tabindex', '0');
    expect(textbox()).toHaveAccessibleDescription(
      "Verified emails can't change",
    );
    await userEvent.tab();
    expect(textbox()).toHaveFocus();
    expect(
      await screen.findByRole('tooltip', { hidden: true }),
    ).toHaveTextContent("Verified emails can't change");
    await userEvent.type(textbox(), 'x');
    expect(textbox()).toHaveValue('ada@example.com');
    expect(onChange).not.toHaveBeenCalled();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('when read-only with a reason: aria-readonly, focusable, unchanged by typing', async () => {
    const onChange = jest.fn();
    const { container } = renderUI(
      <Email
        initial="ada@example.com"
        readOnlyWithReason="The address is generated for you"
        onChange={onChange}
      />,
    );
    expect(textbox()).toHaveAttribute('readonly');
    expect(textbox()).toHaveAttribute('aria-readonly', 'true');
    expect(textbox()).not.toHaveAttribute('aria-disabled');
    expect(textbox()).toHaveAccessibleDescription(
      'The address is generated for you',
    );
    await userEvent.tab();
    expect(textbox()).toHaveFocus();
    await userEvent.type(textbox(), 'x');
    expect(textbox()).toHaveValue('ada@example.com');
    expect(onChange).not.toHaveBeenCalled();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('when silently disabled: out of the tab order', async () => {
    const { container } = renderUI(<Email disabled />);
    expect(textbox()).toHaveAttribute('aria-disabled', 'true');
    expect(textbox()).toHaveAttribute('tabindex', '-1');
    await userEvent.tab();
    expect(textbox()).not.toHaveFocus();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('loading with disableWhileLoading={false}: busy, and typing still works', async () => {
    const onChange = jest.fn();
    const { container } = renderUI(
      <Email loading disableWhileLoading={false} onChange={onChange} />,
    );
    expect(textbox()).toHaveAttribute('aria-busy', 'true');
    expect(textbox()).not.toHaveAttribute('aria-disabled');
    expect(textbox()).not.toHaveAttribute('readonly');
    await userEvent.type(textbox(), 'ada');
    expect(onChange).toHaveBeenLastCalledWith('ada');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('passes its ref to the field', () => {
    const ref = createRef<HTMLElement>();
    renderUI(<Email ref={ref} />);
    expect(ref.current).toBe(textbox());
  });

  describe('delay', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    const user = () =>
      userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const wait = (ms: number) => act(() => jest.advanceTimersByTime(ms));

    const Title = ({
      onChange,
      value: controlled,
    }: {
      onChange: (text: string) => void;
      value?: string;
    }) => {
      const [own, setOwn] = useState('');
      const value = controlled ?? own;
      return (
        <Input
          label="Event title"
          autoComplete="off"
          delay={500}
          value={value}
          onChange={(next) => {
            setOwn(next);
            onChange(next);
          }}
        />
      );
    };
    const title = () => textbox('Event title');

    it('shows what is typed at once, and sends it after a pause, once', async () => {
      const onChange = jest.fn();
      renderUI(<Title onChange={onChange} />);
      await user().type(title(), 'Launch');
      expect(title()).toHaveValue('Launch');
      expect(onChange).not.toHaveBeenCalled();
      await wait(499);
      expect(onChange).not.toHaveBeenCalled();
      await wait(1);
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('Launch');
    });

    it('Enter and blur send a waiting edit at once', async () => {
      const onChange = jest.fn();
      renderUI(<Title onChange={onChange} />);
      await user().type(title(), 'Launch');
      await user().keyboard('{Enter}');
      expect(onChange).toHaveBeenCalledWith('Launch');
      await user().type(title(), ' party');
      await user().tab();
      expect(onChange).toHaveBeenLastCalledWith('Launch party');
      expect(onChange).toHaveBeenCalledTimes(2);
    });

    it('unmounting sends a waiting edit, it doesn’t drop it', async () => {
      const onChange = jest.fn();
      const { unmount } = renderUI(<Title onChange={onChange} />);
      await user().type(title(), 'Launch');
      unmount();
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('Launch');
    });

    it('a new value from outside replaces the text and drops the pending edit', async () => {
      const onChange = jest.fn();
      const { rerender } = renderUI(
        <Title onChange={onChange} value="Launch party" />,
      );
      await user().type(title(), '!');
      expect(title()).toHaveValue('Launch party!');
      rerender(<Title onChange={onChange} value="Product launch" />);
      expect(title()).toHaveValue('Product launch');
      await wait(500);
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('with Controller', () => {
    const EmailForm = ({ onSubmit }: { onSubmit: () => void }) => {
      const { control, handleSubmit } = useForm({
        mode: 'onChange',
        defaultValues: { email: '' },
      });
      return (
        <form noValidate onSubmit={handleSubmit(onSubmit)}>
          <Controller
            name="email"
            control={control}
            rules={{
              required: 'Enter your email',
              validate: (value) => value.includes('@') || 'Enter a valid email',
            }}
          >
            {({ field }) => (
              <Input
                label="Email"
                helpText="For receipts"
                autoComplete="email"
                {...field}
              />
            )}
          </Controller>
          <button type="submit">Save</button>
        </form>
      );
    };

    it('{...field} is all it needs: the name, required, errors that come and go, focus on submit', async () => {
      const onSubmit = jest.fn();
      const { container } = renderUI(<EmailForm onSubmit={onSubmit} />);
      expect(textbox()).toHaveAttribute('name', 'email');
      expect(textbox()).toHaveAttribute('aria-required', 'true');
      expect(textbox()).toHaveAccessibleDescription('For receipts');

      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(onSubmit).not.toHaveBeenCalled();
      expect(textbox()).toHaveFocus();
      expect(textbox()).toBeInvalid();
      expect(textbox()).toHaveAccessibleDescription(
        'Enter your email For receipts',
      );
      expect(await axe(container)).toHaveNoViolations();

      await userEvent.type(textbox(), 'ada');
      expect(textbox()).toBeInvalid();
      expect(textbox()).toHaveAccessibleDescription(
        'Enter a valid email For receipts',
      );
      await userEvent.type(textbox(), '@example.com');
      expect(textbox()).toBeValid();
      expect(textbox()).toHaveAccessibleDescription('For receipts');
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(onSubmit).toHaveBeenCalledWith(
        { email: 'ada@example.com' },
        expect.anything(),
      );
    });
  });
});

describe('PasswordInput', () => {
  const Password = (
    props: Partial<React.ComponentProps<typeof PasswordInput>>,
  ) => {
    const [value, setValue] = useState('correct-horse');
    return (
      <PasswordInput
        label="Password"
        autoComplete="current-password"
        {...props}
        value={value}
        onChange={setValue}
      />
    );
  };
  const toggle = () => screen.getByRole('button', { name: 'Show password' });

  it('hides the text; its toggle keeps one name and reports its state in aria-pressed', async () => {
    const { container } = renderUI(<Password />);
    const input = container.querySelector('input')!;
    expect(input).toHaveAttribute('type', 'password');
    expect(toggle()).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(toggle());
    expect(input).toHaveAttribute('type', 'text');
    expect(toggle()).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('textbox', { name: 'Password' })).toBe(input);
    await userEvent.click(toggle());
    expect(input).toHaveAttribute('type', 'password');
    expect(toggle()).toHaveAttribute('aria-pressed', 'false');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('Tab goes field then toggle; Enter and Space on the toggle keep focus on it', async () => {
    const { container } = renderUI(<Password />);
    const input = container.querySelector('input')!;
    await userEvent.tab();
    expect(input).toHaveFocus();
    await userEvent.tab();
    expect(toggle()).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(input).toHaveAttribute('type', 'text');
    expect(toggle()).toHaveFocus();
    await userEvent.keyboard(' ');
    expect(input).toHaveAttribute('type', 'password');
    expect(toggle()).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(input).toHaveFocus();
  });

  it('a press on the toggle leaves focus in the field, ready to type', async () => {
    const { container } = renderUI(<Password />);
    const input = container.querySelector('input')!;
    await userEvent.click(toggle());
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute('type', 'text');
  });

  it('when disabled with a reason: the field keeps its tab stop, the toggle leaves the tab order and doesn’t toggle', async () => {
    const { container } = renderUI(
      <Password disabledWithReason="Locked by an admin" />,
    );
    const input = container.querySelector('input')!;
    expect(input).toHaveAttribute('tabindex', '0');
    expect(input).toHaveAttribute('aria-disabled', 'true');
    expect(input).toHaveAccessibleDescription('Locked by an admin');
    expect(toggle()).toHaveAttribute('aria-disabled', 'true');
    expect(toggle()).toHaveAttribute('tabindex', '-1');
    await userEvent.click(toggle());
    expect(input).toHaveAttribute('type', 'password');
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('NumberInput', () => {
  it('is a spinbutton carrying its bounds and value', async () => {
    const { container } = renderUI(
      <Guests initial={10} min={0} max={20} step={2} />,
    );
    expect(spinbutton()).toHaveAttribute('aria-valuemin', '0');
    expect(spinbutton()).toHaveAttribute('aria-valuemax', '20');
    expect(spinbutton()).toHaveAttribute('aria-valuenow', '10');
    expect(spinbutton()).toHaveValue('10');
    expect(spinbutton()).toHaveAttribute('inputmode', 'decimal');
    await userEvent.tab();
    expect(spinbutton()).toHaveFocus();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('typing sends the number; empty is null, and aria-valuenow goes with it', async () => {
    const onChange = jest.fn();
    renderUI(<Guests onChange={onChange} />);
    expect(spinbutton()).not.toHaveAttribute('aria-valuenow');
    await userEvent.type(spinbutton(), '12');
    expect(onChange).toHaveBeenLastCalledWith(12);
    expect(spinbutton()).toHaveAttribute('aria-valuenow', '12');
    await userEvent.clear(spinbutton());
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(spinbutton()).not.toHaveAttribute('aria-valuenow');
  });

  it('letters don’t land; a decimal comma reads as a point', async () => {
    const onChange = jest.fn();
    renderUI(<Guests onChange={onChange} />);
    await userEvent.type(spinbutton(), 'a1,5x');
    expect(spinbutton()).toHaveValue('1.5');
    expect(onChange).toHaveBeenLastCalledWith(1.5);
  });

  it('allowDecimal={false} and allowNegative={false} refuse their characters', async () => {
    const onChange = jest.fn();
    renderUI(
      <Guests onChange={onChange} allowDecimal={false} allowNegative={false} />,
    );
    await userEvent.type(spinbutton(), '-1.5');
    expect(spinbutton()).toHaveValue('15');
    expect(onChange).toHaveBeenLastCalledWith(15);
    // No negatives to type: the lowest value is 0, on a number keypad.
    expect(spinbutton()).toHaveAttribute('aria-valuemin', '0');
    expect(spinbutton()).toHaveAttribute('inputmode', 'numeric');
  });

  it('the arrows step, PageUp and PageDown take ten steps, Home and End go to min and max', async () => {
    const onChange = jest.fn();
    renderUI(
      <Guests initial={10} min={0} max={20} step={2} onChange={onChange} />,
    );
    spinbutton().focus();
    await userEvent.keyboard('{ArrowUp}');
    expect(spinbutton()).toHaveValue('12');
    expect(spinbutton()).toHaveAttribute('aria-valuenow', '12');
    await userEvent.keyboard('{ArrowDown}');
    expect(spinbutton()).toHaveValue('10');
    await userEvent.keyboard('{PageUp}');
    expect(spinbutton()).toHaveValue('20');
    await userEvent.keyboard('{PageDown}');
    expect(spinbutton()).toHaveValue('0');
    await userEvent.keyboard('{End}');
    expect(spinbutton()).toHaveValue('20');
    expect(onChange).toHaveBeenLastCalledWith(20);
    await userEvent.keyboard('{Home}');
    expect(spinbutton()).toHaveValue('0');
    expect(onChange).toHaveBeenLastCalledWith(0);
    expect(spinbutton()).toHaveFocus();
  });

  it('stepping never crosses min or max', async () => {
    renderUI(<Guests initial={20} min={0} max={20} step={2} />);
    spinbutton().focus();
    await userEvent.keyboard('{ArrowUp}');
    expect(spinbutton()).toHaveValue('20');
    await userEvent.keyboard('{Home}{ArrowDown}');
    expect(spinbutton()).toHaveValue('0');
  });

  it('blur and Enter move an out-of-range number into min and max', async () => {
    const onChange = jest.fn();
    renderUI(<Guests initial={5} min={0} max={20} onChange={onChange} />);
    await userEvent.clear(spinbutton());
    await userEvent.type(spinbutton(), '99');
    expect(spinbutton()).toHaveValue('99');
    await userEvent.keyboard('{Enter}');
    expect(spinbutton()).toHaveValue('20');
    expect(onChange).toHaveBeenLastCalledWith(20);
    await userEvent.clear(spinbutton());
    await userEvent.type(spinbutton(), '-5');
    await userEvent.tab();
    expect(spinbutton()).toHaveValue('0');
    expect(onChange).toHaveBeenLastCalledWith(0);
  });

  it('with delay: Enter settles and sends at once', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });
    const onChange = jest.fn();
    const DelayedGuests = () => {
      const [value, setValue] = useState<number | null>(5);
      return (
        <NumberInput
          label="Guests"
          autoComplete="off"
          min={0}
          max={10}
          delay={500}
          value={value}
          onChange={(next) => {
            setValue(next);
            onChange(next);
          }}
        />
      );
    };
    renderUI(<DelayedGuests />);
    await user.clear(spinbutton());
    await user.type(spinbutton(), '99');
    expect(spinbutton()).toHaveValue('99');
    expect(onChange).not.toHaveBeenCalled();
    await user.keyboard('{Enter}');
    expect(spinbutton()).toHaveValue('10');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(10);
    jest.useRealTimers();
  });

  it('when disabled with a reason: focusable, but the arrows and typing don’t move it', async () => {
    const onChange = jest.fn();
    const { container } = renderUI(
      <Guests
        initial={5}
        min={0}
        max={20}
        disabledWithReason="Guest list is locked"
        onChange={onChange}
      />,
    );
    expect(spinbutton()).toHaveAttribute('aria-disabled', 'true');
    expect(spinbutton()).toHaveAttribute('tabindex', '0');
    expect(spinbutton()).toHaveAccessibleDescription('Guest list is locked');
    await userEvent.tab();
    expect(spinbutton()).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}{End}');
    await userEvent.type(spinbutton(), '9');
    expect(spinbutton()).toHaveValue('5');
    expect(onChange).not.toHaveBeenCalled();
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('SearchInput', () => {
  const Search = ({
    onChange,
    initial = '',
  }: {
    onChange: (text: string) => void;
    initial?: string;
  }) => {
    const [value, setValue] = useState(initial);
    return (
      <>
        <SearchInput
          aria-label="Search events"
          value={value}
          onChange={(text) => {
            setValue(text);
            onChange(text);
          }}
        />
        <button onClick={() => setValue('')}>Reset</button>
      </>
    );
  };

  const search = () => searchbox('Search events');

  it('is a base Input with a search icon and no autocomplete', async () => {
    const { container } = renderUI(<Search onChange={jest.fn()} />);
    expect(search()).toHaveAttribute('type', 'search');
    expect(search()).toHaveAttribute('autocomplete', 'off');
    expect(container.querySelector('.lucide-search')).not.toBeNull();
    await userEvent.tab();
    expect(search()).toHaveFocus();
    expect(await axe(container)).toHaveNoViolations();
  });

  describe('debouncing', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    const user = () =>
      userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const wait = (ms: number) => act(() => jest.advanceTimersByTime(ms));

    it('shows what is typed at once, and sends it after a 300ms pause, once', async () => {
      const onChange = jest.fn();
      renderUI(<Search onChange={onChange} />);
      await user().type(search(), 'jazz');
      expect(search()).toHaveValue('jazz');
      expect(onChange).not.toHaveBeenCalled();
      await wait(299);
      expect(onChange).not.toHaveBeenCalled();
      await wait(1);
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('jazz');
    });

    it('typing again before the pause ends restarts the wait', async () => {
      const onChange = jest.fn();
      renderUI(<Search onChange={onChange} />);
      await user().type(search(), 'ja');
      await wait(200);
      await user().type(search(), 'zz');
      await wait(200);
      expect(onChange).not.toHaveBeenCalled();
      await wait(100);
      expect(onChange).toHaveBeenCalledWith('jazz');
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it("the echo of its own change doesn't overwrite what was typed since", async () => {
      const onChange = jest.fn();
      renderUI(<Search onChange={onChange} />);
      await user().type(search(), 'ja');
      await wait(300);
      await user().type(search(), 'zz');
      expect(search()).toHaveValue('jazz');
    });

    it('Enter sends a waiting search at once', async () => {
      const onChange = jest.fn();
      renderUI(<Search onChange={onChange} />);
      await user().type(search(), 'rock');
      await user().keyboard('{Enter}');
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('rock');
      expect(search()).toHaveFocus();
    });

    it('Escape empties the field and sends the empty search at once', async () => {
      const onChange = jest.fn();
      renderUI(<Search onChange={onChange} initial="rock" />);
      search().focus();
      await user().keyboard('{Escape}');
      expect(search()).toHaveValue('');
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('');
      expect(search()).toHaveFocus();
      await user().keyboard('{Escape}');
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('the clear button shows only with text; it empties the field, sends at once, and focus stays in the field', async () => {
      const onChange = jest.fn();
      const { container } = renderUI(<Search onChange={onChange} />);
      expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
      await user().type(search(), 'jazz');
      const clear = screen.getByRole('button', { name: 'Clear search' });
      await user().tab();
      expect(clear).toHaveFocus();
      await user().keyboard('{Enter}');
      expect(search()).toHaveValue('');
      expect(onChange).toHaveBeenCalledWith('');
      expect(search()).toHaveFocus();
      expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
      // axe needs real timers.
      jest.useRealTimers();
      expect(await axe(container)).toHaveNoViolations();
    });

    it('a new value from outside replaces the text and drops the pending change', async () => {
      const onChange = jest.fn();
      const Controlled = ({ value }: { value: string }) => (
        <SearchInput
          aria-label="Search events"
          value={value}
          onChange={onChange}
        />
      );
      const { rerender } = renderUI(<Controlled value="rock" />);
      await user().type(search(), 'y');
      expect(search()).toHaveValue('rocky');
      rerender(<Controlled value="" />);
      expect(search()).toHaveValue('');
      await wait(300);
      expect(onChange).not.toHaveBeenCalled();
    });

    it('unmounting drops the pending change', async () => {
      const onChange = jest.fn();
      const { unmount } = renderUI(<Search onChange={onChange} />);
      await user().type(search(), 'jazz');
      unmount();
      await wait(300);
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  it('when disabled with a reason: focusable, no clear button, Escape does nothing', async () => {
    const onChange = jest.fn();
    const { container } = renderUI(
      <SearchInput
        aria-label="Search events"
        disabledWithReason="Search opens with the event list"
        value="rock"
        onChange={onChange}
      />,
    );
    expect(search()).toHaveAttribute('aria-disabled', 'true');
    expect(search()).toHaveAttribute('tabindex', '0');
    expect(search()).toHaveAttribute('readonly');
    expect(search()).toHaveAccessibleDescription(
      'Search opens with the event list',
    );
    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
    await userEvent.tab();
    expect(search()).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    expect(search()).toHaveValue('rock');
    expect(onChange).not.toHaveBeenCalled();
    expect(await axe(container)).toHaveNoViolations();
  });
});
