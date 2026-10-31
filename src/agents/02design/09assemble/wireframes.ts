import type { Rect, ScreenSkeleton, Skeleton } from './skeleton/skeleton';
import type { DesignNode, Screens } from '../schema';
import type { NodeLayout } from '../schema-boxes';

// 02-design/09-wireframes.html (DS6b): every screen of the skeleton drawn as lines at
// desktop width. One self-contained file: inline styles, no scripts, no
// fonts. Hovering a rectangle shows its id, what it is and where
// its height came from.

const SCALE = 0.625;
const LABEL_PX = 11;

const escape = (text: string) =>
  text.replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c,
  );
const n = (value: number) => String(Math.round(value * 10) / 10);

function tooltip(rect: Rect, node: DesignNode | undefined): string {
  const lines = [
    `${rect.id} · ${rect.kind}`,
    rect.what,
    node?.component && node.component !== 'none'
      ? `${node.component} ${node.size} ${node.look}`.trim()
      : '',
    `${n(rect.width)} × ${n(rect.height)} at ${n(rect.x)}, ${n(rect.y)}`,
    `height: ${rect.heightFrom}${rect.estimated ? ' (estimated)' : ''}`,
    rect.gapBefore === null ? '' : `gap before: ${n(rect.gapBefore)}`,
    rect.padding.some(Boolean) ? `padding: ${rect.padding.join(' ')}` : '',
    rect.overflowX ? 'overflows its width' : '',
  ];
  return `<title>${escape(lines.filter(Boolean).join('\n'))}</title>`;
}

/** A label clipped to the characters that fit the width. */
function label(
  text: string,
  x: number,
  y: number,
  width: number,
  size: number,
  cls: string,
): string {
  const fits = Math.floor(width / (size * 0.56));
  if (fits < 3 || !text) return '';
  const shown = text.length > fits ? `${text.slice(0, fits - 1)}…` : text;
  return `<text class="${cls}" x="${n(x)}" y="${n(y)}" font-size="${n(size)}">${escape(shown)}</text>`;
}

/** Text as one bar per estimated line; headings darker; the short last line centred in a centred block. */
function textBars(
  rect: Rect,
  node: DesignNode | undefined,
  centred: boolean,
): string {
  const lines = Math.max(1, rect.lines);
  const line = rect.height / lines;
  const bar = Math.max(3, line * 0.42);
  const cls = node?.role === 'heading' ? 'bar heading' : 'bar';
  return Array.from({ length: lines }, (_, i) => {
    const width = i === lines - 1 && lines > 1 ? rect.width * 0.62 : rect.width;
    const x = centred ? rect.x + (rect.width - width) / 2 : rect.x;
    return `<rect class="${cls}" x="${n(x)}" y="${n(rect.y + i * line + (line - bar) / 2)}" width="${n(width)}" height="${n(bar)}" rx="${n(bar / 2)}"/>`;
  }).join('');
}

/** A field as the FormControl the inventory measured: a 16 label row and a 16 help line, 8 from the box. */
function field(rect: Rect, text: string, size: number): string {
  const { x, y, width, height } = rect;
  const bar = 6;
  return [
    `<rect class="bar" x="${n(x)}" y="${n(y + 8 - bar / 2)}" width="${n(Math.min(width, Math.max(40, text.length * 7)))}" height="${bar}" rx="3"/>`,
    `<rect class="component" x="${n(x)}" y="${n(y + 24)}" width="${n(width)}" height="${n(height - 48)}" rx="3"/>`,
    label(
      text,
      x + 8,
      y + 24 + (height - 48) / 2 + size * 0.35,
      width - 16,
      size,
      'name',
    ),
    `<rect class="bar faint" x="${n(x)}" y="${n(y + height - 8 - bar / 2)}" width="${n(width * 0.5)}" height="${bar}" rx="3"/>`,
  ].join('');
}

