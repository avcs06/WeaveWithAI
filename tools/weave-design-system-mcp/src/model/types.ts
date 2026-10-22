/**
 * The design-system model: config, adapters, and the lookup API. Nothing
 * under `model/` imports from `@modelcontextprotocol/*` — this layer is
 * meant to be reusable by something other than an MCP server later (a CLI,
 * a lint rule).
 */

export type Severity = 'error' | 'warning';

/** Where a `validate()` finding was seen. Not a fixed enum of the whole domain — just the surfaces this server walks. */
export type Surface = 'vanilla-extract' | 'jsx' | 'tailwind';

/** The repository's Tailwind rules, supplied by the host workspace. Omitted fields leave only the built-in syntax checks. */
export interface TailwindPolicy {
  /** The only utilities a design-system file may use. */
  layoutClasses?: ReadonlySet<string>;
  forbiddenClasses?: ReadonlySet<string>;
  maxClassListLength?: number;
  maxClassListsPerElement?: number;
  isValidClass?: (className: string) => boolean;
  /** The class that applies a token's value, when Tailwind generates one. */
  tokenClass?: (token: DesignToken) => string | undefined;
}

/** A Tailwind class and the exact declarations it generates. */
export interface TailwindEquivalent {
  className: string;
  declarations: Record<string, string>;
}

/** The repository's vanilla-extract rules, supplied by the host workspace. */
export interface VanillaExtractPolicy {
  /** Declarations an allowed Tailwind class expresses exactly, which must use that class instead. */
  tailwindEquivalents?: TailwindEquivalent[];
  /** Properties that may never appear in a style object. */
  forbiddenProperties?: Set<string>;
}

export interface DesignToken {
  /** Semantic dot path, e.g. "color.theme.background" or "spacing.x6". */
  name: string;
  /**
   * Whatever the token source calls this group (color, spacing, iconSize,
   * zIndex, ...). Deliberately not a fixed enum — a real design system's
   * category set isn't knowable in advance, and assuming one (e.g. that
   * "shadow" or "motion" always exist) breaks on systems that don't have it.
   */
  group: string;
  /** The exact code an agent should write to use this token in a style file, e.g. "tokens.spacing.x6" or "vars.color.theme.background". */
  reference: string;
  /** The Tailwind class that applies this token, e.g. "text-base-muted", when one exists. */
  className?: string;
  /**
   * Resolved literal value (hex, px, ...), when the source can actually see
   * one statically. Not guaranteed: a vanilla-extract theme *contract* only
   * declares shape (`createThemeContract`), and the values a `createTheme`
   * call resolves to may come from a computed expression the adapter can't
   * evaluate — those tokens still have a name/reference, just no `value`.
   * `nearestToken()` (see `DesignSystem`) can only suggest among tokens that
   * do have one.
   */
  value?: string;
}

/** A `packages` entry: an installed package whose components join the inventory. */
export interface PackageConfig {
  package: string;
  /** `"*"` or omitted for every component the package exports, or specific names. */
  names?: '*' | string[];
}

export interface ComponentProp {
  name: string;
  type: string;
  required: boolean;
  default?: string;
  description?: string;
  /** Present when this is a variant-like prop: the closed set of allowed literal values. */
  allowedValues?: string[];
}

export interface ComponentContract {
  name: string;
  category: string;
  description: string;
  props: ComponentProp[];
  /** Subset of `props` names considered variant-like (i.e. have `allowedValues`). */
  variantProps: string[];
  /**
   * What this component declares invalid to reach for in its place — a
   * native element it supersedes (`@invalidAlternative button`), another
   * component it replaces, or several. Using one directly is an error: the
   * design system has this component for exactly that job.
   */
  invalidAlternatives: string[];
  /** Absolute path of the file declaring the component, when it came from one. */
  filePath?: string;
}

/**
 * Working examples of a component as the project uses it: a recipe file kept
 * beside the component, served as written, with one case per distinct use
 * and when to use it. An agent adapts the case that fits instead of
 * assembling the component from its props.
 */
export interface Recipe {
  /** The file's base name, e.g. "Table" for `Table.recipe.tsx`. */
  name: string;
  /** Path relative to the config's folder. */
  file: string;
  /** The components it shows: every component declared in its folder. */
  covers: string[];
  /** The recipe's source. */
  code: string;
}

export interface Finding {
  /** Stable rule id, e.g. "hardcoded-literal" | "unknown-variant". */
  rule: string;
  severity: Severity;
  surface: Surface;
  line: number;
  column: number;
  message: string;
  /** The exact fix, when derivable from the reverse index — e.g. a token reference. */
  suggestion?: string;
}

/** One known scenario a validator checks: its own file under `<adapter>/rules/`, listed in that adapter. */
export type Rule<Subject> = (subject: Subject) => Finding[];

export interface ValidateResult {
  ok: boolean;
  findings: Finding[];
}

export interface ComponentSummary {
  name: string;
  description: string;
  category: string;
  variantProps: string[];
}

/** One ranked result from `searchTokens`/`searchComponents`. */
export interface SearchHit {
  kind: 'token' | 'component';
  name: string;
  description: string;
  /** A token's Tailwind class, when one applies it. */
  className?: string;
  /** Relevance, higher is better — an exact name match outranks a substring match, which outranks a body-text match. */
  score: number;
}

/** The MCP-independent lookup API. `mcp/server.ts` only calls this and formats the result. */
export interface DesignSystem {
  tokens(group?: string): DesignToken[];
  /** Nearest token to a raw value within a group, for `Finding.suggestion`. Only searches tokens that have a resolved `value`. */
  nearestToken(value: string, group: string): DesignToken | undefined;
  components(category?: string): ComponentSummary[];
  component(name: string): ComponentContract | undefined;
  /** Fuzzy component name matches. */
  closestComponents(name: string, limit?: number): string[];
  /** The recipe named `name`, or the one covering the component named `name`. */
  recipe(name: string): Recipe | undefined;
  /** Every recipe's name. */
  recipes(): string[];
  /** Ranked token search across name, group, reference and value — for "is there a token for X?" */
  searchTokens(query: string, limit?: number): SearchHit[];
  /** Ranked component search across name, description, category and prop names — for "is there a component for X?" */
  searchComponents(query: string, limit?: number): SearchHit[];
  validate(code: string, filename?: string): ValidateResult;
}
