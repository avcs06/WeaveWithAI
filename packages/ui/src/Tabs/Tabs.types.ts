import type { tabsRecipe } from './Tabs.recipes.css';
import type { DisabledState, IconAddonProps, LoadingState } from '../utils';
import type { RecipeVariants } from '@vanilla-extract/recipes';
import type { ReactNode } from 'react';

type TabsRecipeVariants = NonNullable<RecipeVariants<typeof tabsRecipe>>;

export type TabsProps<V extends string = string> = TabsRecipeVariants & {
  /**
   * The active tab's `value`. Without it, Tabs keeps its own, starting at the
   * first tab that isn't disabled; with every tab disabled, none is active.
   */
  activeTab?: V;
  onTabChange?: (value: V) => void;
  /** `Tab` elements, one per tab. */
  children: ReactNode;
  /** For the root, around the tab list and the panel. */
  className?: string;
};

type TabIcons = Pick<
  IconAddonProps,
  'leftIcon' | 'rightIcon' | 'leftAddOn' | 'rightAddOn'
>;

/** Blocks choosing the tab; a reason shows in its tooltip. */
export type TabState = DisabledState & LoadingState;

export type TabProps = TabIcons &
  TabState & {
    /** Names the tab for `activeTab` and `onTabChange`. */
    value: string;
    /** Shown in the tab list, between the icons. */
    title: string;
    /** The panel, rendered while the tab is active. */
    children: ReactNode;
    /**
     * Renders the panel from the start and hides it while another tab is
     * active, so what it keeps itself, like its scroll position, survives
     * switching.
     */
    keepMounted?: boolean;
  };

export type TabEntry = TabIcons & {
  value: string;
  title: string;
  keepMounted: boolean;
  state: TabState;
  isDisabled: boolean;
};

export type TabItem = TabEntry & { id: string };
