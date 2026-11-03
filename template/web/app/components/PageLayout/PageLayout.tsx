'use client';

import { classNames } from '@packages/styles/classNames';
import { tokens } from '@packages/styles/tokens.css';
import { FlexScrollArea } from '@packages/ui/ScrollArea';
import { sectionGroup } from '@packages/ui/Section';
import { SidebarMenu } from '@packages/ui/SidebarMenu';
import { assignInlineVars, setElementVars } from '@vanilla-extract/dynamic';
import React, { useLayoutEffect, useRef } from 'react';

import * as styles from './PageLayout.css';

import type {
  PageLayoutConfig,
  PageLayoutProps,
  SpacingKey,
} from './PageLayout.types';

const space = (key: SpacingKey) =>
  (tokens.spacing as Record<string, string>)[key] ?? '0px';
const px = (value: number) => `${value}px`;
// Data attributes take a boolean as present or absent.
const flag = (on: boolean) => (on ? '' : undefined);

/** The grid's areas, columns and rows: the sidebar beside the main region, the header and footer above and below it. */
export function frameGrid(layout: PageLayoutConfig) {
  const fullWidth = layout.docksFirst === 'header';

  const sidebars = ([['sidebar', layout.sidebar]] as const).filter(
    ([, sidebar]) => sidebar.needed,
  );
  const left = sidebars.filter(([, sidebar]) => sidebar.side === 'left');
  const right = sidebars.filter(([, sidebar]) => sidebar.side === 'right');

  const stack = [
    layout.header.needed && 'header',
    'main',
    layout.footer.needed && 'footer',
  ].filter((area): area is string => Boolean(area));

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

/**
 * A frame from the theme's page layout: header, sidebar and footer around
 * the page's container. The layout's sizes, sticking and separations are its
 * own; the slots hold only what sits in each bar. The sidebar is a
 * SidebarMenu: `sidebar` holds its rows, `sidebarHeader` and `sidebarFooter`
 * what stays fixed above and below them.
 *
 * @invalidAlternative main
 */
export const PageLayout = ({
  layout,
  scrollMain = false,
  header,
  sidebarHeader,
  sidebar,
  sidebarFooter,
  footer,
  children,
}: PageLayoutProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  const grid = frameGrid(layout);
  const { main } = layout;
  const overlay = layout.header.needed && layout.header.overlay;

  const container = (
    <div
      data-ds=""
      data-slot="container"
      data-container={main.container}
      data-separation={main.separation}
      // The theme's section gap spaces the page's sections, as a group's does.
      className={classNames(sectionGroup, styles.container)}
      style={assignInlineVars({
        [styles.maxWidth]: px(main.maxWidthPx),
        [styles.sectionGap]: space(main.sectionGap),
      })}
    >
      {children}
    </div>
  );

  // Nothing outside the main region scrolls when it scrolls on its own, so nothing needs to stick.
  const sticky = (on: boolean) => !scrollMain && on;

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
      data-scroll-main={flag(scrollMain)}
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
          data-sticky={flag(sticky(layout.header.sticky))}
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
        <SidebarMenu
          aria-label="Sidebar"
          header={sidebarHeader}
          footer={sidebarFooter}
          data-side={layout.sidebar.side}
          data-separation={layout.sidebar.separation}
          className={styles.sidebar}
          style={{ gridArea: 'sidebar' }}
        >
          {sidebar}
        </SidebarMenu>
      )}
      <main
        data-ds=""
        data-panel={flag(main.separation !== 'none')}
        className={classNames(styles.main, scrollMain && 'flex-col-gap-0')}
        style={assignInlineVars({ [styles.padding]: space(main.padding) })}
      >
        {scrollMain ? (
          <FlexScrollArea
            // The page keeps the region's width: wide content, like a table, scrolls sideways itself.
            orientation="vertical"
            className="flex-fill-y"
          >
            {container}
          </FlexScrollArea>
        ) : (
          container
        )}
      </main>
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