function shape(
  rect: Rect,
  node: DesignNode | undefined,
  viewportWidth: number,
  size: number,
  centred: boolean,
): string {
  const { x, y, width, height } = rect;
  const box = `x="${n(x)}" y="${n(y)}" width="${n(width)}" height="${n(height)}"`;
  const over =
    rect.overflowX || x + width > viewportWidth + 0.5 ? ' overflow' : '';
  const title = tooltip(rect, node);
  switch (rect.kind) {
    case 'frame':
      if (rect.depth === 0 || rect.id.endsWith('.content')) return '';
      if (rect.id.endsWith('.header'))
        return `<g>${title}${label(rect.what.replace(/, the dialog header$/, ''), x + 24, y + height / 2 + size * 0.5, width - 48, size * 1.3, 'dialog-title')}</g>`;
      // A shell region: its nodes draw over it, so it takes no label.
      return `<g>${title}<rect class="frame" ${box}/></g>`;
    case 'section':
      return `<g>${title}<rect class="section${over}" ${box}/>${label(rect.what, x, y - size * 0.45, width, size * 0.9, 'muted')}</g>`;
    case 'container':
      return `<g>${title}<rect class="container${over}" ${box}/></g>`;
    case 'text':
      return `<g>${title}<rect class="hit${over}" ${box}/>${textBars(rect, node, centred)}</g>`;
    default: {
      const cls = rect.kind === 'newComponent' ? 'new' : 'component';
      const media = node?.role === 'media' && node.component === 'none';
      const cross = media
        ? `<path class="cross" d="M${n(x)} ${n(y)}L${n(x + width)} ${n(y + height)}M${n(x + width)} ${n(y)}L${n(x)} ${n(y + height)}"/>`
        : '';
      const name =
        node?.newComponent ||
        [node?.component, node?.size]
          .filter((v) => v && v !== 'none')
          .join(' ');
      const text = node?.text || node?.label || name;
      // A field with a visible label that has the whole field's height.
      if (node?.role === 'input' && node.text && height >= 72)
        return `<g>${title}<rect class="hit${over}" ${box}/>${field(rect, text, size)}</g>`;
      const inside =
        height >= size * 1.4
          ? label(
              text,
              x + 6,
              y + Math.min(height, 40) / 2 + size * 0.35,
              width - 12,
              size,
              'name',
            )
          : '';
      return `<g>${title}<rect class="${cls}${over}" ${box} rx="3"/>${cross}${inside}</g>`;
    }
  }
}

function svg(
  solved: ScreenSkeleton,
  fold: number,
  nodes: Map<string, DesignNode>,
  layouts: Map<string, NodeLayout | null>,
): string {
  const size = LABEL_PX / SCALE;
  const dialog = solved.type !== 'page';
  const backdrop = dialog
    ? `<rect class="backdrop" x="0" y="0" width="${solved.width}" height="${solved.height}"/>`
    : '';
  const surface = dialog
    ? solved.rects
        .filter((r) => r.depth === 0)
        .map(
          (r) =>
            `<rect class="surface" x="${n(r.x)}" y="${n(r.y)}" width="${n(r.width)}" height="${n(r.height)}" rx="8"/>`,
        )
        .join('')
    : '';
  const shapes = solved.rects
    .map((rect) => {
      const parent = layouts.get(rect.parent);
      const centred =
        parent?.direction === 'column' && parent.align === 'center';
      return shape(rect, nodes.get(rect.id), solved.width, size, centred);
    })
    .join('\n');
  const foldLine = `<line class="fold" x1="0" x2="${solved.width}" y1="${fold}" y2="${fold}"/>${label(`fold ${fold}`, solved.width - size * 4.6, fold - size * 0.4, size * 5, size * 0.9, 'fold-label')}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${solved.width} ${n(solved.height)}" width="${n(solved.width * SCALE)}" height="${n(solved.height * SCALE)}" role="img" aria-label="${escape(solved.name)}">
<rect class="page" x="0" y="0" width="${solved.width}" height="${n(solved.height)}"/>${backdrop}${surface}
${shapes}
${foldLine}
</svg>`;
}

