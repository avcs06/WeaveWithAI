import { describe, expect, it } from 'vitest';
import { briefReviewGuides } from './01brief/prompts/index';
import { themeReviewGuides } from './02theme/prompts/index';
import { iaReviewGuides } from './03architect/prompts/index';
import { componentReviewGuides } from './06invent/prompts/index';
import { widgetReviewGuides } from './07draw/prompts/index';

describe('design review guides', () => {
  const guides = [
    briefReviewGuides(),
    themeReviewGuides(),
    iaReviewGuides(),
    widgetReviewGuides(),
    componentReviewGuides(),
  ];

  it('keep the notes out; the peer challenges the decisions, the output reviewer reads for meaning', () => {
    for (const { peer, output } of guides) {
      for (const guide of [peer ?? '', output]) {
        expect(guide).not.toContain('{{');
        expect(guide).not.toContain('<!--');
      }
      if (peer) expect(peer).toContain('Challenge, and report as a blocker');
      expect(output).toContain('no validator can catch');
    }
  });

  it('give the widget and component calls the output reviewer alone', () => {
    expect(widgetReviewGuides().peer).toBeUndefined();
    expect(componentReviewGuides().peer).toBeUndefined();
    expect(iaReviewGuides().peer).toContain('information architecture');
  });

  it('give the output reviewers the layout heuristics no validator checks: H-53 the IA, H-42 the widgets', () => {
    expect(iaReviewGuides().output).toContain('H-53');
    expect(widgetReviewGuides().output).toContain('H-42');
  });
});
