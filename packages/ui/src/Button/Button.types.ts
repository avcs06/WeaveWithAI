import type { buttonRecipe } from './Button.recipes.css';
import type {
  AccessibleName,
  DisabledProps,
  IconAddonProps,
  SetByComponent,
} from '../utils';
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
type PolymorphicProps<C extends ButtonTarget, OwnProps> = {
  /**
   * Forwards props, ref and className to its interactive root. Button owns
   * that root's look; inline styles and important rules can override it.
   */
  as?: C;
} & Omit<TargetProps<C>, keyof OwnProps | 'as'> &
  OwnProps;

type ButtonRecipeVariants = NonNullable<RecipeVariants<typeof buttonRecipe>>;

type IconProps = Pick<
  IconAddonProps,
  'leftIcon' | 'rightIcon' | 'leftAddOn' | 'rightAddOn'
>;

type TooltipProp = {
  /**
   * Shown on hover and focus, above any disabled, read-only or loading reason.
   * Screen readers get it as the description, unless it repeats the name.
   */
  tooltip?: ReactNode;
};

/** Set from `disabled`, `loading` and their reasons. */
type ButtonStateAria = SetByComponent<'aria-disabled' | 'aria-busy'>;

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
    LookProp &
    ButtonStateAria
>;

// An icon doesn't name the button: `aria-label`, `aria-labelledby` or a
// string `tooltip` must.
export type IconButtonProps<C extends ButtonTarget = 'button'> =
  PolymorphicProps<
    C,
    DisabledProps &
      Pick<ButtonRecipeVariants, 'variant'> &
      LookProp &
      ButtonStateAria & {
        size?: 'xs' | 'sm' | 'md';
        children: ReactElement;
      }
  > &
    // An icon doesn't name the button: its tooltip does, or `aria-label` or
    // `aria-labelledby` where the name should differ from what it shows.
    ({ tooltip: string } | ({ tooltip: ReactNode } & AccessibleName));

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
  TooltipProp &
  SetByComponent<'aria-disabled'> & {
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
