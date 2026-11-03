// Runs inside the page after in-page.js: the layout measures (DESIGN-R-013 to
// 016), added to globalThis.__weaveChecks with the helpers that file shares.
(() => {
  const { visible, name, appMade, FOCUSABLE } = globalThis.__weaveInPage;
  const px = (value) => Number.parseFloat(value) || 0;
  /** The landing page's hero has its own display-size title and spans the page. */
  const inHero = (element) => Boolean(element.closest('[data-hero]'));
  /** The track sizes of a grid, in px; one track for anything else. */
  const tracks = (element) => {
    const style = getComputedStyle(element);
    return style.display.includes('grid') ? style.gridTemplateColumns.split(' ').filter(Boolean).map(px) : [element.clientWidth];
  };
  /** Lays its children in one column from its own left edge, so they start where it starts. */
  const stacksFromEdge = (element) => {
    const style = getComputedStyle(element);
    const row = style.display.includes('flex') && style.flexDirection.startsWith('row');
    return !row && tracks(element).length === 1 && px(style.paddingLeft) === 0 && px(style.borderLeftWidth) === 0;
  };

  Object.assign(globalThis.__weaveChecks, {
    /** R-013: the page's H1 and the styles every screen's title shares; null when the H1 is the hero's or missing. */
    pageTitle() {
      const title = [...document.querySelectorAll('h1')].find(visible);
      if (!title || inHero(title)) return null;
      const style = getComputedStyle(title);
      return {
        element: name(title),
        pageHeader: title.dataset.slot === 'page-title',
        style: Object.fromEntries(
          ['font-family', 'font-size', 'font-weight', 'line-height', 'color'].map((key) => [key, style.getPropertyValue(key)]),
        ),
      };
    },

    /**
     * R-014: the page's blocks inside the frame's container, each with how far its left edge sits from the
     * container's content edge. A lone wrapper the size of the content box that stacks its children from its own
     * edge is looked through; a row, a grid of columns or a padded box is a block itself.
     */
    contentEdge() {
      const container = document.querySelector('[data-slot="container"]');
      if (!container || !visible(container)) return [];
      const box = container.getBoundingClientRect();
      const style = getComputedStyle(container);
      const edge = box.left + px(style.borderLeftWidth) + px(style.paddingLeft);
      const width = container.clientWidth - px(style.paddingLeft) - px(style.paddingRight);
      let blocks = [...container.children].filter(visible);
      while (
        blocks.length === 1 &&
        Math.abs(blocks[0].getBoundingClientRect().width - width) <= 1 &&
        blocks[0].children.length &&
        stacksFromEdge(blocks[0])
      )
        blocks = [...blocks[0].children].filter(visible);
      return blocks
        .filter((block) => !inHero(block))
        .map((block) => ({ element: name(block), offset: Math.round(block.getBoundingClientRect().left - edge) }))
        .filter((block) => Math.abs(block.offset) > 1);
    },

    /** R-015: a row of two texts, such as a label and its value, set more than 60% of a wide row apart. */
    spreadPairs() {
      const found = [];
      for (const row of document.body.querySelectorAll('*')) {
        if (!visible(row) || !appMade(row)) continue;
        const style = getComputedStyle(row);
        if (!style.display.includes('flex') || !style.flexDirection.startsWith('row')) continue;
        const width = row.getBoundingClientRect().width;
        if (width < 480) continue;
        const items = [...row.children].filter(visible);
        if (items.length !== 2) continue;
        if (items.some((item) => !item.textContent.trim() || item.matches(FOCUSABLE) || item.querySelector(`${FOCUSABLE}, img, svg`)))
          continue;
        const [first, second] = items.map((item) => item.getBoundingClientRect());
        const gap = Math.round(Math.max(second.left - first.right, first.left - second.right));
        if (gap > width * 0.6)
          found.push({ element: name(row), first: items[0].textContent.trim().slice(0, 40), second: items[1].textContent.trim().slice(0, 40), gap, width: Math.round(width) });
      }
      return found;
    },

    /** R-017: the template's pieces on the page. A probe page's own H1 (data-ds) stands for a screen not built yet. */
    frameParts() {
      const shown = (selector) => [...document.querySelectorAll(selector)].some(visible);
      return {
        title: shown('h1[data-slot="page-title"]') || shown('[data-hero]') || shown('h1[data-ds]'),
        logo: shown('[data-page-logo]'),
        userMenu: shown('[data-user-menu]'),
      };
    },

    /**
     * R-016: an app's grid of three or more columns whose last row, of two or more, holds one item that spans one
     * column. Rows come from the items' top edges, so an item spanning every column, such as a heading, fills its row.
     */
    gridOrphans() {
      const found = [];
      for (const grid of document.body.querySelectorAll('*')) {
        if (!visible(grid) || !appMade(grid) || !getComputedStyle(grid).display.includes('grid')) continue;
        const columns = tracks(grid);
        if (columns.length < 3) continue;
        const items = [...grid.children].filter(visible);
        const rows = new Map();
        for (const item of items) {
          const top = Math.round(item.getBoundingClientRect().top);
          rows.set(top, [...(rows.get(top) ?? []), item]);
        }
        if (rows.size < 2) continue;
        const last = rows.get(Math.max(...rows.keys()));
        if (last.length === 1 && last[0].getBoundingClientRect().width <= Math.max(...columns) + 1)
          found.push({ element: name(grid), columns: columns.length, items: items.length });
      }
      return found;
    },
  });
})();
