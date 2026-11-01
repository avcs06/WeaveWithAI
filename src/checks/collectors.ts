import AxeBuilder from '@axe-core/playwright';
import type { Page } from 'playwright-core';
import { inPage } from './page';
import { type Finding, finding } from './types';

// DESIGN-R-001, 002 and 004 to 009 (specs/design.md "Rendered checks"): each
// measures one open page and returns findings plus the numbers behind them,
// so the coding gate, the app MCP and the benchmark read the same
// collectors. The keyboard walk, R-003, is keyboard.ts.

type AxeViolation = Awaited<
  ReturnType<AxeBuilder['analyze']>
>['violations'][number];

/** R-001: axe on WCAG 2.0 to 2.2 A and AA; serious and critical violations are mandatory. */
export async function axeCheck(
  page: Page,
): Promise<{ findings: Finding[]; violations: AxeViolation[] }> {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
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
  return { findings, violations };
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

/** R-004: a control under 24 by 24 fails. */
export async function targetSizes(
  page: Page,
): Promise<{ findings: Finding[]; small24: number }> {
  const targets = await inPage<
    { element: string; width: number; height: number }[]
  >(page, 'targets');
  const small24 = targets.filter((t) => Math.min(t.width, t.height) < 24);
  const findings = small24.map((t) =>
    finding(
      'DESIGN-R-004',
      'mandatory',
      `target is ${t.width} by ${t.height}; at least 24 by 24`,
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

/** R-006: on an entry page the H1 and a primary action end inside the first viewport. */
export async function firstViewport(
  page: Page,
  primaryTestIds: string[],
): Promise<Finding[]> {
  const found = await inPage<{
    height: number;
    h1: number | null;
    primaries: { id: string; bottom: number | null }[];
  }>(page, 'firstViewport', primaryTestIds);
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
  const shown = found.primaries.filter(
    (p) => p.bottom !== null && p.bottom <= found.height,
  );
  if (primaryTestIds.length && !shown.length)
    findings.push(
      finding(
        'DESIGN-R-006',
        'mandatory',
        `no primary action (${primaryTestIds.join(', ')}) in the first ${found.height}`,
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

/** R-009: sections stand further apart than the blocks inside them. */
export async function proximity(page: Page): Promise<Finding[]> {
  const pairs = await inPage<
    { sections: [string, string]; between: number; inside: number }[]
  >(page, 'proximity');
  return pairs
    .filter((p) => p.between <= p.inside)
    .map((p) =>
      finding(
        'DESIGN-R-009',
        'warning',
        `${p.sections[1]} is ${p.between} below ${p.sections[0]}, not more than the ${p.inside} inside them`,
        p.sections[1],
      ),
    );
}
