import type { formControlRecipe } from './FormControl.recipes.css';
import type { DisabledProps, IconAddonProps, SetByComponent } from '../utils';
import type { RecipeVariants } from '@vanilla-extract/recipes';
import type {
  AriaAttributes,
  ComponentPropsWithRef,
  CSSProperties,
  MouseEvent,
  ReactElement,
  ReactNode,
  Ref,
  RefCallback,
  RefObject,
} from 'react';

type FormControlRecipeVariants = NonNullable<
  RecipeVariants<typeof formControlRecipe>
>;

export type ControlStatus = 'error' | 'warning' | 'success';

/** Every prop form controls share; Input and Select take them as their own. */
export type FormControlOwnProps = DisabledProps &
  Pick<IconAddonProps, 'leftIcon' | 'rightIcon' | 'leftAddOn' | 'rightAddOn'> &
  Pick<FormControlRecipeVariants, 'size' | 'variant'> &
  /** Set on the control from the props below. */
  SetByComponent<
    Exclude<Extract<keyof ControlProps, `aria-${string}`>, 'aria-labelledby'>
  > & {
    /**
     * The ids of elements that name the control, like a section's heading,
     * for a control with no `label`.
     */
    'aria-labelledby'?: string;
    /** The control's id; generated when left out. */
    id?: string;
    /** The control's name; else the label, the placeholder, then the id. */
    name?: string;
    label?: string;
    placeholder?: string;
    /** Shown in a tooltip from the info icon after the label. */
    hint?: ReactNode;
    /** At the end of the label's row; shown only with a label. */
    labelRightSlot?: ReactNode;
    helpText?: ReactNode;
    /**
     * Each status takes `true` for the style alone, or a message to show.
     * Error wins over warning, and warning over success.
     */
    error?: string | boolean;
    warning?: string | boolean;
    success?: string | boolean;
    required?: boolean;
    /** Space-separated styles: `outline` (default) or `open`. */
    look?: string;
    /** Shown on hover over the box, above any disabled reason. */
    tooltip?: ReactNode;
    /** Reaches the control's focusable element. */
    ref?: Ref<HTMLElement>;
  };

/** The attributes of the control's focusable element; they win over its own. */
export type ControlProps = Pick<
  AriaAttributes,
  | 'aria-labelledby'
  | 'aria-describedby'
  | 'aria-invalid'
  | 'aria-required'
  | 'aria-disabled'
  | 'aria-readonly'
  | 'aria-busy'
> & {
  id: string;
  name: string;
  // A callback ref fits any element; a ref object only its own type.
  ref: RefCallback<HTMLElement>;
  tabIndex: 0 | -1;
  'data-slot': 'control';
  'data-disabled': true | undefined;
  /** Not an attribute: a control takes it out before spreading the rest. */
  isDisabled: boolean;
};

export type FormControlProps = FormControlOwnProps & {
  /** Renders the control, given its element's attributes. */
  children: (controlProps: ControlProps) => ReactElement;
  /**
   * Draws the control box around the control; `true` by default. `false`
   * for a control that is its own box, like Select's trigger: it renders a
   * `ControlBox`, and the control gets the box's props.
   */
  withControlBox?: boolean;
  /** For the field's root, around the label, the box and the messages. */
  className?: string;
};

export type ControlLabelProps = {
  id: string;
  htmlFor: string;
  label: string | undefined;
  required: boolean;
  hint: ReactNode;
  rightAddOn: ReactNode;
  /** Left out, a press activates the labelled control natively. */
  onClick?: (event: MouseEvent<HTMLLabelElement>) => void;
};

export type ControlMessageProps = {
  id?: string;
  /** Styles the message as that status; without one, it's help text. */
  status: ControlStatus | undefined;
  message: ReactNode;
};

/** What the control box draws: its field's look and state. */
export type ControlBoxState = Pick<
  FormControlOwnProps,
  | 'size'
  | 'variant'
  | 'look'
  | 'leftIcon'
  | 'rightIcon'
  | 'leftAddOn'
  | 'rightAddOn'
  | 'tooltip'
> & {
  status: ControlStatus | undefined;
  isDisabled: boolean;
  isLoading: boolean;
  stateTooltip: string;
  controlRef: RefObject<HTMLElement | null> | undefined;
};

/** The state comes from FormControl; a control that renders the box passes it on. */
export type ControlBoxProps = ComponentPropsWithRef<'div'> &
  Partial<ControlBoxState>;

/** What the box takes from its row: its id, name and descriptions. */
export type ChoiceBoxProps = {
  /** The label presses the box through it. */
  ref: (node: HTMLElement | null) => void;
  id: string;
  'aria-labelledby': string | undefined;
  'aria-describedby': string | undefined;
};

export type ControlChoiceProps = {
  /** `checkbox` or `radio`: the row's `data-slot`. */
  slot: string;
  /** The box's id; generated when left out. */
  id: string | undefined;
  /** The label, to the right of the box. */
  label: string | undefined;
  hint: ReactNode;
  required: boolean;
  isDisabled: boolean;
  'aria-labelledby': string | undefined;
  'aria-describedby': string | undefined;
  /** For the row, around the box and its label. */
  className: string | undefined;
  style: CSSProperties | undefined;
  /** Draws the box. */
  children: (box: ChoiceBoxProps) => ReactElement;
};
