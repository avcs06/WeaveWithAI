'use client';

import { classNames } from '@packages/styles/classNames';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import React, { useId } from 'react';

import { PlainButton } from '../Button';
import {
  SectionContent,
  SectionFrame,
  SectionHeader,
  SectionHeading,
  useSectionLevel,
} from '../Section';
import { createLook, hasContent, useIconAddon } from '../utils';

import {
  accordionItem,
  accordionTitle,
  accordionTrigger,
} from './Accordion.css';
import { accordionRecipe } from './Accordion.recipes.css';

import type { AccordionItemProps, AccordionProps } from './Accordion.types';

/**
 * One section of an Accordion: a Section whose heading opens and closes its
 * content.
 */
const AccordionItem = ({
  value,
  title,
  description,
  headerAction,
  leftIcon,
  rightIcon,
  leftAddOn,
  rightAddOn,
  className,
  children,
}: AccordionItemProps) => {
  const level = useSectionLevel();
  const descriptionId = useId();
  const hasDescription = hasContent(description);

  const { leftSlot, rightSlot } = useIconAddon({
    leftIcon,
    rightIcon,
    leftAddOn,
    rightAddOn,
  });

  const heading = (
    // The button sits in the heading, so the outline still lists it.
    <AccordionPrimitive.Header asChild>
      <SectionHeading level={level} className={accordionTitle}>
        <AccordionPrimitive.Trigger
          asChild
          aria-describedby={hasDescription ? descriptionId : undefined}
        >
          <PlainButton>
            <span
              data-slot="trigger"
              className={classNames(
                accordionTrigger,
                'flex-row-gap-2 items-center flex-fill-x',
                'cursor-pointer',
              )}
            >
              {leftSlot}
              <span className="flex-fill-x">{title}</span>
              {rightSlot}
            </span>
          </PlainButton>
        </AccordionPrimitive.Trigger>
      </SectionHeading>
    </AccordionPrimitive.Header>
  );

  return (
    <AccordionPrimitive.Item value={value} asChild>
      <SectionFrame className={classNames(accordionItem, className)}>
        <SectionHeader
          heading={heading}
          description={description}
          descriptionId={descriptionId}
          // Beside the heading's button, not in it: pressing an action never
          // toggles. The chevron follows the actions.
          action={
            <>
              {headerAction}
              <ChevronDown aria-hidden data-slot="chevron" />
            </>
          }
        />
        <AccordionPrimitive.Content data-slot="panel">
          <SectionContent level={level}>{children}</SectionContent>
        </AccordionPrimitive.Content>
      </SectionFrame>
    </AccordionPrimitive.Item>
  );
};

const accordionLook = createLook(accordionRecipe);

const AccordionRoot = (props: AccordionProps) => {
  const { look, className, children } = props;
  const rootClassName = accordionRecipe(accordionLook(look));
  // Radix takes `undefined` as uncontrolled.
  const root =
    props.mode === 'multiple'
      ? {
          type: 'multiple' as const,
          value: props.value,
          defaultValue: props.defaultValue,
          onValueChange: props.onValueChange,
        }
      : {
          type: 'single' as const,
          // The open section closes again from its own heading.
          collapsible: true,
          value: props.value,
          defaultValue: props.defaultValue,
          onValueChange: props.onValueChange,
        };

  return (
    <AccordionPrimitive.Root
      {...root}
      data-slot="accordion"
      className={classNames(rootClassName, 'flex-col-gap-0', className)}
    >
      {children}
    </AccordionPrimitive.Root>
  );
};

/**
 * Sections that open and close under their headings: an FAQ, a long form's
 * optional parts. Each `Accordion.Item` is one section. One open at a time
 * (`mode="single"`, default) or any number (`mode="multiple"`). Arrow keys,
 * Home and End move between the headings. One section alone is a
 * Collapsible; one that always shows is a Section.
 *
 * @invalidAlternative import('@radix-ui/react-accordion')
 * @invalidAlternative details[name]
 */
export const Accordion = Object.assign(AccordionRoot, { Item: AccordionItem });
