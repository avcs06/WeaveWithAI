import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

import { createDesignSystem } from './design-system.js';
import type { DesignSystem } from './types.js';

// Runs against the synthetic design system the README's worked example and
// `examples/synthetic-design-system/` share, so example changes get exercised.
const __dirname = dirname(fileURLToPath(import.meta.url));
const EXAMPLE = join(__dirname, '..', '..', 'examples', 'synthetic-design-system');

let system: DesignSystem;
const config = {
  tokens: ['theme.css.ts', 'tokens.ts'],
  components: ['components/**/*.tsx'],
  recipes: ['components/**/*.recipe.tsx'],
  invalidAlternatives: 'invalid-alternatives.json',
  configDir: EXAMPLE,
};

beforeAll(() => {
  system = createDesignSystem(config);
});

describe('tokens', () => {
  it('lists tokens across all configured sources', () => {
    expect(system.tokens().length).toBeGreaterThan(0);
  });

  it('filters by group', () => {
    const spacing = system.tokens('spacing');
    expect(spacing.length).toBeGreaterThan(0);
    expect(spacing.every((t) => t.group === 'spacing')).toBe(true);
  });

  it('carries a resolved value from createGlobalTheme', () => {
    const accent = system.tokens('color').find((t) => t.name === 'color.accent');
    expect(accent?.value).toBe('#3B5BDB');
    expect(accent?.reference).toBe('vars.color.accent');
  });
});

describe('nearestToken', () => {
  it('finds the closest spacing token by numeric proximity', () => {
    expect(system.nearestToken('7px', 'spacing')?.name).toBe('spacing.sm');
  });

  it('finds the closest color token by color distance', () => {
    expect(system.nearestToken('#3b5bdc', 'color')?.name).toBe('color.accent');
  });

  it('returns undefined for a group with no valued tokens', () => {
    expect(system.nearestToken('anything', 'not-a-real-group')).toBeUndefined();
  });
});

describe('components', () => {
  it('returns the full contract for a known component', () => {
    const button = system.component('Button');
    expect(button?.name).toBe('Button');
    expect(button?.variantProps.sort()).toEqual(['size', 'variant']);
  });

  it('excludes props inherited from native HTML attributes', () => {
    const button = system.component('Button');
    expect(button?.props.some((p) => p.name === 'variant')).toBe(true);
    expect(button?.props.some((p) => p.name === 'onClick')).toBe(false);
  });

  it('says whether a data-testid set on the component reaches the DOM', () => {
    // Button takes the button's attributes and spreads them; Stack takes none and spreads nothing.
    expect(system.component('Button')?.passesHtmlAttributes).toBe(true);
    expect(system.component('Stack')?.passesHtmlAttributes).toBe(false);
  });

  it('returns undefined, plus closest matches, for an unknown name', () => {
    expect(system.component('Buttn')).toBeUndefined();
    expect(system.closestComponents('Buttn')).toContain('Button');
  });
});

