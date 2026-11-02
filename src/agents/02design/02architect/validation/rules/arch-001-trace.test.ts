import { describe, expect, it } from 'vitest';
import { runRules } from '../../../../../core/rules';
import { architecture, flows, scope } from '../../../__fixtures__/chain';
import { rule } from './arch-001-trace';

describe('ARCH-001', () => {
  const at = (change: (a: typeof architecture) => void) => {
    const copy = structuredClone(architecture);
    change(copy);
    return runRules([rule], { architecture: copy, scope, flows }).map((issue) => [issue.at, issue.message]);
  };

  it('passes every frame, screen and dialog of the reading-list design', () => {
    expect(at(() => {})).toEqual([]);
  });

  it("passes a step told in the words of the flows' alternative paths or of a record's statuses", () => {
    expect(
      at((a) =>
        a.screens[0]!.alternatives.push({
          when: 'saving fails',
          steps: ['Reads that saving failed and sees the typed values kept.', 'Reads that it is finished.'],
        }),
      ),
    ).toEqual([]);
  });

  it('fails a step that names only what no flow gives the user, in a frame or in an alternative', () => {
    expect(at((a) => a.frames[1]!.steps.push('Can open Help, which shows help information.'))).toEqual([
      [
        'FR02.steps[2]',
        'FR02: "Can open Help, which shows help information." names nothing the scope and the flows have. A step names what a flow gives the user there; drop what no flow has.',
      ],
    ]);
    expect(at((a) => a.screens[0]!.alternatives.push({ when: 'signed in', steps: ['Can open Settings.'] }))).toEqual([
      ['S01.alternatives[0].steps[0]', 'S01: "Can open Settings." names nothing the scope and the flows have. A step names what a flow gives the user there; drop what no flow has.'],
    ]);
  });
});
