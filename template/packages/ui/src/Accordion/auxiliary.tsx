'use client';

import { useControlledValue } from '@packages/utils/hooks';
import React from 'react';

import { Accordion } from './Accordion';

import type { CollapsibleProps } from './Accordion.types';

const itemValue = 'content';

/**
 * One Section whose heading shows and hides its content: details the user
 * opens on demand, like advanced settings. Several are an Accordion.
 *
 * @invalidAlternative details, summary
 */
export const Collapsible = ({
  open,
  defaultOpen = false,
  onOpenChange,
  look,
  className,
  ...item
}: CollapsibleProps) => {
  const [isOpen, setOpen] = useControlledValue(open, defaultOpen, onOpenChange);

  return (
    <Accordion
      mode="multiple"
      value={isOpen ? [itemValue] : []}
      onValueChange={(values) => setOpen(values.length > 0)}
      look={look}
      className={className}
    >
      <Accordion.Item {...item} value={itemValue} />
    </Accordion>
  );
};