describe('validate — vanilla-extract surface', () => {
  it('accepts the real example Button.css.ts (every governed property already uses a token)', () => {
    const code = readFileSync(join(EXAMPLE, 'components', 'Button.css.ts'), 'utf8');
    expect(system.validate(code)).toEqual({ ok: true, findings: [] });
  });

  it('flags a hardcoded color with the nearest token as a suggestion', () => {
    const code = `
      import { style } from '@vanilla-extract/css';
      export const bad = style({ color: '#3b5bdc' });
    `;
    const result = system.validate(code);
    expect(result.ok).toBe(false);
    expect(result.findings).toEqual([
      expect.objectContaining({
        rule: 'hardcoded-literal',
        surface: 'vanilla-extract',
        suggestion: 'vars.color.accent',
      }),
    ]);
  });

  it('flags a hardcoded value nested inside a styleVariants()/selectors tree', () => {
    const code = `
      import { styleVariants } from '@vanilla-extract/css';
      export const bad = styleVariants({
        danger: { padding: '7px', selectors: { '&:hover': { borderRadius: '3px' } } },
      });
    `;
    const result = system.validate(code);
    expect(result.findings.map((f) => f.message).join('\n')).toContain('padding: 7px');
    expect(result.findings.map((f) => f.message).join('\n')).toContain('borderRadius: 3px');
  });

  it('flags a hardcoded value in recipe() (a separate package from style()/styleVariants())', () => {
    const code = `
      import { recipe } from '@vanilla-extract/recipes';
      export const bad = recipe({ base: { padding: '7px' } });
    `;
    const result = system.validate(code);
    expect(result.ok).toBe(false);
    expect(result.findings[0]?.message).toContain('padding: 7px');
  });

  it("flags a hardcoded value nested inside quoted selector keys (e.g. '&:hover')", () => {
    const code = `
      import { style } from '@vanilla-extract/css';
      export const bad = style({
        selectors: { '&:hover, &:focus': { padding: '7px' } },
      });
    `;
    expect(system.validate(code).findings[0]?.message).toContain('padding: 7px');
  });

  it('still finds a style()-defining call under a renamed import binding', () => {
    const code = `
      import { style as s } from '@vanilla-extract/css';
      export const bad = s({ padding: '7px' });
    `;
    expect(system.validate(code).findings[0]?.message).toContain('padding: 7px');
  });

  it('does not flag a value on a property with no configured token group', () => {
    const code = `
      import { style } from '@vanilla-extract/css';
      export const ok = style({ cursor: 'pointer', display: 'flex' });
    `;
    expect(system.validate(code)).toEqual({ ok: true, findings: [] });
  });

  it('ignores style()-like calls not imported from a vanilla-extract package', () => {
    const code = `
      function style(x) { return x; }
      const notVe = style({ color: '#3b5bdc' });
    `;
    expect(system.validate(code)).toEqual({ ok: true, findings: [] });
  });

  it('flags a selector that styles another element, which fails the vanilla-extract build', () => {
    const code = `
      import { style } from '@vanilla-extract/css';
      export const links = style({
        '@media': { 'screen': { selectors: { '&:hover span': { cursor: 'pointer' } } } },
        selectors: { '&:hover, & a': { cursor: 'pointer' }, [\`& \${child}\`]: { cursor: 'pointer' } },
      });
    `;
    const result = system.validate(code);
    expect(result.ok).toBe(false);
    expect(result.findings.map((f) => f.rule)).toEqual(['invalid-selector', 'invalid-selector', 'invalid-selector']);
    expect(result.findings.map((f) => f.message).join('\n')).toContain('globalStyle(`${name} a`');
  });

  it('accepts selectors that end on the style itself, and any selector in globalStyle()', () => {
    const code = `
      import { globalStyle, style } from '@vanilla-extract/css';
      export const link = style({
        selectors: {
          '&:not([data-disabled]):is(:focus-visible, :active)': { cursor: 'pointer' },
          [\`\${parent} > &\`]: { cursor: 'pointer' },
          'html[data-theme="dark"] &::before': { cursor: 'pointer' },
        },
      });
      globalStyle(\`\${link} a\`, { cursor: 'pointer' });
    `;
    expect(system.validate(code)).toEqual({ ok: true, findings: [] });
  });
});

