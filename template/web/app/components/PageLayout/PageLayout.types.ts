import type { tokens } from '@packages/styles/tokens.css';

import type { ReactNode } from 'react';

/** A spacing token key: '4' is 16px. */
export type SpacingKey = `${keyof typeof tokens.spacing}`;

/** How a region sets off from the content: the frame background, a divider line, a shadow, or nothing. */
export type Separation = 'background' | 'divider' | 'shadow' | 'none';

/** A header or footer. `start`, `center` and `end` say what its component shows there; "" for nothing. */
export type PageBar = {
  needed: boolean;
  start: string;
  center: string;
  end: string;
  /** 0 sizes it to its content. */
  heightPx: number;
  padding: SpacingKey;
  gap: SpacingKey;
  separation: Separation;
};

/** A sidebar. `top` and `bottom` say what its component shows there; "" for nothing. */
export type PageSidebar = {
  needed: boolean;
  side: 'left' | 'right';
  top: string;
  bottom: string;
  widthPx: number;
  /** Stays in view while the content scrolls. */
  sticky: boolean;
  padding: SpacingKey;
  gap: SpacingKey;
  separation: Separation;
};

/** A page layout as the theme writes it in `layouts.app` and `layouts.marketing`. */
export type PageLayoutConfig = {
  /** header: the header and footer span the full width; sidebars: the sidebar runs the full height. */
  docksFirst: 'header' | 'sidebars';
  header: PageBar & {
    /** Stays in view while the page scrolls. */
    sticky: boolean;
    /** Lies over the first section instead of above it. */
    overlay: boolean;
  };
  sidebar: PageSidebar;
  footer: PageBar;
  main: {
    /** fluid fills the space the frame leaves; fixed stops at `maxWidthPx`, centered. */
    container: 'fluid' | 'fixed';
    maxWidthPx: number;
    /** The page padding around the content. */
    padding: SpacingKey;
    /** For the page's own sections; the container lays out nothing by it. */
    align: 'start' | 'center';
    /** The gap between the page's sections. */
    sectionGap: SpacingKey;
    /** How the content area sets off from the frame: a panel background, a border, a shadow, or nothing. */
    separation: Separation;
  };
};

export type PageLayoutProps = {
  layout: PageLayoutConfig;
  /** The main region scrolls on its own while the frame around it stays in place, as in the app layout; otherwise the page scrolls. */
  scrollMain?: boolean;
  /** The header's content, laid out in a row; rendered when `layout.header.needed`. */
  header?: ReactNode;
  /** The sidebar's content, laid out in a column; rendered when `layout.sidebar.needed`. */
  sidebar?: ReactNode;
  footer?: ReactNode;
  /** The page: its sections, as the container's children. */
  children: ReactNode;
};

export type BleedProps = {
  className?: string;
  children: ReactNode;
};
