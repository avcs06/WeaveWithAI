import type { Brief } from '../01theme/schema';

/** Each mutation copies the reading-list brief and breaks one brief rule. */
const briefEdit =
  (change: (copy: Brief) => void) =>
  (value: Brief): Brief => {
    const copy = structuredClone(value);
    change(copy);
    return copy;
  };

export const briefMutations: Record<string, (brief: Brief) => Brief> = {
  'BRIEF-001': briefEdit((b) => (b.seedHue = 400)),
  'BRIEF-002': briefEdit((b) => (b.entities = b.entities.slice(0, 1))),
  'BRIEF-003': briefEdit((b) => (b.entities[1]!.hue = 210)),
  'BRIEF-005': briefEdit((b) => (b.fonts.ui = b.fonts.ui.slice(0, 1))),
  'BRIEF-007': briefEdit((b) => (b.statusHues.error = 200)),
};
