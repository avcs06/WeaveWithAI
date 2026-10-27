import React from 'react';

import AvatarRecipe from './Avatar/Avatar.recipe';
import ButtonRecipe from './Button/Button.recipe';
import CardRecipe from './Card/Card.recipe';
import CheckboxRecipe from './Checkbox/Checkbox.recipe';
import ChipRecipe from './Chip/Chip.recipe';
// import DialogRecipe from './Dialog/Dialog.recipe';
import DropdownRecipe from './Dropdown/Dropdown.recipe';
import ErrorBoundaryRecipe from './ErrorBoundary/ErrorBoundary.recipe';
import FormRecipe from './Form/Form.recipe';
import FormControlRecipe from './FormControl/FormControl.recipe';
import IconsRecipe from './Icons/Icons.recipe';
import InputRecipe from './Input/Input.recipe';
import LinkRecipe from './Link/Link.recipe';
import PopoverRecipe from './Popover/Popover.recipe';
import RadioRecipe from './Radio/Radio.recipe';
import ScrollAreaRecipe from './ScrollArea/ScrollArea.recipe';
import SelectRecipe from './Select/Select.recipe';
// import SwitchRecipe from './Switch/Switch.recipe';
import TableRecipe from './Table/Table.recipe';
// import TabsRecipe from './Tabs/Tabs.recipe';
import TagRecipe from './Tag/Tag.recipe';
import TextareaRecipe from './Textarea/Textarea.recipe';
// import ToastRecipe from './Toast/Toast.recipe';
import TooltipRecipe from './Tooltip/Tooltip.recipe';
import TruncateRecipe from './Truncate/Truncate.recipe';

import type { Meta, StoryObj } from '@storybook/react-vite';

// One story per recipe: `pnpm verify --recipes` renders each at phone and
// desktop widths, and fails for a recipe missing here.
const meta = {
  title: 'Recipes',
  parameters: { controls: { disable: true }, layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Avatar: Story = { render: () => <AvatarRecipe /> };
export const Button: Story = { render: () => <ButtonRecipe /> };
export const Card: Story = { render: () => <CardRecipe /> };
export const Checkbox: Story = { render: () => <CheckboxRecipe /> };
export const Chip: Story = { render: () => <ChipRecipe /> };
// export const Dialog: Story = { render: () => <DialogRecipe /> };
export const Dropdown: Story = { render: () => <DropdownRecipe /> };
export const ErrorBoundary: Story = { render: () => <ErrorBoundaryRecipe /> };
export const Form: Story = { render: () => <FormRecipe /> };
export const FormControl: Story = { render: () => <FormControlRecipe /> };
export const Icons: Story = { render: () => <IconsRecipe /> };
export const Input: Story = { render: () => <InputRecipe /> };
export const Link: Story = { render: () => <LinkRecipe /> };
export const Popover: Story = { render: () => <PopoverRecipe /> };
export const Radio: Story = { render: () => <RadioRecipe /> };
export const ScrollArea: Story = { render: () => <ScrollAreaRecipe /> };
export const Select: Story = { render: () => <SelectRecipe /> };
// export const Switch: Story = { render: () => <SwitchRecipe /> };
export const Table: Story = { render: () => <TableRecipe /> };
// export const Tabs: Story = { render: () => <TabsRecipe /> };
export const Tag: Story = { render: () => <TagRecipe /> };
export const Textarea: Story = { render: () => <TextareaRecipe /> };
// export const Toast: Story = { render: () => <ToastRecipe /> };
export const Tooltip: Story = { render: () => <TooltipRecipe /> };
export const Truncate: Story = { render: () => <TruncateRecipe /> };
