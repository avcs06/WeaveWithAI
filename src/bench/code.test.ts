import { describe, expect, it } from 'vitest';
import { linesByOrigin, parseJscpd, parseValidate, summarizeEslint } from './code';

describe('the code quality parsers', () => {
  it('reads validate findings by severity and rule from its text output', () => {
    const text = [
      'ok   web/app/page.tsx',
      'FAIL web/app/books/page.tsx',
      '     12:4 error invalid-alternative: <button> has a design-system component.',
      '     → Use Button from @packages/ui/Button.',
      '     30:1 warning no-literal-color: #fff is not a token.',
      '     31:1 error invalid-alternative: <input> has a design-system component.',
    ].join('\n');
    expect(parseValidate(text)).toEqual({ errors: 2, warnings: 1, byRule: { 'invalid-alternative': 2, 'no-literal-color': 1 } });
  });

  it('sums ESLint messages by severity and rule, a parse error under its own name', () => {
    const results = [
      { messages: [{ ruleId: 'react-hooks/rules-of-hooks', severity: 2 }, { ruleId: 'no-console', severity: 1 }] },
      { messages: [{ ruleId: null, severity: 2 }] },
    ];
    expect(summarizeEslint(results)).toEqual({ errors: 2, warnings: 1, byRule: { 'react-hooks/rules-of-hooks': 1, 'no-console': 1, parse: 1 } });
  });

  it('takes the duplicated share and the longest clone from jscpd, and zero clones from an empty report', () => {
    expect(parseJscpd({ statistics: { total: { percentage: 5.78 } }, duplicates: [{ lines: 12 }, { lines: 31 }] })).toEqual({ percentage: 5.78, count: 2, maxLines: 31 });
    expect(parseJscpd({ statistics: { total: { percentage: 0 } }, duplicates: [] })).toEqual({ percentage: 0, count: 0, maxLines: 0 });
  });

  it("counts a file's lines under its last ledger origin, and a file the ledger never names as the template's", () => {
    const ledger = [
      { path: 'web/app/page.tsx', origin: 'code' },
      { path: 'web/app/page.tsx', origin: 'model' },
      { path: 'web/app/entities/book/store.ts', origin: 'code' },
    ];
    const lines = { 'web/app/page.tsx': 40, 'web/app/entities/book/store.ts': 20, 'web/app/layout.tsx': 10 };
    expect(linesByOrigin(lines, ledger)).toEqual({ template: 10, code: 20, model: 40 });
  });
});
