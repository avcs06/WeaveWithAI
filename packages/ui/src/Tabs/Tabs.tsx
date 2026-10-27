'use client';

import { classNames } from '@packages/styles/classNames';
import { useControlledValue } from '@packages/utils/hooks';
import {
  ConfigOrderProvider,
  ConfigSyncProvider,
  useConfigOrder,
  useStoreSync,
} from '@packages/utils/state';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import React, { type ReactNode, useId, useLayoutEffect } from 'react';

import { PlainButton } from '../Button';
import { FlexScrollArea, ScrollArea } from '../ScrollArea';
import { useIconAddon, useIsDisabled } from '../utils';

import { TabsStoreProvider, useTabsStore, useTabsStoreContext } from './store';
import { tabsList, tabTrigger } from './Tabs.css';
import { tabsRecipe } from './Tabs.recipes.css';

import type { TabItem, TabProps, TabsProps } from './Tabs.types';

/**
 * One tab of a Tabs: `title` and its icons in the tab list, and its children
 * the panel shown while it's active. It renders nothing itself.
 *
 * @invalidAlternative [role="tab"], [role="tabpanel"]
 */
export const Tab = ({
  value,
  title,
  leftIcon,
  rightIcon,
  leftAddOn,
  rightAddOn,
  keepMounted = false,
  children,
  ...state
}: TabProps) => {
  const id = useId();
  const { store } = useTabsStoreContext();
  const { isDisabled } = useIsDisabled(state);
  useConfigOrder(id);

  useStoreSync(() => {
    store('setTab')(id, {
      value,
      title,
      leftIcon,
      rightIcon,
      leftAddOn,
      rightAddOn,
      keepMounted,
      state,
      isDisabled,
    });
  }, [
    value,
    title,
    leftIcon,
    rightIcon,
    leftAddOn,
    rightAddOn,
    keepMounted,
    state.disabled,
    state.disabledWithReason,
    state.loading,
    state.loadingWithReason,
  ]);

  // Apart from the tab, so a panel's change re-renders that panel alone.
  useStoreSync(() => {
    store('setTabContent')(id, children);
  }, [id, children]);

  useLayoutEffect(() => () => store('removeTab')(id), [store, id]);

  return null;
};

const TabsConfigProvider = ({ children }: { children: ReactNode }) => {
  const { useStore, store } = useTabsStoreContext();
  return (
    <ConfigSyncProvider useStore={useStore}>
      <ConfigOrderProvider onOrder={store('setOrder')}>
        {children}
      </ConfigOrderProvider>
    </ConfigSyncProvider>
  );
};

/** Selects only its own panel's content, so other panels don't re-render. */
const TabContent = ({ id }: { id: string }) =>
  useTabsStore((state) => state.contentOf(id));

const TabTrigger = ({ tab }: { tab: TabItem }) => {
  const { value, title, state } = tab;
  const { isLoading, isFocusable } = useIsDisabled(state);

  const { leftSlot, rightSlot } = useIconAddon({
    leftIcon: tab.leftIcon,
    rightIcon: tab.rightIcon,
    leftAddOn: tab.leftAddOn,
    rightAddOn: tab.rightAddOn,
    loading: isLoading,
  });

  return (
    // Radix's `disabled` takes a tab out of the arrow keys' reach: only one
    // with no reason to show leaves it.
    <TabsPrimitive.Trigger value={value} disabled={!isFocusable} asChild>
      <PlainButton {...state} aria-busy={isLoading || undefined}>
        <span
          data-slot="trigger"
          className={classNames(
            tabTrigger,
            'inline-flex-row-gap-2.5 items-center',
          )}
        >
          {leftSlot}
          <span data-slot="label">{title}</span>
          {rightSlot}
        </span>
      </PlainButton>
    </TabsPrimitive.Trigger>
  );
};

const TabPanel = ({ tab, isActive }: { tab: TabItem; isActive: boolean }) => (
  <TabsPrimitive.Content
    value={tab.value}
    forceMount={tab.keepMounted || undefined}
    // Radix shows a kept panel; the class hides it too, since a display class
    // beats the attribute.
    hidden={!isActive}
    // Not a tab stop: Tab goes from the tabs to what the panel holds. A panel
    // with nothing to Tab to that scrolls takes a stop itself, its scroll
    // area's.
    tabIndex={undefined}
    data-slot="panel"
    className={isActive ? 'flex-col-gap-0 flex-fill-y' : 'hidden'}
  >
    <FlexScrollArea orientation="vertical">
      <div className="p-2">
        <TabContent id={tab.id} />
      </div>
    </FlexScrollArea>
  </TabsPrimitive.Content>
);

const TabsView = <V extends string>({
  activeTab,
  onTabChange,
  variant,
  className,
}: Omit<TabsProps<V>, 'children'>) => {
  const tabs = useTabsStore('tabs');
  const [selected, select] = useControlledValue(
    activeTab,
    undefined,
    onTabChange,
  );

  // With every tab disabled, none is active: the list shows without a panel.
  const active =
    tabs.find((tab) => tab.value === selected) ??
    tabs.find((tab) => !tab.isDisabled);

  if (tabs.length === 0) return null;

  const rootClassName = tabsRecipe({ variant });
  return (
    <TabsPrimitive.Root
      // `''` is no tab: `undefined` would let Radix keep a value of its own.
      value={active?.value ?? ''}
      onValueChange={(value) => {
        // Radix activates on press and on focus, and a disabled tab with a
        // reason stays focusable.
        const tab = tabs.find((entry) => entry.value === value);
        // Tab children can't be typed by their Tabs, so values are taken as V.
        if (tab && !tab.isDisabled) select(value as V);
      }}
      className={classNames(rootClassName, 'flex-col-gap-5', className)}
    >
      {/* Tabs that don't fit the width scroll sideways. */}
      <ScrollArea orientation="horizontal">
        <TabsPrimitive.List
          data-slot="list"
          // Radix focuses a pressed tab by script, which a browser can show
          // as keyboard focus: the ring shows only while the keyboard is in
          // use.
          onPointerDown={(event) => {
            event.currentTarget.dataset.pointer = '';
          }}
          onKeyDownCapture={(event) => {
            delete event.currentTarget.dataset.pointer;
          }}
          // Tabbing back in from outside presses no key inside the list.
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget))
              delete event.currentTarget.dataset.pointer;
          }}
          className={classNames(tabsList, 'flex-row-gap-1')}
        >
          {tabs.map((tab) => (
            <TabTrigger key={tab.id} tab={tab} />
          ))}
        </TabsPrimitive.List>
      </ScrollArea>
      {tabs.map((tab) => (
        <TabPanel key={tab.id} tab={tab} isActive={tab.id === active?.id} />
      ))}
    </TabsPrimitive.Root>
  );
};

/**
 * Views of one subject that share a place on the page, one shown at a time:
 * a session's details, speakers and feedback. Its `Tab` children are the
 * tabs, each with its panel. Going to another page is a Link, not a tab.
 *
 * @invalidAlternative [role="tablist"]
 * @invalidAlternative import('@radix-ui/react-tabs')
 */
export function Tabs<V extends string = string>({
  children,
  ...props
}: TabsProps<V>) {
  return (
    <TabsStoreProvider>
      <TabsConfigProvider>{children}</TabsConfigProvider>
      <TabsView<V> {...props} />
    </TabsStoreProvider>
  );
}
