'use client';

import { classNames } from '@packages/styles/classNames';
import { tokens } from '@packages/styles/tokens.css';
import { assignInlineVars, setElementVars } from '@vanilla-extract/dynamic';
import React, { useLayoutEffect, useRef } from 'react';

import * as styles from './PageLayout.css';

import type {
  BleedProps,
  PageLayoutConfig,
  PageLayoutProps,
  PageSidebar,
  SpacingKey,
} from './PageLayout.types';

const space = (key: SpacingKey) =>
  (tokens.spacing as Record<string, string>)[key] ?? '0px';
const px = (value: number) => `${value}px`;
// Data attributes take a boolean as present or absent.
const flag = (on: boolean) => (on ? '' : undefined);

/** The grid's areas, columns and rows: the sidebars beside the main region, the header and footer above and below it. */
export function frameGrid(layout: PageLayoutConfig) {
  const sidebars = (
    [
      ['sidebar', layout.sidebar],
      ['extra', layout.extraSidebar],
    ] as const
  ).filter(([, sidebar]) => sidebar.needed);
  const left = sidebars.filter(([, sidebar]) => sidebar.side === 'left');
  const right = sidebars.filter(([, sidebar]) => sidebar.side === 'right');
  const stack = [
    layout.header.needed && 'header',
    'main',
    layout.footer.needed && 'footer',
  ].filter((area): area is string => Boolean(area));
  const fullWidth = layout.docksFirst === 'header';
  const row = (area: string) =>
    area === 'main' || !fullWidth
      ? [...left.map(([name]) => name), area, ...right.map(([name]) => name)]
      : [...left, [area], ...right].map(() => area);
  return {
    areas: stack.map((area) => `"${row(area).join(' ')}"`).join(' '),
    columns: [
      ...left.map(([, sidebar]) => px(sidebar.widthPx)),
      'minmax(0, 1fr)',
      ...right.map(([, sidebar]) => px(sidebar.widthPx)),
    ].join(' '),
    rows: stack.map((area) => (area === 'main' ? '1fr' : 'auto')).join(' '),
  };
}

const Sidebar = ({
  area,
  label,
  sidebar,
  underHeader,
  children,
}: {
  area: string;
  label: string;
  sidebar: PageSidebar;
  underHeader: boolean;
  children: React.ReactNode;
}) => (
  <aside
    aria-label={label}
    data-ds=""
    data-side={sidebar.side}
    data-sticky={flag(sidebar.sticky)}
    data-under-header={flag(underHeader)}
    data-separation={sidebar.separation}
    className={styles.sidebar}
    style={{
      gridArea: area,
      ...assignInlineVars({
        [styles.width]: px(sidebar.widthPx),
        [styles.padding]: space(sidebar.padding),
        [styles.gap]: space(sidebar.gap),
      }),
    }}
  >
    {children}
  </aside>
);

/**
 * A frame from the theme's page layout: header, sidebars and footer around
 * the page's container. The layout's sizes, sticking and separations are its
 * own; the slots hold only what sits in each bar.
 *
 * @invalidAlternative main
 */
export const PageLayout = ({
  layout,
  header,
  sidebar,
  extraSidebar,
  footer,
  children,
}: PageLayoutProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const grid = frameGrid(layout);
  const { main } = layout;
  const overlay = layout.header.needed && layout.header.overlay;
  // A sticky sidebar starts under the header only when the header spans it and stays in view.
  const underHeader =
    layout.header.needed &&
    layout.header.sticky &&
    layout.docksFirst === 'header';

  // A header sized by its content has a height only once rendered.
  useLayoutEffect(() => {
    const element = headerRef.current;
    const root = rootRef.current;
    if (!element || !root) return;
    const observer = new ResizeObserver(() =>
      setElementVars(root, {
        [styles.headerHeight]: px(element.offsetHeight),
      }),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={rootRef}
      data-ds=""
      data-overlay={flag(overlay)}
      className={styles.root}
      style={assignInlineVars({
        [styles.areas]: grid.areas,
        [styles.columns]: grid.columns,
        [styles.rows]: grid.rows,
        [styles.headerHeight]: px(
          layout.header.needed ? layout.header.heightPx : 0,
        ),
      })}
    >
      {layout.header.needed && (
        <header
          ref={headerRef}
          data-ds=""
          data-sticky={flag(layout.header.sticky)}
          data-overlay={flag(overlay)}
          data-separation={layout.header.separation}
          className={styles.header}
          style={assignInlineVars({
            [styles.barHeight]: px(layout.header.heightPx),
            [styles.barPadding]: layout.header.heightPx
              ? '0px'
              : space(layout.header.padding),
            [styles.padding]: space(layout.header.padding),
            [styles.gap]: space(layout.header.gap),
          })}
        >
          {header}
        </header>
      )}
      {layout.sidebar.needed && (
        <Sidebar
          area="sidebar"
          label="Sidebar"
          sidebar={layout.sidebar}
          underHeader={underHeader}
        >
          {sidebar}
        </Sidebar>
      )}
      <main
        data-ds=""
        data-panel={flag(main.separation !== 'none')}
        className={styles.main}
        style={assignInlineVars({ [styles.padding]: space(main.padding) })}
      >
        <div
          data-ds=""
          data-slot="container"
          data-container={main.container}
          data-separation={main.separation}
          className={styles.container}
          style={assignInlineVars({
            [styles.maxWidth]: px(main.maxWidthPx),
            [styles.sectionGap]: space(main.sectionGap),
          })}
        >
          {children}
        </div>
      </main>
      {layout.extraSidebar.needed && (
        <Sidebar
          area="extra"
          label="Secondary sidebar"
          sidebar={layout.extraSidebar}
          underHeader={underHeader}
        >
          {extraSidebar}
        </Sidebar>
      )}
      {layout.footer.needed && (
        <footer
          data-ds=""
          data-separation={layout.footer.separation}
          className={styles.footer}
          style={assignInlineVars({
            [styles.barHeight]: px(layout.footer.heightPx),
            [styles.barPadding]: layout.footer.heightPx
              ? '0px'
              : space(layout.footer.padding),
            [styles.padding]: space(layout.footer.padding),
            [styles.gap]: space(layout.footer.gap),
          })}
        >
          {footer}
        </footer>
      )}
    </div>
  );
};

/** A band whose background runs the full width of the main region while its content stays in the container. */
export const Bleed = ({ className, children }: BleedProps) => (
  <div data-ds="" className={classNames(styles.bleed, className)}>
    {children}
  </div>
);