describe('validate — a hardcoded literal with a reason', () => {
  it('allows a literal explained by a comment above it', () => {
    const code = `
      import { style } from '@vanilla-extract/css';
      export const logo = style({
        // the logo file's own color, not a theme color
        color: '#3b5bdc',
      });
    `;
    expect(system.validate(code)).toEqual({ ok: true, findings: [] });
  });

  it('allows a literal explained by a comment after it', () => {
    const code = `
      import { style } from '@vanilla-extract/css';
      export const logo = style({
        color: '#3b5bdc', // the logo file's own color
      });
    `;
    expect(system.validate(code)).toEqual({ ok: true, findings: [] });
  });

  it('allows an inline style literal with a comment', () => {
    expect(system.validate('<div style={{ padding: "7px" /* lines up with the icon */ }} />').ok).toBe(true);
  });

  it('still flags a literal with no comment, and says how to keep it', () => {
    const result = system.validate('<div style={{ padding: "7px" }} />');
    expect(result.findings[0]?.message).toContain('say why in a comment');
  });

  it('refuses a comment that only points at the design', () => {
    const result = system.validate('<div style={{ padding: "7px" /* as the mockup shows */ }} />');
    expect(result.findings[0]?.message).toContain('the design may be wrong');
  });
});

describe('validate — class lists', () => {
  const long = 'items-center justify-between gap-2 px-4 py-2 w-full';

  it('flags a class list over 50 characters', () => {
    expect(long.length).toBeGreaterThan(50);
    const result = system.validate(`<div className="${long}" />`);
    expect(result.findings.map((f) => f.rule)).toContain('tailwind-class-list-limit');
  });

  it('flags a third static class list on one element', () => {
    const result = system.validate('<div className={cn("items-center", "gap-2", "px-4")} />');
    expect(result.findings.map((f) => f.message).join()).toContain('3 static class lists');
  });

  it('skips the limits in a design-system folder only', () => {
    expect(system.validate(`<div className="${long}" />`, 'components/Button.tsx').findings).toEqual([]);
    const web = createDesignSystem({ ...config, designSystemFolders: ['packages'] });
    const result = web.validate(`<div className="${long}" />`, 'components/Button.tsx');
    expect(result.findings.map((f) => f.rule)).toContain('tailwind-class-list-limit');
  });

  it('sends a variant to vanilla-extract', () => {
    const result = system.validate('<span className="hover:underline" />');
    expect(result.findings[0]?.message).toContain('vanilla-extract');
  });
});

describe('validate — jsx surface', () => {
  it('accepts a real token reference in an inline style prop', () => {
    expect(system.validate('<div style={{ color: vars.color.accent }} />')).toEqual({
      ok: true,
      findings: [],
    });
  });

  it('flags a hardcoded value in an inline style prop', () => {
    const result = system.validate('<div style={{ padding: "7px" }} />');
    expect(result.findings[0]).toMatchObject({ rule: 'hardcoded-literal', surface: 'jsx' });
  });

  it('flags a Tailwind arbitrary-value bracket', () => {
    const result = system.validate('<span className="items-center text-[#1e1e22]" />');
    expect(result.findings[0]).toMatchObject({ rule: 'restricted-class', surface: 'tailwind' });
  });

  it('flags an arbitrary value inside a classNames()-style helper call', () => {
    const code = 'const el = <span className={classNames("block", isActive && "p-[13px]")} />;';
    expect(system.validate(code).findings[0]?.message).toContain('[13px]');
  });

  it('accepts a plain Tailwind utility class', () => {
    expect(system.validate('<span className="items-center gap-2" />')).toEqual({
      ok: true,
      findings: [],
    });
  });
});

describe('validate — non-default variants', () => {
  it('passes a variant left out or set to its default', () => {
    expect(system.validate('<Button />', 'app/page.tsx').findings).toEqual([]);
    expect(system.validate('<Button variant="primary" />', 'app/page.tsx').findings).toEqual([]);
  });

  it('asks for a reason when app code picks another valid variant', () => {
    const [finding] = system.validate('<Button variant="danger" />', 'app/page.tsx').findings;
    expect(finding).toMatchObject({ rule: 'non-default-variant' });
    expect(finding?.message).toContain('not Button\'s default ("primary")');
  });

  it("passes the author's own reason, and refuses the design as one", () => {
    const own = '<Button\n  // deleting a client cannot be undone\n  variant="danger"\n/>';
    expect(system.validate(own, 'app/page.tsx').findings).toEqual([]);
    const design = '<Button\n  // the design asks for a red button\n  variant="danger"\n/>';
    expect(system.validate(design, 'app/page.tsx').findings[0]?.message).toContain('the design may be wrong');
  });

  it('leaves design-system code and recipes their own choices', () => {
    expect(system.validate('<Button variant="danger" />', 'components/Stack.tsx').findings).toEqual([]);
    expect(system.validate('<Button variant="danger" />', 'components/Button.recipe.tsx').findings).toEqual([]);
  });
});

