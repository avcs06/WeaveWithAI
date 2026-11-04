'use client';

import { useOnce } from '@packages/utils/hooks';
import {
  ConfigOrderProvider,
  ConfigSyncProvider,
  createContext,
  useConfigOrder,
  useStoreSync,
} from '@packages/utils/state';
import React, { type ReactNode, useId, useLayoutEffect } from 'react';

import { hasContent } from '../utils';

import { useSelectStore, useSelectStoreContext } from './store';

import type {
  SelectGroupProps,
  SelectOptionGroup,
  SelectOptionProps,
} from './Select.types';

const [SelectGroupProvider, useSelectGroup] = createContext<
  SelectOptionGroup | undefined
>(undefined);

/**
 * One option of a Select or MultiSelect. It renders nothing itself: `value`
 * and `label` are the option, its children draw its menu row, and other props
 * are data passed to `onChange`.
 *
 * @invalidAlternative [role="option"]
 */
export const SelectOption = <V extends string = string>(
  props: SelectOptionProps<V>,
) => {
  const id = useId();
  const { store } = useSelectStoreContext();
  const group = useSelectGroup();
  useConfigOrder(id);

  const { value, label, children, disabled, disabledWithReason, ...extra } =
    props;

  const extraKeys = useOnce(() => Object.keys(extra));

  useStoreSync(() => {
    store('setOption')(id, {
      data: { ...extra, value, label },
      disabledState:
        disabledWithReason === undefined
          ? { disabled }
          : { disabledWithReason },
      group,
    });
  }, [
    value,
    label,
    disabled,
    disabledWithReason,
    group?.id,
    group?.label,
    ...extraKeys.map((key) => extra[key]),
  ]);

  // No deps: `children` is new on every render, so it writes after each one.
  useStoreSync(() => {
    store('setOptionContent')(id, children);
  });

  useLayoutEffect(() => () => store('removeOption')(id), [store, id]);

  return null;
};

/**
 * A labelled group of options in a Select's menu: sessions by day, venues by
 * city. Its children are `SelectOption` elements.
 *
 * @invalidAlternative optgroup
 */
export const SelectGroup = ({ label, children }: SelectGroupProps) => {
  const id = useId();
  return (
    <SelectGroupProvider value={{ id, label }}>{children}</SelectGroupProvider>
  );
};

export const SelectOptionsProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { useStore, store } = useSelectStoreContext();
  return (
    <ConfigSyncProvider useStore={useStore}>
      <ConfigOrderProvider onOrder={store('setOrder')}>
        {children}
      </ConfigOrderProvider>
    </ConfigSyncProvider>
  );
};

/** Selects only its own option's content, so other rows don't re-render. */
export const SelectOptionContent = ({
  id,
  label,
}: {
  id: string;
  label: string;
}) => {
  const content = useSelectStore((state) => state.contentOf(id));
  return hasContent(content) ? content : label;
};
