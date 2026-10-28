import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { memo, type ReactNode, useEffect, useState } from 'react';
import { renderToString } from 'react-dom/server';
import { useForm } from 'react-hook-form';

import { Controller } from '../Form';
import { axe, Providers, renderUI } from '../test-utils';

import { MultiSelect, Select } from './Select';
import { SelectGroup, SelectOption } from './SelectOption';

import type { SelectOptionData, SelectSearchProps } from './Select.types';

// Closed (or open without a search field), the box itself is the combobox.
const combobox = (name: string | RegExp = 'Country') =>
  screen.getByRole('combobox', { name });
const listbox = () => screen.getByRole('listbox');
const option = (name: string | RegExp) => screen.getByRole('option', { name });
const optionNames = () =>
  screen.getAllByRole('option').map((node) => node.textContent);
// Open with a search field, it's the editable combobox; the box only groups it.
const searchField = (name = 'Search Country') =>
  screen.getByRole('combobox', { name });
const triggerBox = (name: string | RegExp = 'Country') =>
  screen.getByRole('group', { name });
/** The visible value in the box, without its hidden edit hint. */
const shownValue = () =>
  combobox().querySelector('[data-slot="value"]')?.textContent;
/** The Select's live announcement, among the page's status regions. */
const announcement = () =>
  screen.getAllByRole('status').find((node) => node.textContent)?.textContent;
const after = () => screen.getByRole('button', { name: 'After' });

const countries = [
  { value: 'pe', label: 'Peru' },
  { value: 'cl', label: 'Chile' },
  { value: 'ar', label: 'Argentina' },
];

const countryOptions = countries.map(({ value, label }) => (
  <SelectOption key={value} value={value} label={label} />
));

type HarnessProps = SelectSearchProps & {
  label?: string;
  allowClear?: boolean;
  loading?: boolean;
  disabledWithReason?: string;
  onBlur?: () => void;
  children?: ReactNode;
};

function Single({
  initial = '',
  onChange,
  label = 'Country',
  children = countryOptions,
  ...props
}: HarnessProps & {
  initial?: string;
  onChange?: (value: string, option: SelectOptionData | undefined) => void;
}) {
  const [value, setValue] = useState(initial);
  const handleChange = (next: string, data: SelectOptionData | undefined) => {
    setValue(next);
    onChange?.(next, data);
  };
  return (
    <Select {...props} label={label} value={value} onChange={handleChange}>
      {children}
    </Select>
  );
}

function Multiple({
  initial = [],
  onChange,
  children = countryOptions,
  ...props
}: HarnessProps & {
  initial?: string[];
  onChange?: (values: string[], options: SelectOptionData[]) => void;
  renderTrigger?: (trigger: {
    selected: SelectOptionData[];
    open: boolean;
  }) => ReactNode;
}) {
  const [values, setValues] = useState(initial);
  const handleChange = (next: string[], data: SelectOptionData[]) => {
    setValues(next);
    onChange?.(next, data);
  };
  return (
    <MultiSelect
      {...props}
      label="Country"
      value={values}
      onChange={handleChange}
    >
      {children}
    </MultiSelect>
  );
}

const openWithKeyboard = async () => {
  combobox().focus();
  await userEvent.keyboard('{Enter}');
  return screen.findByRole('listbox');
};

// Radix opens and moves focus after a timer: wait past it before asserting
// nothing happened.
const settle = () =>
  act(() => new Promise((resolve) => setTimeout(resolve, 50)));

// The shown tooltip is aria-hidden (the trigger's description says the same),
// so role queries need `hidden`.
const tooltipText = async () =>
  (await screen.findByRole('tooltip', { hidden: true })).textContent;