describe('validate — unknown-variant', () => {
  it('accepts a variant value in the allowed set', () => {
    const rules = system.validate('<Button variant="secondary" size="lg" />').findings.map((f) => f.rule);
    expect(rules).not.toContain('unknown-variant');
  });

  it('flags a variant value outside the allowed set, naming the legal alternatives', () => {
    const result = system.validate('<Button variant="warning">Click</Button>');
    expect(result.ok).toBe(false);
    expect(result.findings[0]?.message).toBe(
      'variant must be one of primary | secondary | danger, got "warning".',
    );
  });

  it('does not fire for an unrecognized component', () => {
    expect(system.validate('<TotallyMadeUp variant="whatever" />')).toEqual({
      ok: true,
      findings: [],
    });
  });
});

describe('validate — never throws', () => {
  it('returns a parse-error finding for unparseable input instead of throwing', () => {
    const result = system.validate('<<<not parseable{{{');
    expect(result.ok).toBe(false);
    expect(result.findings[0]?.rule).toBe('parse-error');
  });

  it('handles empty input cleanly', () => {
    expect(system.validate('')).toEqual({ ok: true, findings: [] });
  });
});

describe('search', () => {
  it('ranks an exact token name above a mere substring match', () => {
    const hits = system.searchTokens('color.accent');
    expect(hits[0]?.name).toBe('color.accent');
    expect(hits[0]?.score).toBeGreaterThan(hits[1]?.score ?? 0);
  });

  it('finds a token by a fragment of its name', () => {
    expect(system.searchTokens('accent').map((h) => h.name)).toContain('color.accent');
  });

  it('finds a component by description text, not just its name', () => {
    expect(system.searchComponents('triggering an action').map((h) => h.name)).toContain('Button');
  });

  it('respects the limit and returns nothing for a blank query', () => {
    expect(system.searchTokens('color', 2)).toHaveLength(2);
    expect(system.searchTokens('   ')).toEqual([]);
  });
});

describe('validate — invalid alternatives (wrong implementation)', () => {
  it('errors on a native element a component declares itself the replacement for', () => {
    const result = system.validate('<button onClick={go}>Save</button>');
    expect(result.ok).toBe(false);
    expect(result.findings[0]).toMatchObject({
      rule: 'invalid-alternative',
      severity: 'error',
      suggestion: 'Button',
    });
  });

  it('leaves an element no component claims alone', () => {
    expect(system.validate('<span>hello</span>')).toEqual({ ok: true, findings: [] });
  });

  it('flags a superseded component, not just a native element', () => {
    // Button declares `button, MuiButton`: a declaration may name another
    // library's component, not just a tag.
    expect(system.component('Button')?.invalidAlternatives).toEqual(['button', 'MuiButton']);
    expect(system.validate('<MuiButton />').findings[0]).toMatchObject({
      rule: 'invalid-alternative',
      severity: 'error',
      suggestion: 'Button',
    });
  });

  it('flags a tag+class combination, and leaves the same tag without that class alone', () => {
    // Flex declares `div.flex`: a bare <div> is fine, a <div className="flex"> is not.
    expect(system.validate('<div />')).toEqual({ ok: true, findings: [] });

    const result = system.validate('<div className="flex items-center" />');
    expect(result.ok).toBe(false);
    expect(result.findings[0]).toMatchObject({
      rule: 'invalid-alternative',
      severity: 'error',
      suggestion: 'Flex',
    });
    expect(result.findings[0]?.message).toContain('div.flex');
  });

  it('matches a combination however the className expression is written', () => {
    for (const code of [
      '<div className={`flex ${extra}`} />',
      // Any helper: the walk never looks at what the call is named.
      '<div className={cn("flex", "items-center")} />',
      '<div className={classNames("flex", cond && "gap-2")} />',
      '<div className={twMerge(base, "flex")} />',
      '<div className={clsx(["flex", cond && "gap-2"])} />',
      // The conditional-object idiom, where the class is the key.
      '<div className={cn(base, { flex: isRow })} />',
      '<div className={clsx({ "flex": isRow })} />',
      '<div className={cond ? "flex" : "block"} />',
    ]) {
      expect(system.validate(code).findings[0]?.suggestion).toBe('Flex');
    }
  });

  it('does not fire on a tag+class combination when only some classes are present', () => {
    expect(system.validate('<div className="items-center gap-2" />')).toEqual({
      ok: true,
      findings: [],
    });
    expect(system.validate('<div className={cn({ grid: true })} />')).toEqual({
      ok: true,
      findings: [],
    });
  });
});

