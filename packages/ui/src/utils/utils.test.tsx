import { render, renderHook, screen } from '@testing-library/react';
import React, { createRef } from 'react';

import { hasContent, joinIds, mergeRefs } from './helpers';
import { createLook } from './look';
import { useIconAddon } from './useIconAddon';
import { useIsDisabled } from './useIsDisabled';

describe('useIsDisabled', () => {
  // The full return: `isDisabled` (inactive at all), `isReadOnly` (only
  // read-only, so the value can still be focused and copied), `isLoading`,
  // `isFocusable` (keeps its tab stop) and the reason to show.
  const cases: [
    Parameters<typeof useIsDisabled>[0],
    ReturnType<typeof useIsDisabled>,
  ][] = [
    [
      {},
      {
        isLoading: false,
        isDisabled: false,
        isReadOnly: false,
        isFocusable: true,
        stateTooltip: '',
      },
    ],
    [
      { disabled: false, readOnly: false, loading: false },
      {
        isLoading: false,
        isDisabled: false,
        isReadOnly: false,
        isFocusable: true,
        stateTooltip: '',
      },
    ],
    // Silently disabled leaves the tab order, as a native control would.
    [
      { disabled: true },
      {
        isLoading: false,
        isDisabled: true,
        isReadOnly: false,
        isFocusable: false,
        stateTooltip: '',
      },
    ],
    // With a reason, the tab stop stays so the reason is reachable.
    [
      { disabledWithReason: 'No access' },
      {
        isLoading: false,
        isDisabled: true,
        isReadOnly: false,
        isFocusable: true,
        stateTooltip: 'No access',
      },
    ],
    [
      { readOnly: true },
      {
        isLoading: false,
        isDisabled: true,
        isReadOnly: true,
        isFocusable: false,
        stateTooltip: '',
      },
    ],
    [
      { readOnlyWithReason: 'Locked' },
      {
        isLoading: false,
        isDisabled: true,
        isReadOnly: true,
        isFocusable: true,
        stateTooltip: 'Locked',
      },
    ],
    [
      { loading: true },
      {
        isLoading: true,
        isDisabled: true,
        isReadOnly: false,
        isFocusable: false,
        stateTooltip: '',
      },
    ],
    [
      { loadingWithReason: 'Saving' },
      {
        isLoading: true,
        isDisabled: true,
        isReadOnly: false,
        isFocusable: true,
        stateTooltip: 'Saving',
      },
    ],
    // The reason shows while loading, whether or not loading disables.
    [
      { loadingWithReason: 'Saving', disableWhileLoading: false },
      {
        isLoading: true,
        isDisabled: false,
        isReadOnly: false,
        isFocusable: true,
        stateTooltip: 'Saving',
      },
    ],
    [
      { loading: true, disableWhileLoading: false },
      {
        isLoading: true,
        isDisabled: false,
        isReadOnly: false,
        isFocusable: true,
        stateTooltip: '',
      },
    ],
    // `disableWhileLoading` alone changes nothing while nothing loads.
    [
      { disableWhileLoading: false },
      {
        isLoading: false,
        isDisabled: false,
        isReadOnly: false,
        isFocusable: true,
        stateTooltip: '',
      },
    ],
    // Nor does it re-enable a control disabled for another reason.
    [
      { disabled: true, loading: true, disableWhileLoading: false },
      {
        isLoading: true,
        isDisabled: true,
        isReadOnly: false,
        isFocusable: false,
        stateTooltip: '',
      },
    ],
    // Read-only stops being "only read-only" once loading also disables,
    // or the control is disabled outright.
    [
      { readOnly: true, loading: true },
      {
        isLoading: true,
        isDisabled: true,
        isReadOnly: false,
        isFocusable: false,
        stateTooltip: '',
      },
    ],
    [
      { readOnly: true, loading: true, disableWhileLoading: false },
      {
        isLoading: true,
        isDisabled: true,
        isReadOnly: true,
        isFocusable: false,
        stateTooltip: '',
      },
    ],
    [
      { disabled: true, readOnly: true },
      {
        isLoading: false,
        isDisabled: true,
        isReadOnly: false,
        isFocusable: false,
        stateTooltip: '',
      },
    ],
    // A reason from any state keeps the tab stop, even when another
    // state did the disabling silently.
    [
      { disabled: true, readOnlyWithReason: 'Locked' },
      {
        isLoading: false,
        isDisabled: true,
        isReadOnly: false,
        isFocusable: true,
        stateTooltip: 'Locked',
      },
    ],
    // Reason precedence: disabled, then read-only, then loading.
    [
      {
        disabledWithReason: 'No access',
        readOnlyWithReason: 'Locked',
        loadingWithReason: 'Saving',
      },
      {
        isLoading: true,
        isDisabled: true,
        isReadOnly: false,
        isFocusable: true,
        stateTooltip: 'No access',
      },
    ],
    [
      { readOnlyWithReason: 'Locked', loadingWithReason: 'Saving' },
      {
        isLoading: true,
        isDisabled: true,
        isReadOnly: false,
        isFocusable: true,
        stateTooltip: 'Locked',
      },
    ],
    [
      {
        readOnlyWithReason: 'Locked',
        loadingWithReason: 'Saving',
        disableWhileLoading: false,
      },
      {
        isLoading: true,
        isDisabled: true,
        isReadOnly: true,
        isFocusable: true,
        stateTooltip: 'Locked',
      },
    ],
    // An empty reason sets no state at all.
    [
      { disabledWithReason: '' },
      {
        isLoading: false,
        isDisabled: false,
        isReadOnly: false,
        isFocusable: true,
        stateTooltip: '',
      },
    ],
    [
      { loadingWithReason: '' },
      {
        isLoading: false,
        isDisabled: false,
        isReadOnly: false,
        isFocusable: true,
        stateTooltip: '',
      },
    ],
  ];

  it.each(cases)('%o → %o', (props, expected) => {
    const { result } = renderHook(() => useIsDisabled(props));
    expect(result.current).toEqual(expected);
  });

  it('keeps the tab stop only for an enabled control or one with a reason', () => {
    const focusable = (props: Parameters<typeof useIsDisabled>[0]) =>
      renderHook(() => useIsDisabled(props)).result.current.isFocusable;
    expect(focusable({ disabled: true })).toBe(false);
    expect(focusable({ readOnly: true })).toBe(false);
    expect(focusable({ loading: true })).toBe(false);
    expect(focusable({ disabledWithReason: 'No access' })).toBe(true);
    expect(focusable({ readOnlyWithReason: 'Locked' })).toBe(true);
    expect(focusable({ loadingWithReason: 'Saving' })).toBe(true);
    expect(focusable({ loading: true, disableWhileLoading: false })).toBe(
      true,
    );
  });

  it('reports read-only only when read-only is the sole disabling state', () => {
    const readOnly = (props: Parameters<typeof useIsDisabled>[0]) =>
      renderHook(() => useIsDisabled(props)).result.current.isReadOnly;
    expect(readOnly({ readOnly: true })).toBe(true);
    expect(readOnly({ readOnly: true, disabled: true })).toBe(false);
    expect(readOnly({ readOnly: true, loading: true })).toBe(false);
    expect(readOnly({ disabled: true })).toBe(false);
    expect(readOnly({})).toBe(false);
  });

  it('shows the first reason: disabled, then read-only, then loading', () => {
    const tooltip = (props: Parameters<typeof useIsDisabled>[0]) =>
      renderHook(() => useIsDisabled(props)).result.current.stateTooltip;
    expect(tooltip({ loadingWithReason: 'Saving' })).toBe('Saving');
    expect(
      tooltip({
        readOnlyWithReason: 'Locked',
        loadingWithReason: 'Saving',
      }),
    ).toBe('Locked');
    expect(
      tooltip({
        disabledWithReason: 'No access',
        readOnlyWithReason: 'Locked',
      }),
    ).toBe('No access');
    expect(tooltip({ disabled: true, loading: true })).toBe('');
  });
});

