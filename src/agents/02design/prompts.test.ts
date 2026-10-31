import { describe, expect, it } from 'vitest';
import { themeReviewGuides } from './01theme/prompts/index';
import { planReviewGuides } from './02architect/prompts/index';
import { catalogReviewGuides } from './03catalog/prompts/index';
import { screenReviewGuides } from './04screen/prompts/index';
import { componentReviewGuides } from './05invent/prompts/index';
import { widgetReviewGuides } from './06draw/prompts/index';
import { frameReviewGuides } from './07frame/prompts/index';

describe('design review guides', () => {
  const guides = {
    theme: themeReviewGuides(),
    architect: planReviewGuides(),
    catalog: catalogReviewGuides(),
    screen: screenReviewGuides(),
    invent: componentReviewGuides(),
    draw: widgetReviewGuides(),
    frame: frameReviewGuides(),
  };

  it('keep the notes out; each peer judges decisions, each output reviewer reads for meaning', () => {
    for (const [stage, { peer, output }] of Object.entries(guides)) {
      for (const guide of [peer ?? '', output]) {
        expect(guide, stage).not.toContain('{{');
        expect(guide, stage).not.toContain('<!--');
      }
      if (peer) expect(peer, stage).toContain('you judge');
      expect(output, stage).toContain('no validator can catch');
    }
  });

  it('give the peer to the creative calls alone: the theme, the architect and invent', () => {
    expect(
      Object.entries(guides)
        .filter(([, g]) => g.peer)
        .map(([stage]) => stage),
    ).toEqual(['theme', 'architect', 'invent']);
  });
});
