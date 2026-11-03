// Runs inside the page (Chromium): the measurements the rendered checks need
// (DESIGN-R-001 to 012; in-page-layout.js has 013 to 016). Plain browser JavaScript, installed by page.ts as
// globalThis.__weaveChecks, so the generator's TypeScript, which has no DOM
// types, never compiles it.
(() => {
  const FOCUSABLE =
    'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"]), [contenteditable]';

  const visible = (element) => {
    const box = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return (
      box.width > 0 &&
      box.height > 0 &&
      style.visibility !== 'hidden' &&
      style.display !== 'none' &&
      Number(style.opacity) > 0
    );
  };
  /** An element's own handle: its test id, else its id. */
  const handle = (element) =>
    element.dataset?.testid
      ? `[data-testid="${element.dataset.testid}"]`
      : element.id
        ? `#${CSS.escape(element.id)}`
        : '';
  /** A CSS path from the nearest ancestor with a handle, so a finding points at the node the code names. */
  const cssPath = (element) => {
    const parts = [];
    let at = element;
    for (; at && at !== document.body && !(at !== element && handle(at)); at = at.parentElement) {
      const same = [...at.parentElement.children].filter((c) => c.tagName === at.tagName);
      parts.unshift(`${at.tagName.toLowerCase()}:nth-of-type(${same.indexOf(at) + 1})`);
    }
    return [at && at !== document.body ? handle(at) : 'body', ...parts].join(' > ');
  };
  /** How a finding names an element: its test id, its id, or a CSS path from the nearest one. */
  const name = (element) => handle(element) || cssPath(element);
  const find = (selector) => document.querySelector(selector);

  const rgb = (text) => {
    const match = /rgba?\(([^)]+)\)/.exec(text);
    if (!match) return null;
    const [r, g, b, a = 1] = match[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return { r, g, b, a };
  };
  const hex = ({ r, g, b }) =>
    `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
  const luminance = ({ r, g, b }) => {
    const [lr, lg, lb] = [r, g, b].map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
  };
  const contrast = (a, b) => {
    const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (light + 0.05) / (dark + 0.05);
  };
  /** The first opaque background up the tree; an image or a translucent layer makes it unknown. */
  const background = (element) => {
    for (let at = element; at; at = at.parentElement) {
      const style = getComputedStyle(at);
      if (style.backgroundImage !== 'none') return null;
      const color = rgb(style.backgroundColor);
      if (color && color.a > 0) return color.a < 1 ? null : color;
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  };
  const ownText = (element) =>
    [...element.childNodes]
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent.trim())
      .join(' ')
      .trim();
  /** Made by the app, not the design system: its own tests cover every element it marks with data-ds. */
  const appMade = (element) => !element.hasAttribute('data-ds');
  /** Spaced by the design system: its own elements, and an app element it styles through asChild, which gets data-slot but not data-ds. */
  const dsSpaced = (element) => element.hasAttribute('data-ds') || element.hasAttribute('data-slot');
  /** What a button can open. */
  const POPUPS = '[role="dialog"], dialog[open], [role="menu"], [role="listbox"]';
  const textElements = () =>
    [...document.body.querySelectorAll('*')].filter(
      (element) => ownText(element) && visible(element),
    );

  // For the layout measures in in-page-layout.js, installed after this file.
  globalThis.__weaveInPage = { visible, name, appMade, FOCUSABLE };

  globalThis.__weaveChecks = {
    /**
     * R-002: each visible text against its background; 3:1 from 24px, or 18.66px bold. The design system's text too:
     * the background behind it, and the variant it shows, are the app's choice.
     */
    contrast() {
      const failures = [];
      let unknown = 0;
      for (const element of textElements()) {
        const style = getComputedStyle(element);
        const color = rgb(style.color);
        const behind = background(element);
        if (!color || !behind) {
          unknown += 1;
          continue;
        }
        const size = Number.parseFloat(style.fontSize);
        const large = size >= 24 || (size >= 18.66 && Number(style.fontWeight) >= 700);
        const ratio = contrast(color, behind);
        const required = large ? 3 : 4.5;
        if (ratio < required)
          failures.push({ element: name(element), ratio: Math.round(ratio * 100) / 100, required, color: hex(color), background: hex(behind) });
      }
      return { failures, unknown };
    },

    /**
     * R-004: every visible app control under 24 by 24, with the WCAG 2.5.8 exception it meets: "inline" for a link
     * inside a sentence, "spacing" when a 24px circle on its center touches no other target and no other small
     * target's circle, "" for none.
     */
    targets() {
      const all = [...document.querySelectorAll(`${FOCUSABLE}, [role="button"], [role="link"]`)]
        .filter(visible)
        .map((element) => {
          const box = element.getBoundingClientRect();
          return { element, box, small: Math.min(box.width, box.height) < 24, x: box.left + box.width / 2, y: box.top + box.height / 2 };
        });
      // In a sentence: inline, in a block with text of its own; a row of links alone is no sentence.
      const inSentence = (element) => {
        if (getComputedStyle(element).display !== 'inline') return false;
        let block = element.parentElement;
        while (block && getComputedStyle(block).display.startsWith('inline')) block = block.parentElement;
        if (!block) return false;
        const copy = block.cloneNode(true);
        for (const target of copy.querySelectorAll(`${FOCUSABLE}, [role="button"], [role="link"]`)) target.remove();
        return Boolean(copy.textContent.trim());
      };
      const toBox = (x, y, box) => Math.hypot(Math.max(box.left - x, 0, x - box.right), Math.max(box.top - y, 0, y - box.bottom));
      const spaced = (target) =>
        all.every(
          (other) =>
            other === target ||
            other.element.contains(target.element) ||
            target.element.contains(other.element) ||
            (toBox(target.x, target.y, other.box) >= 12 && !(other.small && Math.hypot(other.x - target.x, other.y - target.y) < 24)),
        );
      return all
        .filter((target) => target.small && appMade(target.element))
        .map((target) => ({
          element: name(target.element),
          width: Math.round(target.box.width),
          height: Math.round(target.box.height),
          exempt: inSentence(target.element) ? 'inline' : spaced(target) ? 'spacing' : '',
        }));
    },

    /** R-005: verify.mjs's measureLayout: the page or a non-table box that scrolls sideways. */
    overflow() {
      const scrolls = (element) => ['auto', 'scroll'].includes(getComputedStyle(element).overflowX);
      const scroller = (element) => {
        for (let parent = element.parentElement; parent; parent = parent.parentElement) if (scrolls(parent)) return parent;
        return null;
      };
      const tables = new Set([...document.querySelectorAll('table')].map(scroller));
      const page = document.documentElement;
      return [
        ...(page.scrollWidth > window.innerWidth ? [`page is ${page.scrollWidth}px wide`] : []),
        ...[...document.body.querySelectorAll('*')]
          .filter((element) => appMade(element) && scrolls(element) && element.scrollWidth > element.clientWidth + 1 && !tables.has(element))
          .map((element) => `${name(element)} scrolls sideways (${element.scrollWidth}px in ${element.clientWidth}px)`),
      ];
    },

    /** R-006: the H1's bottom against the viewport. */
    firstViewport() {
      const h1 = document.querySelector('h1');
      return { height: window.innerHeight, h1: h1 ? h1.getBoundingClientRect().bottom + window.scrollY : null };
    },

    /** R-007: text under 14px; wrapped paragraphs over 90 characters a line, or under 45. */
    typography() {
      const small = textElements()
        .filter(appMade)
        .map((element) => ({ element: name(element), size: Number.parseFloat(getComputedStyle(element).fontSize) }))
        .filter((entry) => entry.size < 14);
      const measure = [...document.querySelectorAll('p')].filter((p) => appMade(p) && visible(p)).flatMap((p) => {
        const style = getComputedStyle(p);
        const probe = document.createElement('span');
        probe.textContent = '0';
        probe.style.cssText = 'position:absolute;visibility:hidden;font:inherit';
        p.append(probe);
        const ch = probe.getBoundingClientRect().width;
        probe.remove();
        const line = Number.parseFloat(style.lineHeight) || Number.parseFloat(style.fontSize) * 1.2;
        const wraps = p.getBoundingClientRect().height > line * 1.5;
        const chars = Math.round(p.clientWidth / ch);
        return wraps && (chars < 45 || chars > 90) ? [{ element: name(p), chars }] : [];
      });
      return { small, measure };
    },

    /** R-008: colors not in the theme, and how much of the first viewport the accent fills. */
    colors({ allowed, accent }) {
      const theme = new Set(allowed);
      const accents = new Set(accent);
      const stray = [];
      let accentArea = 0;
      for (const element of [document.body, ...document.body.querySelectorAll('*')]) {
        if (!visible(element)) continue;
        const style = getComputedStyle(element);
        const used = [
          ['color', ownText(element) ? style.color : ''],
          ['background-color', style.backgroundColor],
          ...['Top', 'Right', 'Bottom', 'Left'].map((side) => [
            `border-${side.toLowerCase()}-color`,
            Number.parseFloat(style[`border${side}Width`]) > 0 ? style[`border${side}Color`] : '',
          ]),
          ['outline-color', style.outlineStyle !== 'none' && Number.parseFloat(style.outlineWidth) > 0 ? style.outlineColor : ''],
        ];
        // The design system's colors are its own; how much accent the page shows counts every element.
        for (const [property, value] of appMade(element) ? used : []) {
          const color = rgb(value);
          if (!color || color.a === 0) continue;
          if (!theme.has(hex(color))) stray.push({ element: name(element), property, hex: hex(color) });
        }
        const fill = rgb(style.backgroundColor);
        if (fill && fill.a > 0 && accents.has(hex(fill))) {
          const box = element.getBoundingClientRect();
          const width = Math.max(0, Math.min(box.right, window.innerWidth) - Math.max(box.left, 0));
          const height = Math.max(0, Math.min(box.bottom, window.innerHeight) - Math.max(box.top, 0));
          accentArea += width * height;
        }
      }
      return { stray, accentShare: accentArea / (window.innerWidth * window.innerHeight) };
    },

    /**
     * R-009: pairs of visible targets closer than 8px, edge to edge. Inline links in text, nested targets, pairs
     * inside one design-system component, and targets outside the page are left out.
     */
    targetGaps() {
      const topDs = (element) => {
        let top = null;
        for (let at = element; at; at = at.parentElement) if (at.hasAttribute('data-ds')) top = at;
        return top;
      };
      const targets = [...document.querySelectorAll(`${FOCUSABLE}, [role="button"], [role="link"]`)]
        .filter((element) => visible(element) && getComputedStyle(element).display !== 'inline')
        .map((element) => ({ element, box: element.getBoundingClientRect(), ds: topDs(element) }))
        .filter(({ box }) => box.right > 0 && box.bottom > 0);
      const close = [];
      for (let i = 0; i < targets.length; i += 1)
        for (let j = i + 1; j < targets.length; j += 1) {
          const a = targets[i];
          const b = targets[j];
          if (a.element.contains(b.element) || b.element.contains(a.element)) continue;
          if (a.ds && a.ds === b.ds) continue;
          const dx = Math.max(0, b.box.left - a.box.right, a.box.left - b.box.right);
          const dy = Math.max(0, b.box.top - a.box.bottom, a.box.top - b.box.bottom);
          const gap = Math.round(Math.hypot(dx, dy));
          if (gap < 8) close.push({ a: name(a.element), b: name(b.element), gap });
        }
      return close;
    },

    /**
     * R-010 and R-011: each container the app spaced in the main region (flex or grid, two or more visible children,
     * a gap) against the nearest container around it there, whose gap it may not exceed, and against its own padding,
     * which is at least its gap on every side that has one. The frame's spacing is the theme's, and the design
     * system's is its own, asChild parts included.
     */
    containerSpacing() {
      const main = document.querySelector('main');
      if (!main) return { nesting: [], padding: [] };
      const isContainer = (element) =>
        visible(element) &&
        /flex|grid/.test(getComputedStyle(element).display) &&
        [...element.children].filter(visible).length >= 2;
      const gapOf = (element) => {
        const style = getComputedStyle(element);
        const row = Number.parseFloat(style.rowGap) || 0;
        const column = Number.parseFloat(style.columnGap) || 0;
        if (style.display.includes('grid')) return Math.max(row, column);
        return style.flexDirection.startsWith('column') ? row : column;
      };
      const parentOf = (element) => {
        for (let at = element.parentElement; at && main.contains(at); at = at.parentElement) if (isContainer(at)) return at;
        return null;
      };
      const nesting = [];
      const padding = [];
      for (const element of [...main.querySelectorAll('*')].filter((e) => !dsSpaced(e) && isContainer(e))) {
        const gap = gapOf(element);
        if (!gap) continue;
        const parent = parentOf(element);
        const outer = parent ? gapOf(parent) : 0;
        if (parent && outer && gap > outer) nesting.push({ element: name(element), gap, parent: name(parent), outer });
        const style = getComputedStyle(element);
        const sides = ['Top', 'Right', 'Bottom', 'Left'].map((side) => Number.parseFloat(style[`padding${side}`]) || 0).filter((v) => v > 0);
        if (sides.length && Math.min(...sides) < gap) padding.push({ element: name(element), padding: Math.min(...sides), gap });
      }
      return { nesting, padding };
    },

    /** R-012: a number that stands alone, such as a count, a total or a statistic, set in the text font instead of the mono one. */
    numerals() {
      const NUMBER = /^[+\-−]?[$€£¥₹]?\s?\d[\d.,\s]*%?$/u;
      // A phone number stays text, as UX.md says: a run of 7 or more digits with no separator, or one led by +.
      const PHONE = /^(\+\d[\d\s]{6,}|\d{7,})$/;
      // A number on a control is its label.
      const CONTROL = 'a, button, label, input, select, textarea, option, svg, [role="button"], [role="link"], [role="tab"], [role="option"], [role="menuitem"]';
      const probe = document.createElement('span');
      probe.style.fontFamily = 'var(--font-mono), monospace';
      document.body.append(probe);
      const defined = getComputedStyle(probe).getPropertyValue('--font-mono').trim() !== '';
      const mono = getComputedStyle(probe).fontFamily;
      probe.remove();
      // Without the theme's mono font there is nothing to ask for.
      if (!defined) return [];
      return textElements()
        .filter(
          (element) =>
            NUMBER.test(ownText(element)) &&
            !PHONE.test(ownText(element)) &&
            !element.closest(CONTROL) &&
            // Inside a sentence, the number is part of the text.
            !(element.parentElement && ownText(element.parentElement)) &&
            getComputedStyle(element).fontFamily !== mono,
        )
        .map((element) => ({ element: name(element), text: ownText(element) }));
    },

    /** R-003: the controls Tab should reach, in document order. */
    focusables() {
      return [...document.querySelectorAll(FOCUSABLE)]
        .filter((element) => visible(element) && !element.disabled && element.getAttribute('aria-disabled') !== 'true')
        .map((element) => ({
          element: name(element),
          app: appMade(element),
          button: element.tagName === 'BUTTON' || element.getAttribute('role') === 'button',
          skip: element.tagName === 'A' && /^#./.test(element.getAttribute('href') || ''),
        }));
    },
    /** The focused element and how it looks; '' for the page itself, and for the dev server's overlay, which is not the app's. */
    active() {
      const element = document.activeElement;
      if (!element || element === document.body || element.tagName === 'NEXTJS-PORTAL') return { element: '', style: '' };
      const style = getComputedStyle(element);
      return { element: name(element), style: `${style.outlineStyle} ${style.outlineWidth} ${style.boxShadow}` };
    },
    /** How an element looks without focus. */
    blurredStyle(selector) {
      const element = find(selector);
      if (!element) return '';
      element.blur();
      const style = getComputedStyle(element);
      return `${style.outlineStyle} ${style.outlineWidth} ${style.boxShadow}`;
    },
    reset() {
      document.activeElement?.blur();
    },
    focus(selector) {
      find(selector)?.focus();
    },
    /**
     * Counts clicks by element and stops each one before the page sees it: a button that opens another page,
     * creates a record or signs out does none of it, and the walk stays on its route.
     */
    watchClicks() {
      globalThis.__weaveClicks = {};
      window.addEventListener('click', (event) => {
        const target = event.target.closest('button, [role="button"]');
        if (target) globalThis.__weaveClicks[name(target)] = (globalThis.__weaveClicks[name(target)] || 0) + 1;
        event.preventDefault();
        event.stopPropagation();
      }, true);
      document.addEventListener('submit', (event) => event.preventDefault(), true);
    },
    /** What a key on a button can change: its clicks, its aria-expanded, and how many dialogs, menus and listboxes show. */
    pressState(selector) {
      return {
        clicks: globalThis.__weaveClicks?.[selector] || 0,
        expanded: find(selector)?.getAttribute('aria-expanded') ?? '',
        popups: [...document.querySelectorAll(POPUPS)].filter(visible).length,
      };
    },
    /**
     * Marks, for axe to leave out, each topmost design-system element whose whole subtree the design system made
     * (an svg's own shapes count as its). A component holding what the app put in its slot stays in, so that is tested.
     */
    skipDesignSystem() {
      for (const element of document.querySelectorAll('[data-ds]')) {
        if (element.querySelector(':not([data-ds]):not(svg *)')) continue;
        if (element.parentElement?.closest('[data-weave-skip]')) continue;
        element.setAttribute('data-weave-skip', '');
      }
    },
    popupOpen() {
      return [...document.querySelectorAll(POPUPS)].some(visible);
    },
  };
})();