describe('recipes', () => {
  it('serves the recipe covering a component, as written', () => {
    const recipe = system.recipe('Button');
    expect(recipe?.name).toBe('Button');
    expect(recipe?.file).toBe(join('components', 'Button.recipe.tsx'));
    expect(recipe?.covers).toEqual(['Button']);
    expect(recipe?.code).toBe(readFileSync(join(EXAMPLE, 'components', 'Button.recipe.tsx'), 'utf8'));
  });

  it('finds a recipe by its own name, and lists every recipe', () => {
    expect(system.recipe('button')?.name).toBe('Button');
    expect(system.recipes()).toEqual(['Button']);
  });

  it('has none for a component without a recipe file of its own', () => {
    expect(system.recipe('Flex')).toBeUndefined();
  });

  it('never lists a recipe as a component', () => {
    expect(system.components().map((c) => c.name)).not.toContain('ButtonRecipe');
  });
});

describe('validate — recipes are app code', () => {
  it('flags what a component supersedes in its recipe, though its own file may use it', () => {
    // Outside the design-system folders, as for web/app/components in the template.
    const web = createDesignSystem({ ...config, designSystemFolders: ['packages'] });
    const rules = (filename: string) =>
      web.validate('<button>Save</button>', filename).findings.map((f) => f.rule);
    expect(rules('components/Button.recipe.tsx')).toContain('invalid-alternative');
    expect(rules('components/Button.tsx')).not.toContain('invalid-alternative');
  });
});

describe('validate — design-system folders', () => {
  it('checks nothing in them, recipes included, and still reads their components', () => {
    const bad = '<div style={{ padding: "7px" }}><button className="hover:underline">Save</button></div>';
    expect(system.validate(bad, 'components/Stack.tsx')).toEqual({ ok: true, findings: [] });
    expect(system.validate(bad, 'components/Button.recipe.tsx')).toEqual({ ok: true, findings: [] });
    expect(system.validate(bad, 'app/page.tsx').ok).toBe(false);
    expect(system.component('Button')).toBeDefined();
    expect(system.recipe('Button')).toBeDefined();
  });
});

describe('validate — file types', () => {
  it('parses a .ts file without JSX, so a generic arrow is not a tag', () => {
    expect(system.validate('export const id = <T>(value: T) => value;', 'utils.ts')).toEqual({
      ok: true,
      findings: [],
    });
  });
});

