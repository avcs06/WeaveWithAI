'use client';

import { classNames } from '@packages/styles/classNames';
import React, {
  type ComponentProps,
  createContext,
  type ReactNode,
  useContext,
} from 'react';

import { hasContent, useIconAddon } from '../utils';

import { sectionDescription, sectionTitle } from './Section.css';

import type { SectionProps } from './Section.types';

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

// The page's own title is the h1.
const HeadingLevelContext = createContext<HeadingLevel>(1);

/**
 * The heading level of a section here: one below the section around it.
 *
 * @internal
 */
export const useSectionLevel = (): HeadingLevel =>
  Math.min(useContext(HeadingLevelContext) + 1, 6) as HeadingLevel;

/**
 * A section's heading element at `level`: its icons and add-ons on one row
 * with the title. The caller gives the font.
 *
 * @internal
 */
export const SectionHeading = ({
  level,
  className,
  ...props
}: ComponentProps<'h2'> & { level: HeadingLevel }) => {
  const Heading = `h${level}` as const;
  return (
    <Heading
      {...props}
      className={classNames('flex-row-gap-2 items-center', className)}
    />
  );
};

/**
 * The muted line under a section's heading.
 *
 * @internal
 */
export const SectionDescription = ({
  id,
  children,
}: {
  id?: string;
  children: ReactNode;
}) =>
  hasContent(children) ? (
    <p id={id} data-slot="description" className={sectionDescription}>
      {children}
    </p>
  ) : null;

/**
 * A section's box: its padding and the room between its header and content,
 * the same for every Section and Accordion item.
 *
 * @internal
 */
export const SectionFrame = ({
  className,
  ...props
}: ComponentProps<'section'>) => (
  // Unnamed, so not a landmark: headings already outline the page.
  <section
    {...props}
    data-slot="section"
    className={classNames('flex-col-gap-5 p-5', className)}
  />
);

/**
 * A section's heading, with its description 4px under it and its actions at
 * the end.
 *
 * @internal
 */
export const SectionHeader = ({
  heading,
  description,
  descriptionId,
  action,
}: {
  heading: ReactNode;
  description?: ReactNode;
  descriptionId?: string;
  action?: ReactNode;
}) => (
  <div data-slot="header" className="flex-row-gap-4 items-start">
    <div className="flex-col-gap-1 flex-fill-x">
      {heading}
      <SectionDescription id={descriptionId}>{description}</SectionDescription>
    </div>
    {hasContent(action) && (
      <div
        data-slot="header-actions"
        className="flex-row-gap-2 items-center shrink-0"
      >
        {action}
      </div>
    )}
  </div>
);

/**
 * A section's content, whose sections are a level deeper.
 *
 * @internal
 */
export const SectionContent = ({
  level,
  children,
}: {
  level: HeadingLevel;
  children: ReactNode;
}) => (
  // Takes the height left in a section given one, so a FlexScrollArea in it
  // scrolls.
  <div data-slot="content" className="flex-col-gap-4 flex-fill-y">
    <HeadingLevelContext value={level}>{children}</HeadingLevelContext>
  </div>
);

/**
 * A titled part of a page: a heading, an optional muted description, then its
 * content, with the same sizes and spacing everywhere. A section inside a
 * section gets the next heading level. One that opens and closes is a
 * Collapsible, several are an Accordion.
 *
 * @invalidAlternative section
 */
export const Section = ({
  title,
  titleId,
  headingAs,
  description,
  headerAction,
  leftIcon,
  rightIcon,
  leftAddOn,
  rightAddOn,
  className,
  children,
  ...props
}: SectionProps) => {
  const nestedLevel = useSectionLevel();
  const level = headingAs
    ? (Number(headingAs.slice(1)) as HeadingLevel)
    : nestedLevel;

  const { leftSlot, rightSlot } = useIconAddon({
    leftIcon,
    rightIcon,
    leftAddOn,
    rightAddOn,
  });

  return (
    <SectionFrame {...props} className={className}>
      <SectionHeader
        heading={
          <SectionHeading level={level} id={titleId} className={sectionTitle}>
            {leftSlot}
            <span className="min-w-0">{title}</span>
            {rightSlot}
          </SectionHeading>
        }
        description={description}
        action={headerAction}
      />
      {hasContent(children) && (
        <SectionContent level={level}>{children}</SectionContent>
      )}
    </SectionFrame>
  );
};
