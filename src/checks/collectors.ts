import AxeBuilder from '@axe-core/playwright';
import type { Page } from 'playwright-core';
import { inPage } from './page';
import { type Finding, finding } from './types';

// DESIGN-R-001, 002 and 004 to 008: each
// measures one open page and returns findings plus the numbers behind them,
// so the coding gate, the app MCP and the benchmark read the same
// collectors. The keyboard walk, R-003, is keyboard.ts.

type AxeViolation = Awaited<
  ReturnType<AxeBuilder['analyze']>
>['violations'][number];

/** R-001: axe on WCAG 2.0 to 2.2 A and AA; serious and critical violations are mandatory. */
export async function axeCheck(
  page: Page,
  opts: { whole?: boolean } = {},
): Promise<{ findings: Finding[]; violations: AxeViolation[]; passes: number }> {
  // The design system's own subtrees are its tests' to check, unless `whole` asks for the page as a user meets it;
  // `next dev` injects its own overlay.
  if (!opts.whole) await inPage(page, 'skipDesignSystem');
  const { violations, passes } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .exclude('[data-weave-skip]')
    .exclude('nextjs-portal')
    .analyze();
  const findings = violations.flatMap((v) =>
    v.nodes.map((node) =>
      finding(
        'DESIGN-R-001',
        v.impact === 'serious' || v.impact === 'critical'
          ? 'mandatory'
          : 'warning',
        `${v.id} (${v.impact}): ${v.help}`,
        node.target.join(' '),
      ),
    ),
  );
  return { findings, violations, passes: passes.length };
}

type ContrastFailure = {
  element: string;
  ratio: number;
  required: number;
  color: string;
  background: string;
};

/** R-002: text against its effective background; text over an image or a translucent layer counts as unknown. */
export async function contrastCheck(
  page: Page,
): Promise<{
  findings: Finding[];
  failures: ContrastFailure[];
  unknown: number;
}> {
  const { failures, unknown } = await inPage<{
    failures: ContrastFailure[];
    unknown: number;
  }>(page, 'contrast');
  const findings = failures.map((f) =>
    finding(
      'DESIGN-R-002',
      'mandatory',
      `text ${f.color} on ${f.background} is ${f.ratio}:1; it needs ${f.required}:1`,
      f.element,
    ),
  );
  return { findings, failures, unknown };
}

/** R-004: a control under 24 by 24 fails, unless it meets a WCAG 2.5.8 exception: a link inside a sentence, or room around it. */
export async function targetSizes(
  page: Page,
): Promise<{ findings: Finding[]; small24: number }> {
  const small24 = await inPage<
    { element: string; width: number; height: number; exempt: string }[]
  >(page, 'targets');
  const findings = small24
    .filter((t) => !t.exempt)
    .map((t) =>
      finding(
        'DESIGN-R-004',
        'mandatory',
        `target is ${t.width} by ${t.height} and another target is too close; make it at least 24 by 24, or keep other targets clear of a 24px circle on its center`,
        t.element,
      ),
    );
  return { findings, small24: small24.length };
}

/** R-005: no page-level horizontal scroll and no box that scrolls sideways, tables aside. */
export async function overflowCheck(page: Page): Promise<Finding[]> {
  const problems = await inPage<string[]>(page, 'overflow');
  return problems.map((problem) =>
    finding('DESIGN-R-005', 'mandatory', problem),
  );
}

/** R-006: on an entry page the H1 ends inside the first viewport. */
export async function firstViewport(page: Page): Promise<Finding[]> {
  const found = await inPage<{
    height: number;
    h1: number | null;
  }>(page, 'firstViewport');
  const findings: Finding[] = [];
  if (found.h1 === null)
    findings.push(finding('DESIGN-R-006', 'mandatory', 'the page has no h1'));
  else if (found.h1 > found.height)
    findings.push(
      finding(
        'DESIGN-R-006',
        'mandatory',
        `the h1 ends at ${Math.round(found.h1)}, below the first ${found.height}`,
        'h1',
      ),
    );
  return findings;
}

/** R-007: body text at least 14px; wrapped paragraphs 45 to 90 characters a line. */
export async function typography(page: Page): Promise<Finding[]> {
  const { small, measure } = await inPage<{
    small: { element: string; size: number }[];
    measure: { element: string; chars: number }[];
  }>(page, 'typography');
  return [
    ...small.map((s) =>
      finding(
        'DESIGN-R-007',
        'warning',
        `text is ${s.size}px; body text is at least 14px`,
        s.element,
      ),
    ),
    ...measure.map((m) =>
      finding(
        'DESIGN-R-007',
        'warning',
        `paragraph runs about ${m.chars} characters a line; keep 45 to 90`,
        m.element,
      ),
    ),
  ];
}

/** R-008: every computed color is a theme color; the accent fills at most a tenth of the first viewport. */
export async function colorVariables(
  page: Page,
  theme: { all: Set<string>; accent: Set<string> },
): Promise<Finding[]> {
  const { stray, accentShare } = await inPage<{
    stray: { element: string; property: string; hex: string }[];
    accentShare: number;
  }>(page, 'colors', {
    allowed: [...theme.all].map((h) => h.toUpperCase()),
    accent: [...theme.accent].map((h) => h.toUpperCase()),
  });
  const findings = stray.map((s) =>
    finding(
      'DESIGN-R-008',
      'warning',
      `${s.property} ${s.hex} is not a theme color`,
      s.element,
    ),
  );
  if (accentShare > 0.1)
    findings.push(
      finding(
        'DESIGN-R-008',
        'warning',
        `the accent fills ${Math.round(accentShare * 100)}% of the first viewport; keep it to 10%`,
      ),
    );
  return findings;
}

/** R-009: two targets closer than 8px, edge to edge. */
export async function targetGaps(page: Page): Promise<Finding[]> {
  const pairs = await inPage<{ a: string; b: string; gap: number }[]>(
    page,
    'targetGaps',
  );
  return pairs.map((pair) =>
    finding(
      'DESIGN-R-009',
      'mandatory',
      `${pair.a} and ${pair.b} are ${pair.gap}px apart; controls sit at least 8px apart`,
      pair.a,
    ),
  );
}

/** R-012: a number that stands alone in the text font. */
export async function numerals(page: Page): Promise<Finding[]> {
  const found = await inPage<{ element: string; text: string }[]>(page, 'numerals');
  return found.map((n) =>
    finding(
      'DESIGN-R-012',
      'mandatory',
      `wrap the number "${n.text}" in Numeral from @packages/ui/Numeral: a number the user reads and compares is set in the mono font`,
      n.element,
    ),
  );
}

/** In the main region, R-010: a container's gap over the gap of the container around it. R-011: a container's padding under its own gap. */
export async function containerSpacing(page: Page): Promise<Finding[]> {
  const { nesting, padding } = await inPage<{
    nesting: { element: string; gap: number; parent: string; outer: number }[];
    padding: { element: string; padding: number; gap: number }[];
  }>(page, 'containerSpacing');
  return [
    ...nesting.map((n) =>
      finding(
        'DESIGN-R-010',
        'mandatory',
        `gap ${n.gap}px inside ${n.parent}, whose gap is ${n.outer}px; a group's gap is at most its parent's`,
        n.element,
      ),
    ),
    ...padding.map((p) =>
      finding(
        'DESIGN-R-011',
        'mandatory',
        `padding ${p.padding}px with a gap of ${p.gap}px; a container's padding is at least its gap`,
        p.element,
      ),
    ),
  ];
}
