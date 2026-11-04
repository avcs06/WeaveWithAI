import type { SectionHeaderProps } from '../Section';
import type { ReactNode } from 'react';

type SingleMode = {
  /** One section open at a time (default); opening one closes the other. */
  mode?: 'single';
  /** The open section's `value`; `''` for none. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
};

type MultipleMode = {
  /** Any number of sections open. */
  mode: 'multiple';
  /** The open sections' `value`s. */
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
};

type AccordionLook = {
  /** `bordered` (default): a frame around the sections. `open`: dividers only. */
  look?: string;
};

export type AccordionProps = (SingleMode | MultipleMode) &
  AccordionLook & {
    className?: string;
    /** `Accordion.Item`s. */
    children: ReactNode;
  };

export type AccordionItemProps = SectionHeaderProps & {
  /** Names this section in the Accordion's `value`. */
  value: string;
  className?: string;
  children?: ReactNode;
};

export type CollapsibleProps = SectionHeaderProps &
  AccordionLook & {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    className?: string;
    children?: ReactNode;
  };
