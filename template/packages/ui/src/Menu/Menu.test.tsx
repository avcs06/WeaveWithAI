import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link } from 'lucide-react';
import React, { createRef } from 'react';

import { axe, renderUI } from '../test-utils';

import { Menu, MenuGroup, MenuItem, MenuLabel, MenuSeparator } from './Menu';

// jsdom has no layout: give the label's text and box widths so the row can
// tell whether its label is cut. `useTruncation` reads the box width only from
// the ResizeObserver entry's `contentRect` (padding already out), and the
// shared observer is created once per module: the mock must be in place before
// the first render and read the current sizes on every observation.
const sizes = { text: 0, box: 0 };

const contentWidthFor = (element: Element) => {
  const style = getComputedStyle(element as HTMLElement);
  const padding =
    (parseFloat(style.paddingLeft) || 0) +
    (parseFloat(style.paddingRight) || 0);
  return sizes.box - padding;
};

class MeasuringResizeObserver {
  constructor(private callback: ResizeObserverCallback) {}
  observe(target: Element) {
    queueMicrotask(() =>
      act(() =>
        this.callback(
          [
            {
              target,
              contentRect: { width: contentWidthFor(target) },
            } as ResizeObserverEntry,
          ],
          this as unknown as ResizeObserver,
        ),
      ),
    );
  }
  unobserve() {
    return undefined;
  }
  disconnect() {
    return undefined;
  }
}
globalThis.ResizeObserver =
  MeasuringResizeObserver as unknown as typeof ResizeObserver;

const layout = (textWidth: number, boxWidth: number) => {
  sizes.text = textWidth;
  sizes.box = boxWidth;
  Range.prototype.getBoundingClientRect = () =>
    ({ width: sizes.text }) as DOMRect;
};

// The ResizeObserver stub reports the first size in a microtask.
const measured = () => act(async () => undefined);

// The shown tooltip is `aria-hidden` (the trigger's description says it), so
// role queries must include hidden elements.
const findTooltip = () => screen.findByRole('tooltip', { hidden: true });
const queryTooltip = () => screen.queryByRole('tooltip', { hidden: true });

const tooltipEntries = async () => {
  await findTooltip();
  return Array.from(
    document.querySelectorAll('[data-side] > div'),
    (entry) => entry.textContent,
  );
};

const slot = (element: Element, name: string) =>
  element.querySelector(`[data-slot="${name}"]`);

const item = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-slot="item"]')!;

