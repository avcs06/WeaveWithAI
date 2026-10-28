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
 * One tab of a Tabs: `title` and icons in the tab list, children as the
 * panel shown while it's active. It renders nothing itself.
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
    store('setTab')(id, { value, title, keepMounted, state, isDisabled });
  }, [
    value,
    title,
    keepMounted,
    state.disabled,
    state.disabledWithReason,
    state.loading,
    state.loadingWithReason,
  ]);

  // Elements are new every render: kept apart so only this tab's trigger and
  // panel re-render. No deps: they'd always differ.
  useStoreSync(() => {
    store('setTabRenderables')(id, {
      leftIcon,
      rightIcon,
      leftAddOn,
      rightAddOn,
      content: children,
    });
  });

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
  useTabsStore((state) => state.renderablesOf(id)?.content);

// Radix builds ids from the value, which can hold spaces an id reference
// can't: these come from the tab's own id.
const triggerId = (tab: TabItem) => `${tab.id}-trigger`;
const panelId = (tab: TabItem) => `${tab.id}-panel`;

const TabTrigger = ({ tab }: { tab: TabItem }) => {
  const { value, title, state } = tab;
  const renderables = useTabsStore((store) => store.renderablesOf(tab.id));
  const { isLoading, isFocusable } = useIsDisabled(state);

  const { leftSlot, rightSlot } = useIconAddon({
    leftIcon: renderables?.leftIcon,
    rightIcon: renderables?.rightIcon,
    leftAddOn: renderables?.leftAddOn,
    rightAddOn: renderables?.rightAddOn,
    loading: isLoading,
  });

  return (
    // Radix's `disabled` removes a tab from arrow-key reach: only a tab with
    // no reason does that.
    <TabsPrimitive.Trigger
      value={value}
      disabled={!isFocusable}
      id={triggerId(tab)}
      aria-controls={panelId(tab)}
      asChild
    >
      <PlainButton {...state} aria-busy={isLoading || undefined}>
        <span
          data-slot="trigger"
          className={classNames(
            tabTrigger,
            'inline-flex-row-gap-2.5 items-center',
            'relative whitespace-nowrap cursor-pointer',
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
    id={panelId(tab)}
    aria-labelledby={triggerId(tab)}
    forceMount={tab.keepMounted || undefined}
    // Radix shows a kept panel; the class hides it too, as a display class
    // beats the attribute.
    hidden={!isActive}
    // Not a tab stop: Tab goes from the tabs to the panel's content. A
    // scrolling panel with nothing to Tab to gets its scroll area's stop.
    tabIndex={undefined}
    data-slot="panel"
    className={isActive ? 'flex-col-gap-0 flex-fill-y' : 'hidden'}
  >
    {/* Named for when it takes focus to scroll. */}
    <FlexScrollArea orientation="vertical" aria-labelledby={triggerId(tab)}>
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
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
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
        // Radix activates on press and focus; a disabled tab with a reason
        // stays focusable.
        const tab = tabs.find((entry) => entry.value === value);
        // Tab children can't be typed by their Tabs, so values are taken as V.
        if (tab && !tab.isDisabled) select(value as V);
      }}
      className={classNames(rootClassName, 'flex-col-gap-5', className)}
    >
      <ScrollArea orientation="horizontal">
        <TabsPrimitive.List
          data-slot="list"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          // Radix focuses a pressed tab by script, which a browser may show as
          // keyboard focus: show the ring only while the keyboard is in use.
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
 * tabs, each with its panel. Another page is a Link, not a tab.
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
