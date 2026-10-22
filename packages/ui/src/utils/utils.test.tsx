import { render, renderHook, screen } from '@testing-library/react';
import React from 'react';

import { createLook } from './look';
import { useIconAddon } from './useIconAddon';
import { useIsDisabled } from './useIsDisabled';

describe('useIsDisabled', () => {
  it.each([
    [{}, false, false, ''],
    [{ disabled: true }, true, false, ''],
    [{ disabledWithReason: 'No access' }, true, false, 'No access'],
    [{ readOnlyWithReason: 'Locked' }, true, false, 'Locked'],
    [{ loading: true }, true, true, ''],
    [{ loadingWithReason: 'Saving' }, true, true, 'Saving'],
    // The reason shows while loading, whether or not loading disables.
    [
      { loadingWithReason: 'Saving', disableWhileLoading: false },
      false,
      true,
      'Saving',
    ],
  ])(
    '%o → disabled %s, loading %s, tooltip %j',
    (props, isDisabled, isLoading, stateTooltip) => {
      const { result } = renderHook(() => useIsDisabled(props));
      expect(result.current).toEqual({ isLoading, isDisabled, stateTooltip });
    },
  );
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