describe('Select', () => {
  describe('trigger', () => {
    it('is a combobox named by its label, the only tab stop, with the placeholder', async () => {
      const { container } = renderUI(
        <>
          <Single />
          <button>After</button>
        </>,
      );
      const trigger = combobox();
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
      expect(trigger).not.toHaveAttribute('name');
      expect(trigger).toHaveTextContent('Select Country');
      await userEvent.tab();
      expect(trigger).toHaveFocus();
      await userEvent.tab();
      expect(after()).toHaveFocus();
      expect(await axe(container)).toHaveNoViolations();
    });

    it('without a label: named by aria-label, else by its placeholder', () => {
      const { rerender } = renderUI(
        <Select aria-label="Ship to" value="" onChange={jest.fn()}>
          {countryOptions}
        </Select>,
      );
      expect(combobox('Ship to')).toBeInTheDocument();
      rerender(
        <Select value="" onChange={jest.fn()}>
          {countryOptions}
        </Select>,
      );
      expect(combobox('Select')).toHaveTextContent('Select');
    });

    it('shows the selected label, on the server too', () => {
      const html = renderToString(
        <Providers>
          <Single initial="cl" />
        </Providers>,
      );
      expect(html).toContain('Chile');
      expect(html).not.toContain('Select Country');
    });

    it('renderTrigger replaces what the box shows; the chevron and the search field stay', async () => {
      renderUI(
        <Multiple
          initial={['pe', 'cl']}
          allowSearch
          renderTrigger={({ selected, open }) => (
            <span>
              {selected.length} chosen{open ? ', open' : ''}
            </span>
          )}
        />,
      );
      expect(combobox()).toHaveTextContent('2 chosen');
      expect(combobox().querySelector('[data-slot="chevron"]')).not.toBeNull();
      await openWithKeyboard();
      // Open, the search field is the combobox; the box groups it with the
      // trigger and chevron.
      expect(triggerBox()).toHaveTextContent('2 chosen, open');
      expect(
        triggerBox().querySelector('[data-slot="chevron"]'),
      ).not.toBeNull();
      expect(searchField()).toBeVisible();
      expect(searchField()).toHaveFocus();
      expect(triggerBox()).toContainElement(searchField());
    });

    it('help text describes the combobox, and the search field while it is open', async () => {
      const { container } = renderUI(
        <Select
          label="Country"
          helpText="Where the order ships"
          value=""
          onChange={jest.fn()}
        >
          {countryOptions}
        </Select>,
      );
      expect(combobox()).toHaveAccessibleDescription('Where the order ships');
      await openWithKeyboard();
      expect(searchField()).toHaveAccessibleDescription(
        'Where the order ships',
      );
      expect(await axe(document.body)).toHaveNoViolations();
      await userEvent.keyboard('{Escape}');
      expect(combobox()).toHaveFocus();
      expect(await axe(container)).toHaveNoViolations();
    });

    it('a click on the label focuses it', async () => {
      renderUI(<Single />);
      await userEvent.click(screen.getByText('Country'));
      expect(combobox()).toHaveFocus();
      expect(screen.queryByRole('listbox')).toBeNull();
    });
  });

  describe('options', () => {
    it("are listed in their elements' order, also after they change", async () => {
      const Ordered = ({ values }: { values: string[] }) => (
        <Single>
          {values.map((value) => (
            <SelectOption key={value} value={value} label={value} />
          ))}
        </Single>
      );
      const { rerender } = renderUI(<Ordered values={['a', 'b', 'c']} />);
      rerender(<Ordered values={['c', 'a', 'd', 'b']} />);
      await openWithKeyboard();
      expect(optionNames()).toEqual(['c', 'a', 'd', 'b']);
    });

    it('take their place when a wrapper mounts one later', async () => {
      const Later = () => {
        const [shown, setShown] = useState(false);
        useEffect(() => setShown(true), []);
        return shown && <SelectOption value="br" label="Brazil" />;
      };
      renderUI(
        <Single>
          <SelectOption value="pe" label="Peru" />
          <Later />
          <SelectOption value="cl" label="Chile" />
        </Single>,
      );
      await openWithKeyboard();
      expect(optionNames()).toEqual(['Peru', 'Brazil', 'Chile']);
    });

    it("draw their children as the row; the label is the trigger's", async () => {
      renderUI(
        <Single>
          <SelectOption value="pe" label="Peru">
            <span>PE · Peru</span>
          </SelectOption>
        </Single>,
      );
      await openWithKeyboard();
      await userEvent.click(option('PE · Peru'));
      // The box also carries a hidden "clear" hint, so read its value slot.
      expect(shownValue()).toBe('Peru');
      expect(combobox()).toHaveFocus();
    });

    it("new content for one option re-renders only that option's content", async () => {
      const rendered: string[] = [];
      const RowContent = memo(({ text }: { text: string }) => {
        rendered.push(text);
        return <span>{text}</span>;
      });
      const Demo = ({ peru }: { peru: string }) => (
        <Single>
          <SelectOption value="pe" label="Peru">
            <RowContent text={peru} />
          </SelectOption>
          <SelectOption value="cl" label="Chile">
            <RowContent text="Chile row" />
          </SelectOption>
        </Single>
      );
      const { rerender } = renderUI(<Demo peru="Peru row" />);
      await openWithKeyboard();
      expect(screen.getByText('Chile row')).toBeInTheDocument();

      rendered.length = 0;
      rerender(<Demo peru="Peru row, updated" />);
      expect(screen.getByText('Peru row, updated')).toBeInTheDocument();
      expect(rendered).toEqual(['Peru row, updated']);
    });

    it('pass every other prop as option data, but not children or the disabled state', async () => {
      const onChange = jest.fn();
      renderUI(
        <Single onChange={onChange}>
          <SelectOption value="pe" label="Peru" code="+51" disabled={false}>
            Peru (+51)
          </SelectOption>
        </Single>,
      );
      await openWithKeyboard();
      await userEvent.click(option('Peru (+51)'));
      expect(onChange).toHaveBeenCalledWith('pe', {
        value: 'pe',
        label: 'Peru',
        code: '+51',
      });
    });

    it('a selected value keeps its label after its option is gone; one never described shows its value', () => {
      const { rerender } = renderUI(<Single initial="cl" />);
      rerender(<Single initial="cl">{null}</Single>);
      expect(combobox()).toHaveTextContent('Chile');

      rerender(<Single initial="zz">{countryOptions}</Single>);
      expect(combobox()).toHaveTextContent('Chile');
    });

    it('when disabled: reachable so its reason is, not chosen, the reason on hover and in its description', async () => {
      const onChange = jest.fn();
      renderUI(
        <Single onChange={onChange}>
          <SelectOption value="pe" label="Peru" />
          <SelectOption
            value="cl"
            label="Chile"
            disabledWithReason="We don't ship there yet"
          />
          <SelectOption value="ar" label="Argentina" />
        </Single>,
      );
      await openWithKeyboard();
      await waitFor(() => expect(searchField()).toHaveFocus());
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(option('Peru')).toHaveFocus());
      // A disabled option stays in the arrow keys so keyboard users hear why.
      await userEvent.keyboard('{ArrowDown}');
      const chile = option('Chile');
      await waitFor(() => expect(chile).toHaveFocus());
      expect(chile).toHaveAttribute('aria-disabled', 'true');
      expect(chile).toHaveAccessibleDescription("We don't ship there yet");
      await userEvent.keyboard('{Enter}');
      expect(onChange).not.toHaveBeenCalled();
      expect(listbox()).toBeVisible();
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(option('Argentina')).toHaveFocus());

      // Hovered first: after a click, the same element gets no new hover.
      await userEvent.hover(chile);
      expect(await tooltipText()).toContain("We don't ship there yet");
      expect(await axe(document.body)).toHaveNoViolations();
      await userEvent.click(chile);
      expect(onChange).not.toHaveBeenCalled();
      expect(listbox()).toBeVisible();
    });
  });

  describe('single', () => {
    it('opens into the search field, Tab lands on the selected option; Enter chooses, closes and returns focus to the trigger', async () => {
      const onChange = jest.fn();
      renderUI(<Single initial="cl" onChange={onChange} />);
      await openWithKeyboard();
      expect(listbox()).toHaveAccessibleName('Country');
      // While open, the search field carries the combobox state.
      expect(searchField()).toHaveFocus();
      expect(searchField()).toHaveAttribute('aria-expanded', 'true');
      expect(searchField()).toHaveAttribute('aria-controls', listbox().id);
      expect(searchField()).toHaveAttribute('aria-autocomplete', 'list');
      await userEvent.tab();
      await waitFor(() => expect(option('Chile')).toHaveFocus());
      expect(option('Chile')).toHaveAttribute('aria-selected', 'true');
      expect(option('Chile').lastElementChild).toHaveAttribute(
        'data-slot',
        'check',
      );
      expect(await axe(document.body)).toHaveNoViolations();

      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(option('Argentina')).toHaveFocus());
      await userEvent.keyboard('{Enter}');
      expect(onChange).toHaveBeenCalledWith('ar', {
        value: 'ar',
        label: 'Argentina',
      });
      expect(screen.queryByRole('listbox')).toBeNull();
      expect(combobox()).toHaveFocus();
      expect(combobox()).toHaveTextContent('Argentina');
    });

    it('without a search field, opens with Space and ArrowDown on the first option; Home, End and typeahead move', async () => {
      renderUI(<Single allowSearch={false} />);
      combobox().focus();
      await userEvent.keyboard('[Space]');
      await waitFor(() => expect(option('Peru')).toHaveFocus());
      await userEvent.keyboard('{End}');
      await waitFor(() => expect(option('Argentina')).toHaveFocus());
      await userEvent.keyboard('{Home}');
      await waitFor(() => expect(option('Peru')).toHaveFocus());
      await userEvent.keyboard('c');
      await waitFor(() => expect(option('Chile')).toHaveFocus());
      await userEvent.keyboard('{Escape}');

      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(option('Peru')).toHaveFocus());
    });

    it('without a search field, a letter on the closed trigger opens on the next option starting with it; PageDown moves by a page and Alt+ArrowUp chooses', async () => {
      const onChange = jest.fn();
      const { container } = renderUI(
        <Single allowSearch={false} onChange={onChange} />,
      );
      combobox().focus();
      await userEvent.keyboard('a');
      await screen.findByRole('listbox');
      await waitFor(() => expect(option('Argentina')).toHaveFocus());
      await userEvent.keyboard('{Home}');
      await waitFor(() => expect(option('Peru')).toHaveFocus());
      await userEvent.keyboard('{PageDown}');
      await waitFor(() => expect(option('Argentina')).toHaveFocus());
      await userEvent.keyboard('{Alt>}{ArrowUp}{/Alt}');
      expect(onChange).toHaveBeenCalledWith('ar', {
        value: 'ar',
        label: 'Argentina',
      });
      expect(screen.queryByRole('listbox')).toBeNull();
      expect(combobox()).toHaveFocus();
      expect(shownValue()).toBe('Argentina');
      expect(await axe(container)).toHaveNoViolations();
    });

    it('without a search field, ArrowUp and Home on the closed trigger open on the first option, End on the last', async () => {
      const { container } = renderUI(<Single allowSearch={false} />);
      combobox().focus();
      await userEvent.keyboard('{ArrowUp}');
      await screen.findByRole('listbox');
      await waitFor(() => expect(option('Peru')).toHaveFocus());
      expect(await axe(document.body)).toHaveNoViolations();
      await userEvent.keyboard('{Escape}');
      expect(combobox()).toHaveFocus();

      await userEvent.keyboard('{End}');
      await screen.findByRole('listbox');
      await waitFor(() => expect(option('Argentina')).toHaveFocus());
      await userEvent.keyboard('{Escape}');

      await userEvent.keyboard('{Home}');
      await screen.findByRole('listbox');
      await waitFor(() => expect(option('Peru')).toHaveFocus());
      await userEvent.keyboard('{Escape}');
      expect(await axe(container)).toHaveNoViolations();
    });

    it('without a search field, Shift+Tab or ArrowUp from the first option goes back to the trigger, the menu open', async () => {
      renderUI(<Single allowSearch={false} />);
      await openWithKeyboard();
      await waitFor(() => expect(option('Peru')).toHaveFocus());
      await userEvent.keyboard('{ArrowUp}');
      expect(combobox()).toHaveFocus();
      expect(listbox()).toBeVisible();

      await userEvent.tab();
      await waitFor(() => expect(option('Peru')).toHaveFocus());
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(option('Chile')).toHaveFocus());
      await userEvent.tab({ shift: true });
      expect(combobox()).toHaveFocus();
      expect(listbox()).toBeVisible();
    });

    it('Escape closes back to the trigger; Tab from an option chooses it and moves on past the Select', async () => {
      const onChange = jest.fn();
      renderUI(
        <>
          <Single allowSearch={false} onChange={onChange} />
          <button>After</button>
        </>,
      );
      await openWithKeyboard();
      await waitFor(() => expect(option('Peru')).toHaveFocus());
      await userEvent.keyboard('{Escape}');
      expect(screen.queryByRole('listbox')).toBeNull();
      expect(combobox()).toHaveFocus();
      expect(combobox()).toHaveAttribute('aria-expanded', 'false');

      await openWithKeyboard();
      await waitFor(() => expect(option('Peru')).toHaveFocus());
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(option('Chile')).toHaveFocus());
      await userEvent.tab();
      expect(screen.queryByRole('listbox')).toBeNull();
      expect(after()).toHaveFocus();
      await settle();
      expect(after()).toHaveFocus();
      // Tabbing past accepts the focused option (APG select-only combobox),
      // unlike Escape.
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('cl', {
        value: 'cl',
        label: 'Chile',
      });
      expect(shownValue()).toBe('Chile');
    });

    it('a click outside closes it without moving focus', async () => {
      renderUI(
        <>
          <Single allowSearch={false} />
          <p>Outside</p>
        </>,
      );
      await openWithKeyboard();
      await waitFor(() => expect(option('Peru')).toHaveFocus());
      await userEvent.click(screen.getByText('Outside'));
      expect(screen.queryByRole('listbox')).toBeNull();
      await settle();
      expect(combobox()).not.toHaveFocus();
    });

    it('runs onBlur once, when focus leaves the trigger, the search and the menu', async () => {
      const onBlur = jest.fn();
      renderUI(
        <>
          <Single allowSearch onBlur={onBlur} />
          <button>After</button>
        </>,
      );
      await openWithKeyboard();
      await waitFor(() => expect(searchField()).toHaveFocus());
      // Moving between the search field and the options stays inside.
      await userEvent.tab();
      await waitFor(() => expect(option('Peru')).toHaveFocus());
      await userEvent.tab({ shift: true });
      await waitFor(() => expect(searchField()).toHaveFocus());
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(option('Peru')).toHaveFocus());
      await userEvent.keyboard('{ArrowUp}');
      await waitFor(() => expect(searchField()).toHaveFocus());
      expect(onBlur).not.toHaveBeenCalled();

      // Escape lands back on the (closed) trigger: still inside.
      await userEvent.keyboard('{Escape}');
      expect(screen.queryByRole('listbox')).toBeNull();
      expect(combobox()).toHaveFocus();
      expect(onBlur).not.toHaveBeenCalled();

      await userEvent.tab();
      expect(after()).toHaveFocus();
      expect(onBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe('multiple', () => {
    it('toggles values in selection order, staying open on the option', async () => {
      const onChange = jest.fn();
      renderUI(<Multiple allowSearch={false} onChange={onChange} />);
      await openWithKeyboard();
      await waitFor(() => expect(option('Peru')).toHaveFocus());
      await userEvent.keyboard('{End}');
      await waitFor(() => expect(option('Argentina')).toHaveFocus());
      await userEvent.keyboard('{Enter}');
      expect(onChange).toHaveBeenLastCalledWith(
        ['ar'],
        [{ value: 'ar', label: 'Argentina' }],
      );
      expect(option('Argentina')).toHaveFocus();
      await userEvent.keyboard('{Home}');
      await waitFor(() => expect(option('Peru')).toHaveFocus());
      await userEvent.keyboard('[Space]');
      expect(onChange).toHaveBeenLastCalledWith(
        ['ar', 'pe'],
        [
          { value: 'ar', label: 'Argentina' },
          { value: 'pe', label: 'Peru' },
        ],
      );
      await userEvent.keyboard('{Enter}');
      expect(onChange).toHaveBeenLastCalledWith(
        ['ar'],
        [{ value: 'ar', label: 'Argentina' }],
      );
      expect(listbox()).toHaveAttribute('aria-multiselectable', 'true');
      expect(option('Argentina')).toHaveAttribute('aria-selected', 'true');
      expect(option('Peru')).toHaveAttribute('aria-selected', 'false');
      expect(await axe(document.body)).toHaveNoViolations();
    });

    it('showCheckbox draws a decorative checkbox per option, its state following aria-selected', async () => {
      renderUI(
        <MultiSelect
          label="Country"
          value={['cl']}
          onChange={jest.fn()}
          allowSearch={false}
          showCheckbox
          showCheckmark={false}
        >
          {countryOptions}
        </MultiSelect>,
      );
      await openWithKeyboard();
      const checkboxOf = (name: string) =>
        option(name).querySelector('[data-slot="checkbox"]');
      expect(checkboxOf('Chile')).toHaveAttribute('data-state', 'checked');
      expect(checkboxOf('Peru')).toHaveAttribute('data-state', 'unchecked');
      // The checkbox is decoration: the option says its selection, and no check
      // mark leaves no slot.
      expect(checkboxOf('Chile')).toHaveAttribute('aria-hidden', 'true');
      expect(option('Chile')).toHaveAttribute('aria-selected', 'true');
      expect(option('Chile').querySelector('[data-slot="check"]')).toBeNull();
      expect(screen.queryByRole('checkbox')).toBeNull();
      expect(await axe(document.body)).toHaveNoViolations();
    });

    it('Tab from an option moves on past the MultiSelect without toggling it', async () => {
      const onChange = jest.fn();
      const { container } = renderUI(
        <>
          <Multiple allowSearch={false} onChange={onChange} />
          <button>After</button>
        </>,
      );
      await openWithKeyboard();
      await waitFor(() => expect(option('Peru')).toHaveFocus());
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(option('Chile')).toHaveFocus());
      await userEvent.tab();
      expect(screen.queryByRole('listbox')).toBeNull();
      expect(after()).toHaveFocus();
      expect(onChange).not.toHaveBeenCalled();
      expect(await axe(container)).toHaveNoViolations();
    });

    it('shows a closable tag per value, whose close buttons are not tab stops', async () => {
      const onChange = jest.fn();
      const { container } = renderUI(
        <>
          <Multiple initial={['pe', 'cl']} onChange={onChange} />
          <button>After</button>
        </>,
      );
      const remove = screen.getByRole('button', { name: 'Remove Chile' });
      expect(remove).toHaveAttribute('tabindex', '-1');
      // The box keeps the field's edit shortcuts for reaching the tags.
      expect(combobox()).toHaveAccessibleDescription(
        /Backspace removes the last value, Delete the first\. ArrowLeft moves to the values\./,
      );
      expect(combobox()).toHaveAttribute(
        'aria-keyshortcuts',
        'Backspace Delete ArrowLeft',
      );
      await userEvent.tab();
      expect(combobox()).toHaveFocus();
      await userEvent.tab();
      expect(after()).toHaveFocus();

      await userEvent.click(remove);
      expect(onChange).toHaveBeenCalledWith(
        ['pe'],
        [{ value: 'pe', label: 'Peru' }],
      );
      expect(screen.queryByRole('listbox')).toBeNull();
      expect(await axe(container)).toHaveNoViolations();
    });

    it('tags by keyboard: ArrowLeft reaches them, arrows move between them, Backspace and Delete remove and hand focus to a neighbour', async () => {
      const onChange = jest.fn();
      const { container } = renderUI(
        <Multiple
          initial={['pe', 'cl', 'ar']}
          allowSearch={false}
          onChange={onChange}
        />,
      );
      combobox().focus();
      await userEvent.keyboard('{ArrowLeft}');
      expect(
        screen.getByRole('button', { name: 'Remove Argentina' }),
      ).toHaveFocus();
      await userEvent.keyboard('{ArrowLeft}');
      expect(
        screen.getByRole('button', { name: 'Remove Chile' }),
      ).toHaveFocus();
      await userEvent.keyboard('{ArrowRight}');
      expect(
        screen.getByRole('button', { name: 'Remove Argentina' }),
      ).toHaveFocus();
      // Past the last tag, focus returns to the field itself.
      await userEvent.keyboard('{ArrowRight}');
      expect(combobox()).toHaveFocus();
      expect(screen.queryByRole('listbox')).toBeNull();

      await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
      expect(
        screen.getByRole('button', { name: 'Remove Chile' }),
      ).toHaveFocus();
      await userEvent.keyboard('{Backspace}');
      expect(onChange).toHaveBeenLastCalledWith(
        ['pe', 'ar'],
        [
          { value: 'pe', label: 'Peru' },
          { value: 'ar', label: 'Argentina' },
        ],
      );
      expect(announcement()).toBe('Removed Chile');
      expect(screen.getByRole('button', { name: 'Remove Peru' })).toHaveFocus();
      await userEvent.keyboard('{Delete}');
      expect(onChange).toHaveBeenLastCalledWith(
        ['ar'],
        [{ value: 'ar', label: 'Argentina' }],
      );
      expect(
        screen.getByRole('button', { name: 'Remove Argentina' }),
      ).toHaveFocus();
      expect(await axe(container)).toHaveNoViolations();
    });

    it('without a search field, opens on the first selected option', async () => {
      renderUI(<Multiple initial={['ar', 'cl']} allowSearch={false} />);
      await openWithKeyboard();
      await waitFor(() => expect(option('Chile')).toHaveFocus());
      expect(option('Chile')).toHaveAttribute('aria-selected', 'true');
      expect(option('Argentina')).toHaveAttribute('aria-selected', 'true');
    });

    it('Backspace in the empty search field removes only the last value', async () => {
      const onChange = jest.fn();
      renderUI(
        <Multiple
          initial={['pe', 'cl', 'ar']}
          allowSearch
          allowClear
          onChange={onChange}
        />,
      );
      await openWithKeyboard();
      await waitFor(() => expect(searchField()).toHaveFocus());
      await userEvent.keyboard('{Backspace}');
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(
        ['pe', 'cl'],
        [
          { value: 'pe', label: 'Peru' },
          { value: 'cl', label: 'Chile' },
        ],
      );
      expect(announcement()).toBe('Removed Argentina');
      await userEvent.keyboard('x{Backspace}');
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(searchField()).toHaveValue('');
    });
  });

  describe('client search', () => {
    it('opening focuses the field in the trigger; typing filters case-insensitively, and the count is announced', async () => {
      renderUI(<Single allowSearch />);
      await openWithKeyboard();
      await waitFor(() => expect(searchField()).toHaveFocus());
      // The field is the combobox now, grouped by the box that named it.
      expect(triggerBox()).toContainElement(searchField());
      expect(screen.queryByRole('combobox', { name: 'Country' })).toBeNull();
      expect(searchField()).toHaveAttribute('aria-expanded', 'true');
      expect(searchField()).toHaveAttribute('aria-controls', listbox().id);
      expect(searchField()).toHaveAttribute('aria-autocomplete', 'list');
      await userEvent.keyboard('R');
      expect(optionNames()).toEqual(['Peru', 'Argentina']);
      expect(announcement()).toBe('2 options');
      expect(screen.getByText('2 options')).toHaveAttribute('role', 'status');
      expect(await axe(document.body)).toHaveNoViolations();
    });

    it('the field takes the selected label as its placeholder', async () => {
      renderUI(<Single initial="cl" allowSearch />);
      await openWithKeyboard();
      expect(searchField()).toHaveAttribute('placeholder', 'Chile');
      // The value's place is the field's while searching a single Select.
      expect(
        triggerBox().querySelector('[data-slot="value"]')?.textContent,
      ).toBe('');
    });

    it('Tab moves to the selected option and Shift+Tab back to the field, the menu open; Shift+Tab from the field leaves the Select', async () => {
      renderUI(
        <>
          <button>Before</button>
          <Single initial="ar" allowSearch />
        </>,
      );
      await openWithKeyboard();
      await waitFor(() => expect(searchField()).toHaveFocus());
      await userEvent.tab();
      await waitFor(() => expect(option('Argentina')).toHaveFocus());
      await userEvent.tab({ shift: true });
      await waitFor(() => expect(searchField()).toHaveFocus());
      expect(listbox()).toBeVisible();
      // The box is only a group while the field shows: Shift+Tab leaves,
      // closing the menu.
      await userEvent.tab({ shift: true });
      expect(screen.getByRole('button', { name: 'Before' })).toHaveFocus();
      expect(screen.queryByRole('listbox')).toBeNull();
      await userEvent.tab();
      expect(combobox()).toHaveFocus();
      expect(combobox()).toHaveAttribute('aria-expanded', 'false');
    });

    it('ArrowDown moves to the first option; ArrowUp on it and a typed character go back to the field', async () => {
      renderUI(<Single allowSearch />);
      await openWithKeyboard();
      await waitFor(() => expect(searchField()).toHaveFocus());
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(option('Peru')).toHaveFocus());
      await userEvent.keyboard('{ArrowUp}');
      await waitFor(() => expect(searchField()).toHaveFocus());
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(option('Peru')).toHaveFocus());
      await userEvent.keyboard('ch');
      expect(searchField()).toHaveFocus();
      expect(searchField()).toHaveValue('ch');
      expect(optionNames()).toEqual(['Chile']);
    });

    it('Enter in the field chooses the first match and returns focus to the trigger', async () => {
      const onChange = jest.fn();
      const { container } = renderUI(
        <Single allowSearch onChange={onChange} />,
      );
      await openWithKeyboard();
      await waitFor(() => expect(searchField()).toHaveFocus());
      await userEvent.keyboard('chi');
      expect(optionNames()).toEqual(['Chile']);
      await userEvent.keyboard('{Enter}');
      expect(onChange).toHaveBeenCalledWith('cl', {
        value: 'cl',
        label: 'Chile',
      });
      expect(screen.queryByRole('listbox')).toBeNull();
      expect(combobox()).toHaveFocus();
      expect(shownValue()).toBe('Chile');
      expect(await axe(container)).toHaveNoViolations();
    });

    it('a character typed on the closed trigger opens it and types into the field', async () => {
      renderUI(<Single allowSearch />);
      combobox().focus();
      await userEvent.keyboard('a');
      await waitFor(() => expect(searchField()).toHaveFocus());
      expect(searchField()).toHaveValue('a');
      await userEvent.keyboard('r');
      expect(searchField()).toHaveValue('ar');
      expect(optionNames()).toEqual(['Argentina']);
    });

    it('no matches: said in the menu, not as an option, and announced', async () => {
      renderUI(<Single allowSearch />);
      await openWithKeyboard();
      await waitFor(() => expect(searchField()).toHaveFocus());
      await userEvent.keyboard('zz');
      expect(screen.queryAllByRole('option')).toHaveLength(0);
      expect(within(listbox()).getByText('No matches')).toBeVisible();
      expect(
        screen
          .getAllByText('No matches')
          .find((node) => node.closest('[role="status"]')),
      ).toBeDefined();
      expect(await axe(document.body)).toHaveNoViolations();
    });

    it('controlled: typing shows at once, onSearch gets it after a pause, and closing clears it', async () => {
      const onSearch = jest.fn();
      const Controlled = () => {
        const [search, setSearch] = useState('');
        const [value, setValue] = useState('');
        return (
          <Select
            label="Country"
            value={value}
            onChange={setValue}
            allowSearch
            search={search}
            onSearch={(text) => {
              setSearch(text);
              onSearch(text);
            }}
          >
            {countryOptions}
          </Select>
        );
      };
      renderUI(<Controlled />);
      await openWithKeyboard();
      await waitFor(() => expect(searchField()).toHaveFocus());
      await userEvent.keyboard('pe');
      expect(searchField()).toHaveValue('pe');
      expect(onSearch).not.toHaveBeenCalled();
      await waitFor(() => expect(onSearch).toHaveBeenLastCalledWith('pe'));
      await userEvent.keyboard('{Escape}');
      expect(onSearch).toHaveBeenLastCalledWith('');
      await openWithKeyboard();
      await waitFor(() => expect(searchField()).toHaveValue(''));
    });
  });

  describe('server search', () => {
    const ServerSelect = ({
      onSearch,
      results,
      loading = false,
      initial = [],
    }: {
      onSearch: (text: string) => void;
      results: typeof countries;
      loading?: boolean;
      initial?: string[];
    }) => {
      const [values, setValues] = useState(initial);
      return (
        <MultiSelect
          label="Country"
          value={values}
          onChange={setValues}
          allowSearch
          onSearch={onSearch}
          loading={loading}
        >
          {results.map(({ value, label }) => (
            <SelectOption key={value} value={value} label={label} />
          ))}
        </MultiSelect>
      );
    };

    it('calls onSearch once after a pause in typing, and never filters', async () => {
      const onSearch = jest.fn();
      renderUI(<ServerSelect onSearch={onSearch} results={countries} />);
      await openWithKeyboard();
      await waitFor(() => expect(searchField()).toHaveFocus());
      await userEvent.keyboard('per');
      expect(onSearch).not.toHaveBeenCalled();
      expect(optionNames()).toEqual(['Peru', 'Chile', 'Argentina']);
      await waitFor(() => expect(onSearch).toHaveBeenCalledWith('per'));
      expect(onSearch).toHaveBeenCalledTimes(1);
    });

    it('a search that clears calls onSearch("") at once', async () => {
      const onSearch = jest.fn();
      renderUI(<ServerSelect onSearch={onSearch} results={countries} />);
      await openWithKeyboard();
      await waitFor(() => expect(searchField()).toHaveFocus());
      await userEvent.keyboard('p');
      await waitFor(() => expect(onSearch).toHaveBeenCalledWith('p'));
      await userEvent.keyboard('{Escape}');
      expect(onSearch).toHaveBeenLastCalledWith('');
    });

    it('while loading: the spinner, and a loading row above the old results; it stays usable', async () => {
      const { container } = renderUI(
        <ServerSelect onSearch={jest.fn()} results={countries} loading />,
      );
      expect(combobox()).not.toHaveAttribute('aria-disabled');
      expect(combobox()).toHaveAttribute('aria-busy', 'true');
      expect(combobox()).toHaveAttribute('tabindex', '0');
      expect(container.querySelector('.lucide-loader-circle')).not.toBeNull();
      await openWithKeyboard();
      expect(searchField()).toHaveFocus();
      expect(listbox()).toHaveAttribute('aria-busy', 'true');
      expect(within(listbox()).getByText('Loading…')).toBeVisible();
      expect(announcement()).toBe('Loading…');
      expect(optionNames()).toEqual(['Peru', 'Chile', 'Argentina']);
      expect(await axe(document.body)).toHaveNoViolations();
    });

    it('keeps selected values missing from new results, with their labels', async () => {
      const onSearch = jest.fn();
      const { rerender } = renderUI(
        <ServerSelect
          onSearch={onSearch}
          results={countries}
          initial={['pe']}
        />,
      );
      const brazil = [{ value: 'br', label: 'Brazil' }];
      rerender(
        <ServerSelect onSearch={onSearch} results={brazil} initial={['pe']} />,
      );
      expect(combobox()).toHaveTextContent('Peru');
      await openWithKeyboard();
      expect(optionNames()).toEqual(['Brazil']);
      // The kept value's tag stays in the box, beside the search field.
      expect(triggerBox()).toHaveTextContent('Peru');
      await userEvent.click(option('Brazil'));
      expect(triggerBox()).toHaveTextContent('Peru');
      expect(triggerBox()).toHaveTextContent('Brazil');
      expect(option('Brazil')).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('allowClear', () => {
    it('Delete clears, said in the description; the clear button, out of the tab order, clears too', async () => {
      const onChange = jest.fn();
      const { container } = renderUI(
        <Single initial="pe" allowClear onChange={onChange} />,
      );
      expect(combobox()).toHaveAccessibleDescription(
        'Press Backspace or Delete to clear.',
      );
      expect(combobox()).toHaveAttribute(
        'aria-keyshortcuts',
        'Backspace Delete',
      );
      expect(await axe(container)).toHaveNoViolations();

      combobox().focus();
      await userEvent.keyboard('{Delete}');
      expect(onChange).toHaveBeenCalledWith('', undefined);
      expect(announcement()).toBe('Selection cleared');
      expect(combobox()).toHaveFocus();
      expect(combobox()).not.toHaveAttribute('aria-keyshortcuts');
      expect(
        screen.queryByRole('button', { name: 'Clear selection' }),
      ).toBeNull();
    });

    it('the clear button clears every value in multiple mode, without opening', async () => {
      const onChange = jest.fn();
      renderUI(
        <Multiple initial={['pe', 'cl']} allowClear onChange={onChange} />,
      );
      const clear = screen.getByRole('button', { name: 'Clear selection' });
      expect(clear).toHaveAttribute('tabindex', '-1');
      await userEvent.click(clear);
      expect(onChange).toHaveBeenCalledWith([], []);
      expect(announcement()).toBe('Selection cleared');
      expect(screen.queryByRole('listbox')).toBeNull();
    });

    it('allowClear={false}: no clear button, no clear hint, and Delete keeps the value', async () => {
      const onChange = jest.fn();
      const { container } = renderUI(
        <Single initial="pe" allowClear={false} onChange={onChange} />,
      );
      expect(
        screen.queryByRole('button', { name: 'Clear selection' }),
      ).toBeNull();
      expect(combobox()).not.toHaveAttribute('aria-keyshortcuts');
      combobox().focus();
      await userEvent.keyboard('{Delete}{Backspace}');
      expect(onChange).not.toHaveBeenCalled();
      expect(shownValue()).toBe('Peru');
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe('empty', () => {
    it('says so in the menu, not as an option, and announces it', async () => {
      renderUI(<Single>{null}</Single>);
      await openWithKeyboard();
      expect(screen.queryAllByRole('option')).toHaveLength(0);
      expect(within(listbox()).getByText('No options')).toBeVisible();
      expect(announcement()).toBe('No options');
      expect(
        screen
          .getAllByText('No options')
          .some((node) => node.closest('[role="status"]')),
      ).toBe(true);
      expect(await axe(document.body)).toHaveNoViolations();
    });
  });

  describe('groups', () => {
    it('a group names its options in the listbox, and search keeps only groups with a match', async () => {
      renderUI(
        <Single>
          <SelectGroup label="South America">
            <SelectOption value="pe" label="Peru" />
            <SelectOption value="cl" label="Chile" />
          </SelectGroup>
          <SelectGroup label="North America">
            <SelectOption value="mx" label="Mexico" />
          </SelectGroup>
        </Single>,
      );
      await openWithKeyboard();
      const south = within(listbox()).getByRole('group', {
        name: 'South America',
      });
      expect(
        within(south)
          .getAllByRole('option')
          .map((node) => node.textContent),
      ).toEqual(['Peru', 'Chile']);
      expect(
        within(listbox()).getByRole('group', { name: 'North America' }),
      ).toBeInTheDocument();
      expect(await axe(document.body)).toHaveNoViolations();

      await userEvent.keyboard('mex');
      expect(optionNames()).toEqual(['Mexico']);
      expect(
        within(listbox()).queryByRole('group', { name: 'South America' }),
      ).toBeNull();
      expect(
        within(listbox()).getByRole('group', { name: 'North America' }),
      ).toBeInTheDocument();
    });
  });

  describe('when disabled', () => {
    it("disabledWithReason: keeps its tab stop so the reason is reachable, can't open, and its tags can't close", async () => {
      const onChange = jest.fn();
      renderUI(
        <>
          <Multiple
            initial={['pe']}
            disabledWithReason="Locked by your admin"
            onChange={onChange}
          />
          <button>After</button>
        </>,
      );
      const trigger = combobox();
      expect(trigger).toHaveAttribute('aria-disabled', 'true');
      // With a reason to hear, the field stays in the tab order.
      expect(trigger).toHaveAttribute('tabindex', '0');
      await userEvent.tab();
      expect(trigger).toHaveFocus();
      // Focusing it with the keyboard shows the reason, as on Button.
      expect(await tooltipText()).toBe('Locked by your admin');
      await userEvent.keyboard('{Enter}{ArrowDown}');
      await settle();
      expect(screen.queryByRole('listbox')).toBeNull();
      await userEvent.tab();
      expect(after()).toHaveFocus();
      expect(trigger).toHaveAccessibleDescription('Locked by your admin');
      // Hovered first: after a click, the same element gets no new hover.
      await userEvent.hover(trigger);
      expect(await tooltipText()).toBe('Locked by your admin');
      expect(await axe(document.body)).toHaveNoViolations();

      await userEvent.click(trigger);
      trigger.focus();
      await userEvent.keyboard('{Enter}{ArrowDown}');
      await settle();
      expect(screen.queryByRole('listbox')).toBeNull();
      await userEvent.click(
        screen.getByRole('button', { name: 'Remove Peru' }),
      );
      expect(onChange).not.toHaveBeenCalled();
    });

    it('disabled without a reason leaves the tab order and cannot open', async () => {
      const onChange = jest.fn();
      const { container } = renderUI(
        <>
          <Select label="Country" value="pe" onChange={onChange} disabled>
            {countryOptions}
          </Select>
          <button>After</button>
        </>,
      );
      const trigger = combobox();
      expect(trigger).toHaveAttribute('aria-disabled', 'true');
      expect(trigger).toHaveAttribute('tabindex', '-1');
      await userEvent.tab();
      expect(after()).toHaveFocus();
      await userEvent.click(trigger);
      await settle();
      expect(screen.queryByRole('listbox')).toBeNull();
      expect(onChange).not.toHaveBeenCalled();
      expect(await axe(container)).toHaveNoViolations();
    });

    it('readOnlyWithReason: aria-readonly, keeps its tab stop, the reason describes it, and it cannot open or clear', async () => {
      const onChange = jest.fn();
      const { container } = renderUI(
        <>
          <Select
            label="Country"
            value="pe"
            onChange={onChange}
            readOnlyWithReason="Set by the venue"
          >
            {countryOptions}
          </Select>
          <button>After</button>
        </>,
      );
      const trigger = combobox();
      expect(trigger).toHaveAttribute('aria-readonly', 'true');
      expect(trigger).not.toHaveAttribute('aria-disabled');
      expect(trigger).toHaveAttribute('tabindex', '0');
      expect(trigger).toHaveAccessibleDescription(/Set by the venue/);
      await userEvent.tab();
      expect(trigger).toHaveFocus();
      // The reason is also the tooltip for a pointer user.
      await userEvent.hover(trigger);
      expect(await tooltipText()).toContain('Set by the venue');
      await userEvent.keyboard('{Enter}{ArrowDown}{Delete}');
      await settle();
      expect(screen.queryByRole('listbox')).toBeNull();
      expect(onChange).not.toHaveBeenCalled();
      await userEvent.tab();
      expect(after()).toHaveFocus();
      expect(await axe(container)).toHaveNoViolations();
    });

    it('readOnly without a reason still takes focus, so its value can be read', async () => {
      const { container } = renderUI(
        <Select label="Country" value="cl" onChange={jest.fn()} readOnly>
          {countryOptions}
        </Select>,
      );
      const trigger = combobox();
      expect(trigger).toHaveAttribute('aria-readonly', 'true');
      expect(trigger).toHaveAttribute('tabindex', '0');
      expect(shownValue()).toBe('Chile');
      await userEvent.tab();
      expect(trigger).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      await settle();
      expect(screen.queryByRole('listbox')).toBeNull();
      expect(await axe(container)).toHaveNoViolations();
    });

    it('loadingWithReason with disableWhileLoading: busy and disabled, but its tab stop and reason stay', async () => {
      const onChange = jest.fn();
      const { container } = renderUI(
        <Select
          label="Country"
          value="pe"
          onChange={onChange}
          loadingWithReason="Loading rates"
          disableWhileLoading
        >
          {countryOptions}
        </Select>,
      );
      const trigger = combobox();
      expect(trigger).toHaveAttribute('aria-busy', 'true');
      expect(trigger).toHaveAttribute('aria-disabled', 'true');
      expect(trigger).toHaveAttribute('tabindex', '0');
      expect(trigger).toHaveAccessibleDescription(/Loading rates/);
      await userEvent.tab();
      expect(trigger).toHaveFocus();
      await userEvent.keyboard('{Enter}{ArrowDown}');
      await settle();
      expect(screen.queryByRole('listbox')).toBeNull();
      expect(onChange).not.toHaveBeenCalled();
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe('with Controller', () => {
    const CountryForm = ({ onSubmit }: { onSubmit: () => void }) => {
      const { control, handleSubmit } = useForm({
        defaultValues: { country: '' },
      });
      return (
        <form noValidate onSubmit={handleSubmit(onSubmit)}>
          <Controller
            name="country"
            control={control}
            rules={{ required: 'Choose a country' }}
          >
            {({ field }) => (
              <Select label="Country" {...field}>
                {countryOptions}
              </Select>
            )}
          </Controller>
          <button type="submit">Save</button>
        </form>
      );
    };

    it('{...field} is all it needs: required, the error, focus on submit, the value', async () => {
      const onSubmit = jest.fn();
      const { container } = renderUI(<CountryForm onSubmit={onSubmit} />);
      expect(screen.getByText('*')).toBeInTheDocument();
      expect(combobox()).toHaveAttribute('aria-required', 'true');

      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(onSubmit).not.toHaveBeenCalled();
      expect(combobox()).toHaveFocus();
      expect(combobox()).toHaveAttribute('aria-invalid', 'true');
      expect(combobox()).toHaveAccessibleDescription('Choose a country');
      expect(await axe(container)).toHaveNoViolations();

      await userEvent.keyboard('{Enter}');
      await userEvent.click(
        await screen.findByRole('option', { name: 'Chile' }),
      );
      expect(combobox()).not.toHaveAttribute('aria-invalid');
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(onSubmit).toHaveBeenCalledWith(
        { country: 'cl' },
        expect.anything(),
      );
    });
  });
});