describe('Menu', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    // @ts-expect-error jsdom has none; tests add one.
    delete Range.prototype.getBoundingClientRect;
  });

  it('is a shell around a list that holds the content', async () => {
    const { container } = renderUI(
      <Menu aria-label="Actions" data-testid="menu">
        <MenuItem>Rename</MenuItem>
      </Menu>,
    );
    const list = slot(screen.getByTestId('menu'), 'list');
    expect(list).toContainElement(screen.getByText('Rename'));
    expect(await axe(container)).toHaveNoViolations();
  });

  it('caps its height at availableHeight, kept beside its own style', () => {
    renderUI(
      <Menu data-testid="menu" availableHeight="200px" style={{ top: 0 }} />,
    );
    const style = screen.getByTestId('menu').getAttribute('style');
    expect(style).toMatch(/--menuAvailableHeight[^:]*: 200px/);
    expect(style).toContain('top: 0');
  });

  it('without a header, the shell itself carries the role, name and busy state', async () => {
    const { container } = renderUI(
      <Menu
        role="menu"
        id="actions-menu"
        aria-label="Actions"
        aria-orientation="vertical"
        loading
      >
        <MenuItem role="menuitem">Rename</MenuItem>
      </Menu>,
    );
    const menu = screen.getByRole('menu', { name: 'Actions' });
    expect(menu).toHaveAttribute('id', 'actions-menu');
    expect(menu).toHaveAttribute('aria-orientation', 'vertical');
    expect(menu).toHaveAttribute('aria-busy', 'true');
    const list = slot(menu, 'list')!;
    expect(list).not.toHaveAttribute('role');
    expect(list).not.toHaveAttribute('aria-busy');
    expect(list).toContainElement(
      screen.getByRole('menuitem', { name: 'Rename' }),
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('not loading: no aria-busy', () => {
    renderUI(
      <Menu role="menu" aria-label="Actions">
        <MenuItem role="menuitem">Rename</MenuItem>
      </Menu>,
    );
    expect(screen.getByRole('menu', { name: 'Actions' })).not.toHaveAttribute(
      'aria-busy',
    );
  });

  it('with a header, the role, id, name and busy state move to the list, outside the header', async () => {
    const { container } = renderUI(
      <Menu
        role="listbox"
        id="countries"
        aria-label="Countries"
        data-testid="menu"
        loading
        header={<input type="search" aria-label="Search countries" />}
      >
        <MenuItem role="option" selected={false}>
          Chile
        </MenuItem>
      </Menu>,
    );
    const shell = screen.getByTestId('menu');
    expect(shell).not.toHaveAttribute('role');
    expect(shell).not.toHaveAttribute('id', 'countries');
    expect(shell).not.toHaveAttribute('aria-busy');
    // A menu can't hold a field: the search sits above, the list holds rows.
    const listbox = screen.getByRole('listbox', { name: 'Countries' });
    expect(listbox).toHaveAttribute('id', 'countries');
    expect(listbox).toHaveAttribute('aria-busy', 'true');
    expect(listbox).toContainElement(
      screen.getByRole('option', { name: 'Chile' }),
    );
    expect(listbox).not.toContainElement(
      screen.getByRole('searchbox', { name: 'Search countries' }),
    );
    expect(shell).toContainElement(
      screen.getByRole('searchbox', { name: 'Search countries' }),
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('forwards refs and props to every part', () => {
    const refs = {
      menu: createRef<HTMLDivElement>(),
      item: createRef<HTMLDivElement>(),
      group: createRef<HTMLDivElement>(),
      label: createRef<HTMLDivElement>(),
      separator: createRef<HTMLDivElement>(),
    };
    renderUI(
      <Menu ref={refs.menu} id="menu">
        <MenuGroup ref={refs.group} id="group">
          <MenuLabel ref={refs.label} id="label">
            Links
          </MenuLabel>
          <MenuItem ref={refs.item} id="item">
            Copy link
          </MenuItem>
        </MenuGroup>
        <MenuSeparator ref={refs.separator} id="separator" />
      </Menu>,
    );
    for (const [name, ref] of Object.entries(refs))
      expect(ref.current).toHaveAttribute('id', name);
    expect(refs.group.current).toHaveAttribute('data-slot', 'group');
    expect(refs.label.current).toHaveAttribute('data-slot', 'group-label');
    expect(refs.separator.current).toHaveAttribute('data-slot', 'separator');
  });

  it('a group can be named by its label through plain ids', async () => {
    const { container } = renderUI(
      <Menu role="menu" aria-label="Actions">
        <MenuGroup role="group" aria-labelledby="edit-label">
          <MenuLabel id="edit-label">Edit</MenuLabel>
          <MenuItem role="menuitem">Rename</MenuItem>
        </MenuGroup>
      </Menu>,
    );
    expect(screen.getByRole('group', { name: 'Edit' })).toContainElement(
      screen.getByRole('menuitem', { name: 'Rename' }),
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  describe('MenuItem', () => {
    it('puts the icon, the label, the add-on, then the check in their slots', async () => {
      const { container } = renderUI(
        <MenuItem
          leftIcon={<Link data-testid="icon" />}
          rightAddOn={<kbd>⌘L</kbd>}
          selected
        >
          Copy link
        </MenuItem>,
      );
      const row = item(container);
      expect(row).toHaveAttribute('data-selected');
      expect(
        Array.from(row.children, (part) => part.getAttribute('data-slot')),
      ).toEqual(['icon', 'label', 'add-on', 'check']);
      expect(slot(row, 'label')).toHaveTextContent('Copy link');
      expect(await axe(container)).toHaveNoViolations();
    });

    it('nested: the chevron at the end, after the check', () => {
      const { container } = renderUI(
        <MenuItem selected nested>
          Share
        </MenuItem>,
      );
      const row = item(container);
      expect(row.lastElementChild).toHaveAttribute('data-slot', 'chevron');
      expect(row.lastElementChild?.previousElementSibling).toHaveAttribute(
        'data-slot',
        'check',
      );
    });

    it('not nested and not selected: no chevron, no check, no data-selected', () => {
      const { container } = renderUI(<MenuItem>Rename</MenuItem>);
      const row = item(container);
      expect(row).not.toHaveAttribute('data-selected');
      expect(slot(row, 'chevron')).toBeNull();
      expect(slot(row, 'check')).toBeNull();
      expect(slot(row, 'checkbox')).toBeNull();
    });

    it('checkmark={false}: no check at the end, still data-selected', () => {
      const { container } = renderUI(
        <MenuItem selected checkmark={false} nested>
          Share
        </MenuItem>,
      );
      const row = item(container);
      expect(row).toHaveAttribute('data-selected');
      expect(slot(row, 'check')).toBeNull();
      expect(row.lastElementChild).toHaveAttribute('data-slot', 'chevron');
    });

    it('`selected` lands in the attribute the row’s role has', async () => {
      const { container } = renderUI(
        <>
          <div role="listbox" aria-label="Countries">
            <MenuItem role="option" selected>
              Chile
            </MenuItem>
            <MenuItem role="option" selected={false}>
              Peru
            </MenuItem>
          </div>
          <div role="menu" aria-label="View">
            <MenuItem role="menuitemradio" selected>
              Newest first
            </MenuItem>
            <MenuItem role="menuitemradio" selected={false}>
              Oldest first
            </MenuItem>
            <MenuItem role="menuitemcheckbox" selected>
              Show archived
            </MenuItem>
            <MenuItem role="menuitem" selected>
              Current view
            </MenuItem>
            <MenuItem role="menuitem" selected={false}>
              Other view
            </MenuItem>
            <MenuItem role="menuitem">Rename</MenuItem>
          </div>
        </>,
      );
      const chile = screen.getByRole('option', { name: 'Chile' });
      expect(chile).toHaveAttribute('aria-selected', 'true');
      expect(chile).not.toHaveAttribute('aria-checked');
      expect(chile).not.toHaveAttribute('aria-current');
      expect(screen.getByRole('option', { name: 'Peru' })).toHaveAttribute(
        'aria-selected',
        'false',
      );
      expect(
        screen.getByRole('menuitemradio', { name: 'Newest first' }),
      ).toHaveAttribute('aria-checked', 'true');
      expect(
        screen.getByRole('menuitemradio', { name: 'Oldest first' }),
      ).toHaveAttribute('aria-checked', 'false');
      expect(
        screen.getByRole('menuitemcheckbox', { name: 'Show archived' }),
      ).toHaveAttribute('aria-checked', 'true');
      // A menuitem has no checked state: the chosen one is the current one.
      const current = screen.getByRole('menuitem', { name: 'Current view' });
      expect(current).toHaveAttribute('aria-current', 'true');
      expect(current).not.toHaveAttribute('aria-selected');
      expect(current).not.toHaveAttribute('aria-checked');
      expect(
        screen.getByRole('menuitem', { name: 'Other view' }),
      ).not.toHaveAttribute('aria-current');
      const plain = screen.getByRole('menuitem', { name: 'Rename' });
      expect(plain).not.toHaveAttribute('aria-current');
      expect(plain).not.toHaveAttribute('data-selected');
      expect(await axe(container)).toHaveNoViolations();
    });

    it('with no role, `selected` is presentational only: data-selected and the check', async () => {
      const { container } = renderUI(<MenuItem selected>Chile</MenuItem>);
      const row = item(container);
      expect(row).not.toHaveAttribute('role');
      expect(row).not.toHaveAttribute('aria-selected');
      expect(row).not.toHaveAttribute('aria-checked');
      expect(row).not.toHaveAttribute('aria-current');
      expect(row).toHaveAttribute('data-selected');
      expect(slot(row, 'check')).not.toBeNull();
      expect(await axe(container)).toHaveNoViolations();
    });

    it('checkbox: a presentational box first, ticked only when selected', async () => {
      const { container } = renderUI(
        <div role="listbox" aria-label="Countries">
          <MenuItem role="option" checkbox selected>
            Chile
          </MenuItem>
          <MenuItem role="option" checkbox selected={false}>
            Peru
          </MenuItem>
          <MenuItem role="option" checkbox>
            Bolivia
          </MenuItem>
        </div>,
      );
      const [chile, peru, bolivia] = screen.getAllByRole('option');
      const ticked = slot(chile, 'checkbox')!;
      expect(chile.firstElementChild).toBe(ticked);
      expect(ticked).toHaveAttribute('data-state', 'checked');
      expect(ticked).toHaveAttribute('aria-hidden', 'true');
      expect(ticked.querySelector('svg')).not.toBeNull();
      const unticked = slot(peru, 'checkbox')!;
      expect(unticked).toHaveAttribute('data-state', 'unchecked');
      expect(unticked.querySelector('svg')).toBeNull();
      // No checked state to show: no box at all.
      expect(slot(bolivia, 'checkbox')).toBeNull();
      expect(chile).toHaveAttribute('aria-selected', 'true');
      expect(await axe(container)).toHaveNoViolations();
    });

    it('loading: busy, the spinner in the left icon’s place, or the only right icon’s', async () => {
      const { container } = renderUI(
        <>
          <MenuItem loading leftIcon={<Link data-testid="left" />}>
            Renaming
          </MenuItem>
          <MenuItem loading rightIcon={<Link data-testid="right" />}>
            Moving
          </MenuItem>
        </>,
      );
      const [renaming, moving] = Array.from(
        container.querySelectorAll('[data-slot="item"]'),
      );
      expect(renaming).toHaveAttribute('aria-busy', 'true');
      expect(moving).toHaveAttribute('aria-busy', 'true');
      expect(screen.queryByTestId('left')).toBeNull();
      expect(renaming.firstElementChild).toHaveClass('animate-spin');
      expect(screen.queryByTestId('right')).toBeNull();
      expect(moving.lastElementChild).toHaveClass('animate-spin');
      expect(await axe(container)).toHaveNoViolations();
    });

    it('loading with both icons: the spinner takes the left one’s place, the right stays', () => {
      const { container } = renderUI(
        <MenuItem
          loading
          leftIcon={<Link data-testid="left" />}
          rightIcon={<Link data-testid="right" />}
        >
          Renaming
        </MenuItem>,
      );
      const row = item(container);
      expect(screen.queryByTestId('left')).toBeNull();
      expect(row.firstElementChild).toHaveClass('animate-spin');
      expect(screen.getByTestId('right')).toBe(row.lastElementChild);
    });

    it('loading with no icons: the spinner leads; not loading: no aria-busy, no spinner', async () => {
      const { container } = renderUI(
        <>
          <MenuItem loading>Syncing</MenuItem>
          <MenuItem>Rename</MenuItem>
        </>,
      );
      const [syncing, rename] = Array.from(
        container.querySelectorAll('[data-slot="item"]'),
      );
      expect(syncing.firstElementChild).toHaveClass('animate-spin');
      expect(rename).not.toHaveAttribute('aria-busy');
      expect(rename.querySelector('.animate-spin')).toBeNull();
      expect(await axe(container)).toHaveNoViolations();
    });

    it('an icon wins over an add-on on the same side', () => {
      const { container } = renderUI(
        <>
          <MenuItem leftIcon={<Link />} leftAddOn={<kbd>A</kbd>}>
            Copy link
          </MenuItem>
          <MenuItem rightIcon={<Link />} rightAddOn={<kbd>B</kbd>}>
            Duplicate
          </MenuItem>
        </>,
      );
      expect(container.querySelectorAll('[data-slot="add-on"]')).toHaveLength(
        0,
      );
      expect(container.querySelectorAll('[data-slot="icon"]')).toHaveLength(2);
    });

    it('icons, the check and the chevron are decoration: the label alone names the row', async () => {
      const { container } = renderUI(
        <div role="menu" aria-label="Share">
          <MenuItem
            role="menuitem"
            leftIcon={<Link />}
            rightIcon={<Link />}
            selected
            nested
          >
            Share
          </MenuItem>
        </div>,
      );
      const row = screen.getByRole('menuitem', { name: 'Share' });
      expect(row).toHaveAccessibleName('Share');
      for (const part of Array.from(
        row.querySelectorAll(
          '[data-slot="icon"], [data-slot="check"], [data-slot="chevron"]',
        ),
      ))
        expect(part).toHaveAttribute('aria-hidden', 'true');
      expect(await axe(container)).toHaveNoViolations();
    });

    it('has no behavior of its own: out of the tab order, arrows do nothing', async () => {
      const { container } = renderUI(
        <>
          <button type="button">Before</button>
          <Menu>
            <MenuItem leftIcon={<Link />}>Rename</MenuItem>
            <MenuItem selected nested>
              Share
            </MenuItem>
          </Menu>
          <button type="button">After</button>
        </>,
      );
      for (const row of Array.from(
        container.querySelectorAll('[data-slot="item"]'),
      ))
        expect(row).not.toHaveAttribute('tabindex');
      await userEvent.tab();
      expect(screen.getByRole('button', { name: 'Before' })).toHaveFocus();
      await userEvent.keyboard('{ArrowDown}');
      expect(screen.getByRole('button', { name: 'Before' })).toHaveFocus();
      await userEvent.tab();
      expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
      await userEvent.tab({ shift: true });
      expect(screen.getByRole('button', { name: 'Before' })).toHaveFocus();
      expect(await axe(container)).toHaveNoViolations();
    });

    it('a caller’s own description and props survive beside the tooltip’s', async () => {
      const { container } = renderUI(
        <div role="menu" aria-label="Actions">
          <MenuItem
            role="menuitem"
            id="rename-row"
            aria-describedby="caller-note"
            aria-disabled
            tooltip="Only owners can rename"
          >
            Rename
          </MenuItem>
          <span id="caller-note" hidden>
            Renames the document
          </span>
        </div>,
      );
      const row = screen.getByRole('menuitem', { name: 'Rename' });
      expect(row).toHaveAttribute('id', 'rename-row');
      expect(row).toHaveAttribute('aria-disabled', 'true');
      const describedBy = row.getAttribute('aria-describedby')!.split(' ');
      expect(describedBy[0]).toBe('caller-note');
      expect(describedBy).toHaveLength(2);
      expect(row).toHaveAccessibleDescription(
        'Renames the document Only owners can rename',
      );
      expect(await axe(container)).toHaveNoViolations();
    });

    it('the tooltip describes the row before any hover, for screen readers', async () => {
      const { container } = renderUI(
        <MenuItem tooltip="Only owners can rename">Rename</MenuItem>,
      );
      const row = item(container);
      expect(queryTooltip()).toBeNull();
      expect(row).toHaveAccessibleDescription('Only owners can rename');
      await userEvent.hover(screen.getByText('Rename'));
      expect(await tooltipEntries()).toEqual(['Only owners can rename']);
      expect(await axe(document.body)).toHaveNoViolations();
    });

    it('a cut label shows in full on hover, before the tooltip', async () => {
      layout(400, 100);
      const { container } = renderUI(
        <MenuItem tooltip="Only owners can rename">
          Rename the quarterly planning document
        </MenuItem>,
      );
      await measured();
      const row = item(container);
      // Screen readers hear the reason, not the cut label repeated.
      expect(row).toHaveAccessibleDescription('Only owners can rename');
      await userEvent.hover(screen.getByText(/Rename the quarterly/));
      expect(await tooltipEntries()).toEqual([
        'Rename the quarterly planning document',
        'Only owners can rename',
      ]);
      expect(await axe(document.body)).toHaveNoViolations();
    });

    it('a cut label with no tooltip: the full label alone, and no description', async () => {
      layout(400, 100);
      const { container } = renderUI(
        <MenuItem>Rename the quarterly planning document</MenuItem>,
      );
      await measured();
      const row = item(container);
      expect(row).not.toHaveAttribute('aria-describedby');
      await userEvent.hover(row);
      expect((await findTooltip()).textContent).toBe(
        'Rename the quarterly planning document',
      );
      expect(row).not.toHaveAttribute('aria-describedby');
      expect(await axe(document.body)).toHaveNoViolations();
    });

    it('when the label fits, the tooltip stands alone; with neither, nothing shows', async () => {
      layout(50, 100);
      renderUI(
        <>
          <MenuItem tooltip="Only owners can rename">Rename</MenuItem>
          <MenuItem>Duplicate</MenuItem>
        </>,
      );
      await measured();
      await userEvent.hover(screen.getByText('Rename'));
      expect(await tooltipEntries()).toEqual(['Only owners can rename']);
      await userEvent.keyboard('{Escape}');
      expect(queryTooltip()).toBeNull();
      await userEvent.hover(screen.getByText('Duplicate'));
      // Radix opens after a timer: wait past it to assert nothing opened.
      await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
      expect(queryTooltip()).toBeNull();
    });

    it('keyboard focus on a focusable row shows the cut label; Escape closes it', async () => {
      layout(400, 100);
      const { container } = renderUI(
        <>
          <MenuItem tabIndex={0}>
            Rename the quarterly planning document
          </MenuItem>
          <button type="button">Next</button>
        </>,
      );
      await measured();
      const row = item(container);
      await userEvent.tab();
      expect(row).toHaveFocus();
      expect((await findTooltip()).textContent).toBe(
        'Rename the quarterly planning document',
      );
      expect(await axe(document.body)).toHaveNoViolations();
      await userEvent.keyboard('{Escape}');
      expect(queryTooltip()).toBeNull();
      expect(row).toHaveFocus();
      await userEvent.tab();
      expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus();
    });

    it('keeps its element when its label gets cut, so a focused row stays focused', async () => {
      layout(50, 100);
      const { container, rerender } = renderUI(
        <MenuItem tabIndex={-1}>Rename</MenuItem>,
      );
      await measured();
      const row = item(container);
      row.focus();
      expect(row).toHaveFocus();

      layout(400, 100);
      rerender(
        <MenuItem tabIndex={-1}>
          Rename the quarterly planning document
        </MenuItem>,
      );
      await measured();
      await userEvent.hover(row);
      expect(await findTooltip()).toBeInTheDocument();
      expect(item(container)).toBe(row);
      expect(row).toHaveFocus();
    });

    it('keeps its element when a tooltip appears later, so focus is not lost', async () => {
      const { container, rerender } = renderUI(
        <MenuItem tabIndex={-1}>Rename</MenuItem>,
      );
      const row = item(container);
      row.focus();
      rerender(
        <MenuItem tabIndex={-1} tooltip="Only owners can rename">
          Rename
        </MenuItem>,
      );
      expect(item(container)).toBe(row);
      expect(row).toHaveFocus();
      expect(row).toHaveAccessibleDescription('Only owners can rename');
    });
  });
});