const STYLE = `
:root { color-scheme: light; --ink: #1f2430; --muted: #6b7385; --line: #8a94a6; --soft: #c5ccd8; --blue: #3d63b8; --blue-bg: #e7eefb; --orange: #c9701c; --orange-bg: #fdecd9; --red: #d23b3b; }
* { box-sizing: border-box; }
body { margin: 0; background: #f4f5f7; color: var(--ink); font: 14px/1.45 system-ui, -apple-system, "Segoe UI", sans-serif; }
header, main { max-width: 1240px; margin: 0 auto; padding: 24px 16px; }
h1 { font-size: 22px; margin: 0 0 4px; } h2 { font-size: 18px; margin: 0; }
.sub, .meta { color: var(--muted); margin: 4px 0 0; }
nav ol { display: flex; flex-wrap: wrap; gap: 6px 16px; list-style: none; padding: 0; margin: 12px 0 0; }
nav a { color: var(--blue); text-decoration: none; }
.legend { display: flex; flex-wrap: wrap; gap: 8px 18px; margin-top: 14px; color: var(--muted); font-size: 13px; }
.legend span { display: inline-flex; align-items: center; gap: 6px; }
.legend i { display: inline-block; width: 22px; height: 12px; border-radius: 2px; }
.screen { background: #fff; border: 1px solid #e1e4ea; border-radius: 10px; padding: 18px 18px 22px; margin-bottom: 24px; }
figure { margin: 14px 0 0; max-width: 100%; } figcaption { color: var(--muted); font-size: 12px; margin-bottom: 6px; }
svg { display: block; max-width: 100%; height: auto; border: 1px solid #e1e4ea; border-radius: 4px; background: #fff; }
.page { fill: #fff; } .backdrop { fill: #e9ebef; } .surface { fill: #fff; stroke: var(--soft); stroke-width: 1.5; }
.frame { fill: #f1f3f6; stroke: none; }
.section { fill: none; stroke: var(--line); stroke-width: 1.2; stroke-dasharray: 7 5; }
.container { fill: none; stroke: var(--soft); stroke-width: 1; }
.component { fill: var(--blue-bg); stroke: var(--blue); stroke-width: 1.4; }
.new { fill: var(--orange-bg); stroke: var(--orange); stroke-width: 1.6; }
.cross { stroke: var(--blue); stroke-width: 0.8; opacity: 0.5; }
.hit { fill: transparent; }
.bar { fill: #aab2c0; } .bar.heading { fill: #4a5263; } .bar.faint { fill: #d5dae2; }
.dialog-title { fill: var(--ink); font-weight: 600; }
.overflow { stroke: var(--red) !important; stroke-width: 2.5 !important; fill: rgba(210, 59, 59, 0.08) !important; }
.fold { stroke: var(--red); stroke-width: 1; stroke-dasharray: 3 4; opacity: 0.6; }
text { font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
.muted { fill: var(--muted); } .name { fill: #24365f; } .fold-label { fill: var(--red); opacity: 0.8; }
g:hover > rect { stroke-width: 2.5; }
.hidden { margin-top: 10px; color: var(--muted); font-size: 13px; }
`;

const swatch = (style: string, text: string) =>
  `<span><i style="${style}"></i>${text}</span>`;

/** The whole file: an index, a legend, then each screen's drawing. */
export function renderWireframes(
  skeleton: Skeleton,
  screens: Screens,
  title: string,
): string {
  const nodes = new Map(screens.nodes.map((node) => [node.id, node]));
  const layouts = new Map<string, NodeLayout | null>([
    ...screens.nodes.map((node) => [node.id, node.layout] as const),
    ...screens.sections.map((s) => [s.id, s.layout] as const),
  ]);
  const { viewport } = skeleton;
  const sections = skeleton.screens.map((screen) => {
    const own = screens.screens.find((s) => s.id === screen.id);
    const meta = [
      screen.type,
      screen.route || `opened from ${own?.parent ?? ''}`,
      screen.kind,
      own?.shell ? `shell ${own.shell}` : '',
    ]
      .filter(Boolean)
      .join(' · ');
    const hidden = screen.hidden.length
      ? `<p class="hidden">Not in the default state: ${screen.hidden.map((h) => `${escape(h.id)} (${escape(h.states.join(', '))})`).join('; ')}.</p>`
      : '';
    return `<section class="screen" id="${screen.id}">
<h2>${screen.id} · ${escape(screen.name)}</h2>
<p class="meta">${escape(meta)}</p>
<figure><figcaption>Desktop ${viewport.width} × ${viewport.height}</figcaption>${svg(screen, viewport.height, nodes, layouts)}</figure>${hidden}
</section>`;
  });
  const index = skeleton.screens
    .map((s) => `<li><a href="#${s.id}">${s.id} ${escape(s.name)}</a></li>`)
    .join('');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)} wireframes</title>
<style>${STYLE}</style>
</head>
<body>
<header>
<h1>${escape(title)}</h1>
<p class="sub">${skeleton.screens.length} screens, solved at ${viewport.width} × ${viewport.height}. Hover a box for its id, what it is and where its height came from.</p>
<nav><ol>${index}</ol></nav>
<div class="legend">
${swatch('border: 1.5px dashed #8a94a6', 'section')}
${swatch('border: 1px solid #c5ccd8', 'container')}
${swatch('background: #e7eefb; border: 1.5px solid #3d63b8', 'design-system component')}
${swatch('background: #fdecd9; border: 1.5px solid #c9701c', 'new component')}
${swatch('background: linear-gradient(#aab2c0, #aab2c0) center / 100% 5px no-repeat', 'text, one bar per line')}
${swatch('background: #f1f3f6', 'frame')}
${swatch('border: 2.5px solid #d23b3b', 'overflow')}
${swatch('border-top: 1px dashed #d23b3b', 'first viewport')}
</div>
</header>
<main>
${sections.join('\n')}
</main>
</body>
</html>
`;
}
