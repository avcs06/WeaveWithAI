import type { tokens } from '@packages/styles/tokens.css';

import type { ReactNode } from 'react';

/** A spacing token key: '4' is 16px. */
export type SpacingKey = `${keyof typeof tokens.spacing}`;

/** How a region sets off from the content: the frame background, a divider line, a shadow, or nothing. */
export type Separation = 'background' | 'divider' | 'shadow' | 'none';

/** A header. `start`, `center` and `end` say what its component shows there; "" for nothing. Its padding is fixed. */
export type PageBar = {
  needed: boolean;
  start: string;
  center: string;
  end: string;
  gap: SpacingKey;
  separation: Separation;
};

type PageFooterSpacing = {
  needed: boolean;
  /** Around its items: its height is its items and this padding. */
  padding: SpacingKey;
  gap: SpacingKey;
  separation: Separation;
};

/**
 * A footer, which never holds the logo or the account. An app's is one row:
 * `start`, `center` and `end` say what its component shows there. A site's
 * `content` says what it holds, on one or several lines. "" for nothing.
 */
export type PageFooter = PageFooterSpacing &
  ({ start: string; center: string; end: string } | { content: string });

/** A sidebar, a menu with the menu's spacing. `top`, `items` and `bottom` say what sits fixed above, in the rows and fixed below; "" for nothing. */
export type PageSidebar = {
  needed: boolean;
  side: 'left' | 'right';
  top: string;
  items: string;
  bottom: string;
  widthPx: number;
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
  footer: PageFooter;
  main: {
    /** fluid fills the space the frame leaves; fixed stops at `maxWidthPx`, centered. */
    container: 'fluid' | 'fixed';
    maxWidthPx: number;
    /** The page padding around the content. */
    padding: SpacingKey;
    /** For the page's own sections; the container lays out nothing by it. */
    align: 'start' | 'center';
    /** How the content area sets off from the frame: a panel background, a border, a shadow, or nothing. */
    separation: Separation;
  };
  /** Where the scaffold placed the app's logo. */
  logo: 'header' | 'sidebar';
  /** Where the account menu sits; none for a site without accounts. */
  account: 'header' | 'sidebar' | 'none';
};

export type PageLayoutProps = {
  layout: PageLayoutConfig;
  /**
   * `app`: the frame stays in place, the main region scrolls on its own, and
   * sections sit 24px apart. `marketing`: the page scrolls, and sections sit
   * 36px apart.
   */
  kind: 'app' | 'marketing';
  /** The header's left end, such as the logo; the header renders when `layout.header.needed`. */
  headerLeft?: ReactNode;
  /** The header's center, such as the navigation. */
  header?: ReactNode;
  /** The header's right end, such as the account. */
  headerRight?: ReactNode;
  /** Fixed above the sidebar's rows, such as a Create button. */
  sidebarHeader?: ReactNode;
  /** The sidebar's rows, SidebarMenuItems; rendered when `layout.sidebar.needed`. */
  sidebar?: ReactNode;
  /** Fixed below the sidebar's rows, such as the account. */
  sidebarFooter?: ReactNode;
  footer?: ReactNode;
  /** The page: its sections, as the container's children. */
  children: ReactNode;
};

