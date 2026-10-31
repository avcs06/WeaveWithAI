import { describe, expect, it } from 'vitest';
import { briefReviewGuides } from './01brief/prompts/index';
import { themeReviewGuides } from './02theme/prompts/index';
import { planReviewGuides } from './03architect/prompts/index';
import { catalogReviewGuides } from './04catalog/prompts/index';
import { screenReviewGuides } from './05screen/prompts/index';
import { componentReviewGuides } from './06invent/prompts/index';
import { widgetReviewGuides } from './07draw/prompts/index';
import { frameReviewGuides } from './08frame/prompts/index';

describe('design review guides', () => {
  const guides = {
    brief: briefReviewGuides(),
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

  it('give the peer to the creative calls alone: the brief, the theme, the architect and invent', () => {
    expect(
      Object.entries(guides)
        .filter(([, g]) => g.peer)
        .map(([stage]) => stage),
    ).toEqual(['brief', 'theme', 'architect', 'invent']);
  });
});