const Addon = (props: Parameters<typeof useIconAddon>[0]) => {
  const { leftSlot, rightSlot } = useIconAddon(props);
  return (
    <div>
      <span data-testid="left">{leftSlot}</span>
      <span data-testid="right">{rightSlot}</span>
    </div>
  );
};

describe('useIconAddon', () => {
  it('places icons and add-ons', () => {
    render(<Addon leftIcon={<i>L</i>} rightAddOn={<i>R</i>} />);
    expect(screen.getByTestId('left')).toHaveTextContent('L');
    expect(screen.getByTestId('right')).toHaveTextContent('R');
  });

  it('shows the spinner in the left icon, or the right one when only it exists', () => {
    const { rerender } = render(<Addon loading leftIcon={<i>L</i>} />);
    expect(screen.getByTestId('left').querySelector('svg')).toBeInTheDocument();
    expect(screen.getByTestId('left')).not.toHaveTextContent('L');
    rerender(<Addon loading rightIcon={<i>R</i>} />);
    expect(
      screen.getByTestId('right').querySelector('svg'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('left')).toBeEmptyDOMElement();
  });

  it('renders nothing without icons or add-ons', () => {
    const { result } = renderHook(() => useIconAddon({}));
    expect(result.current).toEqual({ leftSlot: null, rightSlot: null });
  });

  it('hides icons from assistive tech: the control is named by its text', () => {
    render(<Addon leftIcon={<i>L</i>} rightIcon={<i>R</i>} />);
    for (const side of ['left', 'right']) {
      const icon = screen.getByTestId(side).firstElementChild;
      expect(icon).toHaveAttribute('data-slot', 'icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    }
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('hides the loading spinner too, replacing only the left icon when both exist', () => {
    render(<Addon loading leftIcon={<i>L</i>} rightIcon={<i>R</i>} />);
    const spinner = screen.getByTestId('left').querySelector('svg');
    expect(spinner).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByTestId('left')).not.toHaveTextContent('L');
    expect(screen.getByTestId('right')).toHaveTextContent('R');
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('shows the spinner on the left while loading with no icons at all', () => {
    render(<Addon loading />);
    expect(screen.getByTestId('left').querySelector('svg')).toBeInTheDocument();
    expect(screen.getByTestId('right')).toBeEmptyDOMElement();
  });

  it('shows an add-on only where that side has no icon, wrapping text in a span', () => {
    render(
      <Addon leftIcon={<i>L</i>} leftAddOn="https://" rightAddOn=".com" />,
    );
    expect(screen.getByTestId('left')).toHaveTextContent('L');
    expect(screen.getByTestId('left')).not.toHaveTextContent('https://');
    const addOn = screen.getByTestId('right').firstElementChild;
    expect(addOn?.tagName).toBe('SPAN');
    expect(addOn).toHaveAttribute('data-slot', 'add-on');
    expect(addOn).toHaveTextContent('.com');
    // Unlike an icon, an add-on is content, not decoration.
    expect(addOn).not.toHaveAttribute('aria-hidden');
  });

  it('centers each icon in a box of the fixed height, still hidden', () => {
    render(<Addon leftIcon={<i>L</i>} fixedHeight="2rem" />);
    const box = screen.getByTestId('left').firstElementChild;
    expect(box).toHaveAttribute('data-slot', 'icon-box');
    expect(box).toHaveStyle({ height: '2rem' });
    expect(box?.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });
});

// The parts of a vanilla-extract recipe that `createLook` reads.
const fakeRecipe = <Variants extends Record<string, Record<string, string>>>(
  variants: Variants,
) =>
  Object.assign(() => '', {
    variants: () => Object.keys(variants),
    classNames: { base: 'base', variants },
  });

const cardLook = createLook(
  fakeRecipe({
    variant: { default: 'v-default', base: 'v-base' },
    size: { sm: 's-sm' },
    fill: { outline: 'f-outline', filled: 'f-filled' },
    elevated: { true: 'e-true', false: 'e-false' },
  }),
);

describe('createLook', () => {
  it('reads tokens in any order', () => {
    expect(cardLook('elevated outline')).toEqual({
      fill: 'outline',
      elevated: true,
    });
    expect(cardLook('outline elevated')).toEqual({
      fill: 'outline',
      elevated: true,
    });
  });

  it('sets a true/false variant to false with !', () => {
    expect(cardLook('filled !elevated')).toEqual({
      fill: 'filled',
      elevated: false,
    });
  });

  it("leaves out what the look doesn't name, so the recipe's defaults apply", () => {
    expect(cardLook()).toEqual({});
    expect(cardLook('  filled   ')).toEqual({ fill: 'filled' });
  });

  it('ignores unknown tokens, and the color and size values', () => {
    expect(cardLook('filed base sm !outline')).toEqual({});
  });

  it('takes the last of two tokens for one variant', () => {
    expect(cardLook('outline filled')).toEqual({ fill: 'filled' });
  });

  it('throws when two variants share a token', () => {
    expect(() =>
      createLook(
        fakeRecipe({
          fill: { outline: 'f-outline' },
          border: { outline: 'b-outline' },
        }),
      ),
    ).toThrow('Look token "outline" belongs to two variants');
  });
});

describe('mergeRefs', () => {
  it('tolerates missing refs, as an optional forwarded ref would give', () => {
    const objectRef = createRef<HTMLDivElement>();
    const { unmount } = render(
      <div data-testid="node" ref={mergeRefs(undefined, objectRef)} />,
    );
    expect(objectRef.current).toBe(screen.getByTestId('node'));
    unmount();
    expect(objectRef.current).toBeNull();
  });

  it('sets object and callback refs, and clears them on detach', () => {
    const objectRef = createRef<HTMLDivElement>();
    const callbackRef = jest.fn();
    const { unmount } = render(
      <div data-testid="node" ref={mergeRefs(objectRef, callbackRef)} />,
    );
    const node = screen.getByTestId('node');
    expect(objectRef.current).toBe(node);
    expect(callbackRef).toHaveBeenLastCalledWith(node);
    unmount();
    expect(objectRef.current).toBeNull();
    expect(callbackRef).toHaveBeenLastCalledWith(null);
  });

  it("runs a callback ref's own cleanup instead of calling it with null", () => {
    const cleanup = jest.fn();
    const callbackRef = jest.fn(() => cleanup);
    const { unmount } = render(<div ref={mergeRefs(callbackRef)} />);
    unmount();
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(callbackRef).toHaveBeenCalledTimes(1);
  });
});

describe('hasContent and joinIds', () => {
  it.each([
    [undefined, false],
    [null, false],
    [false, false],
    ['', false],
    [0, true],
    ['Saved', true],
  ])('hasContent(%p) is %p', (node, shown) => {
    expect(hasContent(node)).toBe(shown);
  });

  it('has content for an element, an array and other drawn nodes', () => {
    expect(hasContent(<span>Saved</span>)).toBe(true);
    expect(hasContent(['Saved'])).toBe(true);
  });

  it('joins the ids that are set, or gives undefined', () => {
    expect(joinIds('a', undefined, false, 'b')).toBe('a b');
    expect(joinIds(undefined, false)).toBeUndefined();
    expect(joinIds()).toBeUndefined();
  });
});
