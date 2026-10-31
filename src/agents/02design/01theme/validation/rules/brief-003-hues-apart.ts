import type { Issue } from '../../../../../core/issues';
import { defineRule, issue } from '../../../../../core/rules';
import type { BriefInput } from '../helpers';

/** The fixed status colors' hue bands, OKLCH degrees, as the brief prompt names them. */
const STATUS_BANDS: [string, number, number][] = [
  ['error', 0, 45],
  ['warning', 65, 100],
  ['success', 135, 180],
];
const MIN_APART = 30;

/** Degrees between two hues around the wheel. */
const apart = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
};

/**
 * BRIEF-003 · mandatory (a hue in a status band is a warning)
 * Colored entities are at least 30 degrees from each other and from the brand
 * hue, so users tell them apart at a glance; a brand or entity hue inside a
 * status color's band warns, and the reviewers judge whether the idea asks for it.
 * Pass: brand 200, Shelf 230.
 * Fail: brand 200, Shelf 210.
 */
export const rule = defineRule<BriefInput>(
  'BRIEF-003',
  'mandatory',
  ({ brief }, fail) => {
    const issues: Issue[] = [];
    const hues = [
      { name: 'the brand', at: 'seedHue', hue: brief.seedHue },
      ...brief.entities
        .filter((entity) => entity.colored)
        .map((entity) => ({ name: entity.noun, at: entity.noun, hue: entity.hue })),
    ];
    hues.forEach((one, i) => {
      for (const other of hues.slice(0, i))
        if (apart(one.hue, other.hue) < MIN_APART)
          issues.push(
            fail(
              `${one.name} at ${one.hue} is ${apart(one.hue, other.hue)} degrees from ${other.name} at ${other.hue}; keep colored hues at least ${MIN_APART} apart.`,
              one.at,
            ),
          );
      const band = STATUS_BANDS.find(([, low, high]) => one.hue >= low && one.hue <= high);
      if (band)
        issues.push(
          issue(
            'BRIEF-003',
            'warning',
            `${one.name} at ${one.hue} sits in the ${band[0]} color's band; keep it apart unless the idea asks for it.`,
            one.at,
          ),
        );
    });
    return issues;
  },
);
