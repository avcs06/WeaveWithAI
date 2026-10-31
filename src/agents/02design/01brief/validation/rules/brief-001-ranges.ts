import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import type { BriefInput } from '../helpers';

/**
 * BRIEF-001 · mandatory
 * The seed, base, page and frame hues and the colored entities' hues are within 0 to 360;
 * personality has 3 to 5 words, feel 1 or 2; at most 3 entities are colored.
 * Pass: seedHue 200, four adjectives, one feel word, one colored entity.
 * Fail: seedHue 400.
 */
export const rule = defineRule<BriefInput>(
  'BRIEF-001',
  'mandatory',
  ({ brief }, fail) => {
    const issues: Issue[] = [];
    const hue = (value: number) => value >= 0 && value <= 360;
    const colored = brief.entities.filter((entity) => entity.colored);
    for (const field of ['seedHue', 'baseHue', 'pageHue', 'frameHue'] as const)
      if (!hue(brief[field]))
        issues.push(
          fail(
            `${field} is ${brief[field]}; give a hue in degrees, 0 to 360.`,
            field,
          ),
        );
    for (const entity of colored)
      if (!hue(entity.hue))
        issues.push(
          fail(
            `${entity.noun} has hue ${entity.hue}; give a hue in degrees, 0 to 360.`,
            entity.noun,
          ),
        );
    const words = brief.personality.length;
    if (words < 3 || words > 5)
      issues.push(
        fail(
          `personality has ${words} words; give 3 to 5 adjectives.`,
          'personality',
        ),
      );
    if (brief.feel.length < 1 || brief.feel.length > 2)
      issues.push(
        fail(
          `feel has ${brief.feel.length} words; give 1 or 2 for the site's style.`,
          'feel',
        ),
      );
    if (colored.length > 3)
      issues.push(
        fail(
          `${colored.length} entities are colored; color at most 3, the ones users must tell apart at a glance.`,
          'entities',
        ),
      );
    return issues;
  },
);
