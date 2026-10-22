import type { buttonRecipe } from './Button.recipes.css';
import type { DisabledProps, IconAddonProps } from '../utils';
import type { RecipeVariants } from '@vanilla-extract/recipes';
import type {
  ComponentPropsWithRef,
  JSXElementConstructor,
  KeyboardEventHandler,
  MouseEventHandler,
  PointerEventHandler,
  ReactElement,
  ReactNode,
} from 'react';

export type ButtonTarget = 'button' | JSXElementConstructor<never>;

type TargetProps<C extends ButtonTarget> =
  C extends JSXElementConstructor<infer Props>
    ? Props
    : ComponentPropsWithRef<'button'>;

/** `as`, the target's own props and ref, and `OwnProps`, which win where the two overlap. */
type PolymorphicProps<C extends ButtonTarget, OwnProps> = { as?: C } & Omit<
  TargetProps<C>,
  keyof OwnProps | 'as'
> &
  OwnProps;

type ButtonRecipeVariants = NonNullable<RecipeVariants<typeof buttonRecipe>>;

type IconProps = Pick<
  IconAddonProps,
  'leftIcon' | 'rightIcon' | 'leftAddOn' | 'rightAddOn'
>;

type TooltipProp = { tooltip?: ReactNode };

type LookProp = {
  /** Space-separated styles, in any order: `ghost`, `rounded`. */
  look?: string;
};

export type ButtonProps<C extends ButtonTarget = 'button'> = PolymorphicProps<
  C,
  DisabledProps &
    TooltipProp &
    IconProps &
    Pick<ButtonRecipeVariants, 'variant' | 'size'> &
    LookProp
>;

// An icon doesn't name the button, and a tooltip is no substitute for a name.
type AccessibleName = { 'aria-label': string } | { 'aria-labelledby': string };

export type IconButtonProps<C extends ButtonTarget = 'button'> =
  PolymorphicProps<
    C,
    DisabledProps &
      TooltipProp &
      Pick<ButtonRecipeVariants, 'variant'> &
      LookProp & {
        size?: 'xs' | 'sm' | 'md';
        children: ReactElement;
      }
  > &
    AccessibleName;

// The child can be any element, so its handlers get any element's events.
export type ActivationHandlers = {
  onClick?: MouseEventHandler<HTMLElement>;
  onPointerDown?: PointerEventHandler<HTMLElement>;
  onKeyDown?: KeyboardEventHandler<HTMLElement>;
  onKeyUp?: KeyboardEventHandler<HTMLElement>;
};

export type PlainButtonProps = Omit<
  ComponentPropsWithRef<'button'>,
  'children' | keyof DisabledProps | keyof ActivationHandlers
> &
  DisabledProps &
  ActivationHandlers &
  TooltipProp & {
    children: ReactElement;
  };

/**
 * Inside the components, props checked at the public types are only passed
 * through.
 */
export type ButtonBaseProps = DisabledProps &
  TooltipProp &
  IconProps & {
    as?: ButtonTarget;
    children?: ReactNode;
    className?: string;
    type?: string;
    tabIndex?: number;
    onClick?: MouseEventHandler<HTMLElement>;
    onPointerDown?: PointerEventHandler<HTMLElement>;
    onKeyDown?: KeyboardEventHandler<HTMLElement>;
    [prop: string]: unknown;
  };