describe('validate — :has() and required props', () => {
  it('flags an element holding the child tag a component names with :has(), and not one without it', () => {
    const [finding] = system.validate('<nav><Button /></nav>', 'app/page.tsx').findings;
    expect(finding).toMatchObject({ rule: 'invalid-alternative', suggestion: 'Toolbar' });
    expect(finding?.message).toContain('holding <Button>');
    expect(system.validate('<nav><span /></nav>', 'app/page.tsx').findings).toEqual([]);
    // A child an expression renders counts: a .map callback, a branch, `&&` or a fragment.
    for (const code of [
      '<nav>{actions.map((a) => <Button key={a} />)}</nav>',
      '<nav>{actions?.map((a) => { return <Button key={a} />; })}</nav>',
      '<nav>{open ? <Button /> : null}</nav>',
      '<nav>{open && <><Button /></>}</nav>',
    ])
      expect(system.validate(code, 'app/page.tsx').findings).toEqual([
        expect.objectContaining({ rule: 'invalid-alternative', suggestion: 'Toolbar' }),
      ]);
    // Deeper than the callback's own element is not a child.
    expect(system.validate('<nav>{actions.map((a) => <span key={a}><Button /></span>)}</nav>', 'app/page.tsx').findings).toEqual([]);
  });

  it('flags a component used without a prop its @requiredProp names, unless a spread may carry it', () => {
    const [finding] = system.validate('<Toolbar><span /></Toolbar>', 'app/page.tsx').findings;
    expect(finding).toMatchObject({ rule: 'required-prop' });
    expect(finding?.message).toBe(
      'Toolbar takes `gap` on every use: The room between the actions; the toolbar lays out nothing without it.',
    );
    expect(system.validate('<Toolbar gap="sm"><span /></Toolbar>', 'app/page.tsx').findings).toEqual([]);
    expect(system.validate('<Toolbar {...props} />', 'app/page.tsx').findings).toEqual([]);
    expect(system.validate('<Toolbar />', 'components/Toolbar.recipe.tsx').findings).toEqual([]);
  });
});

describe('validate — field-width', () => {
  it('flags a field sized by a class inside a Form, and leaves one outside, or sized by width, alone', () => {
    const [finding] = system.validate('<Form><TextField label="Email" className="w-64" /></Form>', 'app/page.tsx').findings;
    expect(finding).toMatchObject({ rule: 'field-width' });
    expect(finding?.message).toContain('"w-64"');
    expect(finding?.message).toContain('0.5x | 1x | 2x');
    expect(system.validate('<Form><TextField label="Email" width="2x" /></Form>', 'app/page.tsx').findings).toEqual([]);
    expect(system.validate('<header><TextField label="Search" className="w-64" /></header>', 'app/page.tsx').findings).toEqual([]);
  });
});

describe('validate — an ancestor tag before a space', () => {
  it('flags the element only inside that ancestor, at any depth', () => {
    const inside = '<Form><section><div><TextField label="City" /></div></section></Form>';
    const [finding] = system.validate(inside, 'app/page.tsx').findings;
    expect(finding).toMatchObject({ rule: 'invalid-alternative', suggestion: 'FieldRow' });
    expect(finding?.message).toContain('holding <TextField>');
    expect(finding?.message).toContain('inside <Form>');
    const outside = '<header><div><TextField label="Search" /></div></header>';
    expect(system.validate(outside, 'app/page.tsx').findings).toEqual([]);
  });
});

describe('validate — generic invalid alternatives from the config file', () => {
  it('flags the pattern and says what to use instead, with no component as the suggestion', () => {
    const [finding] = system.validate('<img className="rounded-full" src={photo} alt="" />', 'app/page.tsx').findings;
    expect(finding).toMatchObject({
      rule: 'invalid-alternative',
      message: 'Use an Avatar for a person\'s picture instead of <img className="rounded-full">.',
    });
    expect(finding?.suggestion).toBeUndefined();
    expect(system.validate('<img src={photo} alt="" />', 'app/page.tsx').findings).toEqual([]);
  });

  it('covers imports too', () => {
    const [finding] = system.validate("import ReactSelect from 'react-select';", 'app/page.tsx').findings;
    expect(finding?.message).toBe('Use the Select component instead of importing directly from react-select.');
  });

  it('has no diagnostics for the example file', () => {
    expect(system.diagnostics()).toEqual([]);
  });
});
