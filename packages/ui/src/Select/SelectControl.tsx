'use client';

import React, { useEffect, useId, useRef, useState } from 'react';

// eslint-disable-next-line import-rules/barrel-only-sibling-imports -- Dropdown's primitives, for components built on Dropdown.
import {
  DropdownGroup,
  DropdownRoot,
  DropdownTrigger,
} from '../Dropdown/primitives';
import { FormControl } from '../FormControl';
import { hasContent, joinIds, mergeRefs, useIsDisabled } from '../utils';

import { SelectMenu, SelectMenuMessage, SelectOptionRow } from './primitives';
import { useSelectionControl } from './selectionControl';
import { SelectOptionContent } from './SelectOption';
import {
  SelectContent,
  SelectEnd,
  type SelectFieldAria,
  SelectSearchField,
  SelectTrigger,
  SelectValue,
} from './SelectTrigger';
import { useSelectOptions, useSelectStoreContext } from './store';
import { useSelectFocus } from './useSelectFocus';
import { useSelectSearch } from './useSelectSearch';
import { announcement, menuMessage } from './utils';

import type {
  SelectControlProps,
  SelectOptionGroup,
  SelectOptionItem,
} from './Select.types';

export function SelectControl(props: SelectControlProps) {
  const {
    size,
    label,
    placeholder,
    rightIcon,
    rightAddOn,
    allowClear = true,
    allowSearch = true,
    showCheckbox,
    showCheckmark,
    search,
    onSearch,
    onBlur,
    'aria-label': ariaLabel,
    disableWhileLoading = false,
  } = props;

  const menuId = useId();
  const editHintId = useId();

  const triggerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [open, setOpenState] = useState(false);
  // A change no option shows, said by the status region.
  const [notice, setNotice] = useState('');

  const { isDisabled, isLoading } = useIsDisabled({
    ...props,
    disableWhileLoading,
  });

  const { store } = useSelectStoreContext();
  const { options, getOptionData } = useSelectOptions();
  const selectionControl = useSelectionControl(props, getOptionData, setNotice);
  const selectedOptions = selectionControl.values.map(getOptionData);

  const { searchText, setSearchText, isSearchable, filteredOptions } =
    useSelectSearch({ allowSearch, search, onSearch }, options);

  const isSearching = searchText !== '';
  const hasSearchField = open && isSearchable;
  const canClear = allowClear && selectedOptions.length > 0 && !isDisabled;
  const hasTags = selectionControl.multiple && !props.renderTrigger;
  const canEdit = selectionControl.multiple
    ? selectedOptions.length > 0 && !isDisabled
    : canClear;
  const placeholderText = placeholder ?? (label ? `Select ${label}` : 'Select');
  const message = menuMessage(isLoading, filteredOptions.length, isSearching);

  const setOpen = (next: boolean) => {
    setOpenState(next);
    setNotice('');
    if (!next) setSearchText('');
  };

  const changeSearchText = (text: string) => {
    setNotice('');
    setSearchText(text);
  };

  const focus = useSelectFocus({
    open,
    setOpen,
    isSearchable,
    isDisabled,
    selectionControl,
    canClear,
    setSearchText,
    onBlur,
    triggerRef,
    searchRef,
    menuRef,
  });

  const chooseFirstOption = () => {
    const first = filteredOptions.find(
      ({ disabledState }) =>
        !(disabledState.disabled || disabledState.disabledWithReason),
    );
    // Results on the way may not match what's typed yet.
    if (!first || isLoading) return;

    const { value, label: optionLabel } = first.data;
    if (selectionControl.multiple) {
      setNotice(
        `${selectionControl.isSelected(value) ? 'Removed' : 'Selected'} ${optionLabel}`,
      );
      selectionControl.toggleValue(value);
    } else {
      focus.focusTrigger();
      selectionControl.setValues([value]);
      setOpen(false);
    }
  };

  // Keeps the data a later render can need: listed options and selected
  // values.
  useEffect(() => {
    store('forget')(selectionControl.values);
  }, [store, options, selectionControl.values]);

  const triggerContent =
    props.renderTrigger && selectedOptions.length > 0 ? (
      props.renderTrigger({ selected: selectedOptions, open })
    ) : (
      <SelectValue
        selected={selectedOptions}
        multiple={selectionControl.multiple}
        placeholder={placeholderText}
        disabled={isDisabled}
        onRemove={focus.removeTag}
        onTagKeyDown={focus.onTagKeyDown}
      />
    );

  // Single: the search field takes the value's place. Multiple: it follows
  // the tags.
  const showsValue =
    !hasSearchField ||
    (selectionControl.multiple && selectedOptions.length > 0);

  const status =
    notice ||
    (open ? announcement(message, filteredOptions.length, isSearching) : '');

  const renderOption = ({ id, data, disabledState }: SelectOptionItem) => (
    <SelectOptionRow
      key={id}
      {...disabledState}
      selected={selectionControl.isSelected(data.value)}
      textValue={data.label}
      onSelect={(event) => {
        if (selectionControl.multiple) {
          // Stays open for more choices.
          event.preventDefault();
          selectionControl.toggleValue(data.value);
        } else {
          // Focus goes back to the trigger before the option goes away.
          focus.focusTrigger();
          selectionControl.setValues([data.value]);
        }
      }}
    >
      <SelectOptionContent id={id} label={data.label} />
    </SelectOptionRow>
  );

  // A group's options are consecutive, as its children are.
  const sections: {
    group: SelectOptionGroup | undefined;
    options: SelectOptionItem[];
  }[] = [];
  for (const option of filteredOptions) {
    const last = sections.at(-1);
    if (last && last.group?.id === option.group?.id) last.options.push(option);
    else sections.push({ group: option.group, options: [option] });
  }

  return (
    <DropdownRoot
      open={open}
      onOpenChange={setOpen}
      modal={false}
      showCheckbox={showCheckbox}
      showCheckmark={showCheckmark}
      // The box shows why, from FormControl.
      disabled={isDisabled}
    >
      <FormControl
        {...props}
        // The trigger is the box, given its props through DropdownTrigger.
        withControlBox={false}
        placeholder={placeholderText}
        disableWhileLoading={disableWhileLoading}
      >
        {(controlProps) => {
          const fieldAria: SelectFieldAria = {
            'aria-describedby': joinIds(
              controlProps['aria-describedby'],
              canEdit && editHintId,
            ),
            'aria-invalid': controlProps['aria-invalid'],
            'aria-required': controlProps['aria-required'],
            'aria-keyshortcuts': canEdit
              ? `Backspace Delete${hasTags ? ' ArrowLeft' : ''}`
              : undefined,
          };

          // Undefined values override the menu-button attributes Radix
          // gives its trigger.
          const boxRole = hasSearchField
            ? {
                role: 'group',
                tabIndex: -1,
                'aria-haspopup': undefined,
                'aria-expanded': undefined,
                'aria-controls': undefined,
                'aria-describedby': undefined,
                'aria-required': undefined,
              }
            : {
                role: 'combobox',
                'aria-haspopup': 'listbox' as const,
                'aria-controls': open ? menuId : undefined,
                ...fieldAria,
              };

          return (
            <DropdownTrigger>
              <SelectTrigger
                {...controlProps}
                ref={mergeRefs(controlProps.ref, triggerRef)}
                aria-label={label ? undefined : (ariaLabel ?? placeholderText)}
                {...boxRole}
                {...focus.trigger}
              >
                <SelectContent
                  value={showsValue && triggerContent}
                  search={
                    hasSearchField && (
                      <SelectSearchField
                        ref={searchRef}
                        label={label}
                        menuId={menuId}
                        text={searchText}
                        placeholder={
                          selectionControl.multiple
                            ? 'Search'
                            : (selectedOptions[0]?.label ?? 'Search')
                        }
                        onTextChange={changeSearchText}
                        onKeyDownWhenEmpty={focus.editValues}
                        onEnter={chooseFirstOption}
                        {...fieldAria}
                      />
                    )
                  }
                />
                <SelectEnd
                  size={size}
                  atTop={hasContent(rightIcon) || hasContent(rightAddOn)}
                  onClear={canClear ? selectionControl.clearValues : undefined}
                />
                {canEdit && (
                  <span id={editHintId} hidden>
                    {selectionControl.multiple
                      ? `Backspace removes the last value, Delete the first.${hasTags ? ' ArrowLeft moves to the values.' : ''}`
                      : 'Press Backspace or Delete to clear.'}
                  </span>
                )}
              </SelectTrigger>
            </DropdownTrigger>
          );
        }}
      </FormControl>
      <span role="status" className="sr-only">
        {status}
      </span>
      <SelectMenu
        ref={menuRef}
        id={menuId}
        // Radix names the menu by the trigger's id, which FormControl replaced.
        aria-labelledby={undefined}
        aria-label={label ?? ariaLabel ?? placeholderText}
        multiple={selectionControl.multiple}
        loading={isLoading}
        {...focus.menu}
      >
        <SelectMenuMessage loading={isLoading}>{message}</SelectMenuMessage>
        {sections.flatMap(({ group, options: groupOptions }) =>
          group ? (
            <DropdownGroup key={group.id} label={group.label}>
              {groupOptions.map(renderOption)}
            </DropdownGroup>
          ) : (
            groupOptions.map(renderOption)
          ),
        )}
      </SelectMenu>
    </DropdownRoot>
  );
}
