// Runs inside the page (Chromium): the measurements the rendered checks need
// (DESIGN-R-001 to 009). Plain browser JavaScript, installed by page.ts as
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
  const textElements = () =>
    [...document.body.querySelectorAll('*')].filter(
      (element) => ownText(element) && visible(element),
    );

  globalThis.__weaveChecks = {
    /** R-002: each visible text against its background; 3:1 from 24px, or 18.66px bold. */
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

    /** R-004: every visible control's box. */
    targets() {
      return [...document.querySelectorAll(`${FOCUSABLE}, [role="button"], [role="link"]`)]
        .filter(visible)
        .map((element) => {
          const box = element.getBoundingClientRect();
          return { element: name(element), width: Math.round(box.width), height: Math.round(box.height) };
        });
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
          .filter((element) => scrolls(element) && element.scrollWidth > element.clientWidth + 1 && !tables.has(element))
          .map((element) => `${name(element)} scrolls sideways (${element.scrollWidth}px in ${element.clientWidth}px)`),
      ];
    },

    /** R-006: the H1's bottom and each primary action's, against the viewport. */
    firstViewport(testIds) {
      const bottom = (element) => (element ? element.getBoundingClientRect().bottom + window.scrollY : null);
      return {
        height: window.innerHeight,
        h1: bottom(document.querySelector('h1')),
        primaries: testIds.map((id) => ({ id, bottom: bottom(find(`[data-testid="${id}"]`)) })),
      };
    },

    /** R-007: text under 14px; wrapped paragraphs over 90 characters a line, or under 45. */
    typography() {
      const small = textElements()
        .map((element) => ({ element: name(element), size: Number.parseFloat(getComputedStyle(element).fontSize) }))
        .filter((entry) => entry.size < 14);
      const measure = [...document.querySelectorAll('p')].filter(visible).flatMap((p) => {
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
        for (const [property, value] of used) {
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

    /** R-009: the gap between consecutive [data-section] blocks against the largest gap inside them. */
    proximity() {
      const gaps = (parent) => {
        const kids = [...parent.children].filter(visible).map((k) => k.getBoundingClientRect());
        return kids.slice(1).map((box, i) => box.top - kids[i].bottom);
      };
      const sections = [...document.querySelectorAll('[data-section]')].filter(visible);
      return sections.slice(1).map((section, i) => {
        const before = sections[i];
        const between = section.getBoundingClientRect().top - before.getBoundingClientRect().bottom;
        const inside = Math.max(0, ...gaps(before), ...gaps(section));
        return { sections: [name(before), name(section)], between: Math.round(between), inside: Math.round(inside) };
      });
    },

    /** R-003: the controls Tab should reach, in document order. */
    focusables() {
      return [...document.querySelectorAll(FOCUSABLE)]
        .filter((element) => visible(element) && !element.disabled && element.getAttribute('aria-disabled') !== 'true')
        .map((element) => ({
          element: name(element),
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
     * Counts clicks by element and, until releaseClicks, stops each one before the page sees it: a button that
     * opens another page, creates a record or signs out does none of it, and the walk stays on its route.
     */
    watchClicks() {
      globalThis.__weaveClicks = {};
      globalThis.__weaveSwallow = true;
      window.addEventListener('click', (event) => {
        const target = event.target.closest('button, [role="button"]');
        if (target) globalThis.__weaveClicks[name(target)] = (globalThis.__weaveClicks[name(target)] || 0) + 1;
        if (globalThis.__weaveSwallow) {
          event.preventDefault();
          event.stopPropagation();
        }
      }, true);
      document.addEventListener('submit', (event) => event.preventDefault(), true);
    },
    /** Lets clicks through again, for the checks that need a button to act, such as opening its dialog. */
    releaseClicks() {
      globalThis.__weaveSwallow = false;
    },
    clicks(selector) {
      return globalThis.__weaveClicks?.[selector] || 0;
    },
    /** An open dialog's accessible name, or null. */
    openDialog() {
      const dialog = [...document.querySelectorAll('[role="dialog"], dialog[open]')].find(visible);
      if (!dialog) return null;
      const labelled = dialog.getAttribute('aria-labelledby');
      return dialog.getAttribute('aria-label') || (labelled && document.getElementById(labelled)?.textContent.trim()) || '';
    },
  };
})();
