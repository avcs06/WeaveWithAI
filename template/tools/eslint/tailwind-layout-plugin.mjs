import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { matchesGlob, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createTailwindEquivalents,
  indexEquivalents,
  equivalentCandidates,
  matchesCssValue,
} from './tailwind-equivalents.mjs';

const require = createRequire(import.meta.url);
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
    moduleResolution: 'node',
  },
});
const resolveConfig = require('tailwindcss/resolveConfig');
const { createContext } = require('tailwindcss/lib/lib/setupContextUtils');
const { generateRules } = require('tailwindcss/lib/lib/generateRules');
const {
  conditionalStyleKeys,
  forbiddenTailwindClasses,
  forbiddenVanillaExtractProperties,
  isForbiddenTailwindClass,
  isLayoutTailwindClass,
  layoutTailwindClasses,
  maxClassListLength,
  maxClassListsPerElement,
  normalizeTailwindClass,
} = require('../tailwind-policy.cjs');

// Read here, not from ESLint `files` globs: project configs re-export the root
// config, so globs would resolve per project directory. A component path's
// folder is design-system code, except recipes (app code beside it).
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const { components, recipes = [] } = JSON.parse(
  readFileSync(new URL('../../designsystem.config.json', import.meta.url), 'utf8'),
);
const recipeGlobs = recipes.map((pattern) => resolve(repoRoot, pattern));
const designSystemRoots = components
  .filter((pattern) => !pattern.startsWith('!'))
  .map((pattern) => {
    const segments = pattern.split('/');
    const wildcard = segments.findIndex((segment) => /[*?[{]/.test(segment));
    return resolve(repoRoot, segments.slice(0, wildcard === -1 ? -1 : wildcard).join('/'));
  });
export const isDesignSystemFile = (filename) =>
  !recipeGlobs.some((glob) => matchesGlob(filename, glob)) &&
  designSystemRoots.some((root) => !relative(root, filename).startsWith('..'));

const tailwindConfig = resolveConfig({
  presets: [require('../../tailwind.preset.cjs')],
  content: [],
});
const tailwindContext = createContext(tailwindConfig);

const tailwindCandidateCache = new Map();
const isTailwindCandidate = (className) => {
  const normalized = normalizeTailwindClass(className);
  if (tailwindCandidateCache.has(normalized))
    return tailwindCandidateCache.get(normalized);
  const valid = [...generateRules(new Set([normalized]), tailwindContext)].length > 0;
  tailwindCandidateCache.set(normalized, valid);
  return valid;
};

// Token group -> the theme sections whose classes apply it: [section, prefix, CSS property].
const tokenClassSources = {
  color: [
    ['textColor', 'text', 'color'],
    ['backgroundColor', 'bg', 'background-color'],
    ['borderColor', 'border', 'border-color'],
  ],
  fontFamily: [['fontFamily', 'font', 'font-family']],
  fontSize: [['fontSize', 'text', 'font-size']],
  fontWeight: [['fontWeight', 'font', 'font-weight']],
  lineHeight: [['lineHeight', 'leading', 'line-height']],
  radius: [['borderRadius', 'rounded', 'border-radius']],
  zIndex: [['zIndex', 'z', 'z-index']],
};

const singleDeclaration = (className) => {
  const rules = [...generateRules(new Set([className]), tailwindContext)].map(([, rule]) => rule);
  if (rules.length !== 1 || rules[0].type !== 'rule') return undefined;
  const declarations = rules[0].nodes.filter(
    (node) => node.type === 'decl' && !node.prop.startsWith('--'),
  );
  return declarations.length === 1 ? declarations[0] : undefined;
};

// `group\0value` -> classes applying it, in theme order. Matched on the CSS a
// class generates, not its name: `font-display` is a family, not weight 600.
const tokenClassIndex = new Map();
for (const [group, sources] of Object.entries(tokenClassSources))
  for (const [section, prefix, property] of sources)
    for (const key of Object.keys(tailwindConfig.theme[section] ?? {})) {
      if (key === 'DEFAULT') continue;
      const className = `${prefix}-${key}`;
      const declaration = singleDeclaration(className);
      if (declaration?.prop !== property) continue;
      const indexKey = `${group}\0${declaration.value}`;
      tokenClassIndex.set(indexKey, [...(tokenClassIndex.get(indexKey) ?? []), className]);
    }

/** The class applying a token: the one named after it when there is one, else the first. */
const tokenClass = ({ name, group, value }) => {
  const classes = value === undefined ? undefined : tokenClassIndex.get(`${group}\0${value}`);
  const key = name.split('.').pop();
  return classes?.find((className) => className.endsWith(`-${key}`)) ?? classes?.[0];
};

export const tailwindPolicy = {
  layoutClasses: layoutTailwindClasses,
  forbiddenClasses: forbiddenTailwindClasses,
  maxClassListLength,
  maxClassListsPerElement,
  isValidClass: (className) =>
    isLayoutTailwindClass(className) || isTailwindCandidate(className),
  tokenClass,
};

// Scrolling overflow is ScrollArea's: its classes are invalid alternatives, so
// none is suggested.
export const tailwindEquivalents = createTailwindEquivalents(
  [...layoutTailwindClasses].filter(
    (className) => !/^overflow(-[xy])?-(auto|scroll)$/.test(className),
  ),
);
const equivalentIndex = indexEquivalents(tailwindEquivalents);

export const vanillaExtractPolicy = {
  tailwindEquivalents,
  forbiddenProperties: forbiddenVanillaExtractProperties,
};

const preferTailwind = {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      equivalent:
        'Use the allowed Tailwind class "{{className}}" instead of these equivalent vanilla-extract declarations.',
    },
  },
  create(context) {
    const importedNames = new Set();
    for (const node of context.sourceCode.ast.body) {
      if (node.type !== 'ImportDeclaration') continue;
      const names =
        node.source.value === '@vanilla-extract/css'
          ? ['style', 'styleVariants']
          : node.source.value === '@vanilla-extract/recipes'
            ? ['recipe']
            : [];
      for (const specifier of node.specifiers) {
        if (
          specifier.type === 'ImportSpecifier' &&
          names.includes(specifier.imported.name)
        )
          importedNames.add(specifier.local.name);
      }
    }
    if (!importedNames.size) return {};
    const keyOf = (property) =>
      !property.computed &&
      (property.key.type === 'Identifier'
        ? property.key.name
        : property.key.value);
    const walk = (object) => {
      const values = new Map();
      for (const property of object.properties) {
        if (property.type !== 'Property') continue;
        const key = keyOf(property);
        if (typeof key !== 'string') continue;
        if (property.value.type === 'ObjectExpression') {
          if (
            ![
              'selectors',
              '@media',
              '@supports',
              '@container',
              '@layer',
            ].includes(key)
          )
            walk(property.value);
        } else if (property.value.type === 'Literal') {
          values.set(key, { value: property.value.value, node: property });
        } else if (
          property.value.type === 'TemplateLiteral' &&
          !property.value.expressions.length
        ) {
          values.set(key, {
            value: property.value.quasis[0].value.cooked,
            node: property,
          });
        }
      }
      const reported = new Set();
      for (const { className, entries } of equivalentCandidates(
        equivalentIndex,
        values,
      )) {
        if (
          !entries.every(([key, expected]) =>
            matchesCssValue(key, values.get(key)?.value, expected),
          )
        )
          continue;
        if (entries.every(([key]) => reported.has(key))) continue;
        context.report({
          node: values.get(entries[0][0]).node,
          messageId: 'equivalent',
          data: { className },
        });
        entries.forEach(([key]) => reported.add(key));
      }
    };
    return {
      CallExpression(node) {
        if (
          node.callee.type !== 'Identifier' ||
          !importedNames.has(node.callee.name)
        )
          return;
        let scope = context.sourceCode.getScope(node);
        let binding;
        while (scope && !binding) {
          binding = scope.set.get(node.callee.name);
          scope = scope.upper;
        }
        const definition = binding?.defs[0];
        if (
          definition?.type !== 'ImportBinding' ||
          definition.node.type !== 'ImportSpecifier'
        )
          return;
        const source = definition.parent.source.value;
        const imported = definition.node.imported.name;
        if (
          !(
            (source === '@vanilla-extract/css' &&
              ['style', 'styleVariants'].includes(imported)) ||
            (source === '@vanilla-extract/recipes' && imported === 'recipe')
          )
        )
          return;
        if (node.arguments[0]?.type === 'ObjectExpression')
          walk(node.arguments[0]);
      },
    };
  },
};

const noVanillaLayout = {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      forbidden:
        'The top-level Vanilla Extract property "{{property}}" is prohibited. Express it with an approved Tailwind utility.',
    },
  },
  create(context) {
    const importedNames = new Set();
    for (const node of context.sourceCode.ast.body) {
      if (node.type !== 'ImportDeclaration') continue;
      const names =
        node.source.value === '@vanilla-extract/css'
          ? ['style', 'styleVariants']
          : node.source.value === '@vanilla-extract/recipes'
            ? ['recipe']
            : [];
      for (const specifier of node.specifiers) {
        if (
          specifier.type === 'ImportSpecifier' &&
          names.includes(specifier.imported.name)
        )
          importedNames.add(specifier.local.name);
      }
    }

    const keyOf = (property) =>
      !property.computed &&
      (property.key.type === 'Identifier'
        ? property.key.name
        : property.key.value);

    const walk = (object) => {
      for (const property of object.properties) {
        if (property.type !== 'Property') continue;
        const key = keyOf(property);
        if (typeof key !== 'string') continue;
        if (forbiddenVanillaExtractProperties.has(key)) {
          context.report({
            node: property,
            messageId: 'forbidden',
            data: { property: key },
          });
        }
        if (
          property.value.type === 'ObjectExpression' &&
          !conditionalStyleKeys.has(key)
        )
          walk(property.value);
      }
    };

    return {
      CallExpression(node) {
        if (
          node.callee.type !== 'Identifier' ||
          !importedNames.has(node.callee.name) ||
          node.arguments[0]?.type !== 'ObjectExpression'
        )
          return;
        walk(node.arguments[0]);
      },
    };
  },
};

const isStyleModuleReference = (node) =>
  node?.type === 'MemberExpression' &&
  node.object.type === 'Identifier' &&
  node.object.name === 'styles';

const isAllowedDynamicClassArgument = (node) => {
  if (!node) {
    return false;
  }

  if (isStyleModuleReference(node)) {
    return true;
  }

  if (node.type === 'Identifier') {
    return true;
  }

  if (
    node.type === 'ConditionalExpression' ||
    node.type === 'LogicalExpression'
  ) {
    return true;
  }

  return false;
};

const validateClassName = (className, designSystem) => {
  const classes = className.trim().split(/\s+/).filter(Boolean);

  for (const classNamePart of classes) {
    if (
      classNamePart.includes(':') ||
      classNamePart.includes('[') ||
      classNamePart.includes(']') ||
      classNamePart.startsWith('-')
    ) {
      return `Tailwind class "${classNamePart}" uses a disallowed variant, selector, arbitrary value, or negative modifier.`;
    }

    if (isForbiddenTailwindClass(classNamePart))
      return `Tailwind class "${classNamePart}" is prohibited. Use an approved compound flex utility instead.`;

    if (isLayoutTailwindClass(classNamePart)) continue;

    if (designSystem)
      return `Tailwind class "${classNamePart}" is not a layout utility. Design-system components style everything except layout with vanilla-extract.`;

    if (!isTailwindCandidate(classNamePart))
      return `Tailwind class "${classNamePart}" is not generated by the repository Tailwind configuration.`;
  }

  return null;
};

const moveToVanillaExtract =
  'Move the styles to vanilla-extract; display, flex and alignment stay in Tailwind.';

const validateClassListLength = (className) => {
  const length = className.trim().split(/\s+/).join(' ').length;
  return length > maxClassListLength
    ? `This class list is ${length} characters; the maximum is ${maxClassListLength}. ${moveToVanillaExtract}`
    : null;
};

const getStaticString = (node) => {
  if (!node) {
    return null;
  }

  if (node.type === 'Literal' && typeof node.value === 'string') {
    return node.value;
  }

  if (
    node.type === 'TemplateLiteral' &&
    node.expressions.length === 0 &&
    node.quasis.length === 1
  ) {
    return node.quasis[0].value.cooked;
  }

  return null;
};

const restrictedTailwindClasses = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Restrict Tailwind usage to the approved layout utility set.',
    },
    schema: [],
  },
  create(context) {
    const designSystem = isDesignSystemFile(context.filename);
    const validateClassList = (className) =>
      validateClassName(className, designSystem) ??
      (designSystem ? null : validateClassListLength(className));

    const reportInvalidClassString = (node, className) => {
      const message = validateClassList(className);
      if (message) {
        context.report({ node, message });
      }
    };

    const validateClassNamesCall = (node) => {
      if (
        node.callee.type !== 'Identifier' ||
        node.callee.name !== 'classNames'
      ) {
        return;
      }

      let staticClassLists = 0;
      for (const argument of node.arguments) {
        const className = getStaticString(argument);
        if (className === null) {
          if (isAllowedDynamicClassArgument(argument)) {
            continue;
          }

          context.report({
            node: argument,
            message:
              'classNames only accepts static class strings in the strict Tailwind policy.',
          });
          continue;
        }

        staticClassLists += 1;
        reportInvalidClassString(argument, className);
      }

      if (!designSystem && staticClassLists > maxClassListsPerElement) {
        context.report({
          node,
          message: `This element has ${staticClassLists} static class lists; the maximum is ${maxClassListsPerElement}. ${moveToVanillaExtract}`,
        });
      }
    };

    return {
      JSXAttribute(node) {
        if (node.name.name !== 'className') {
          return;
        }

        if (!node.value) {
          return;
        }

        if (node.value.type === 'Literal') {
          reportInvalidClassString(node.value, node.value.value);
          return;
        }

        if (node.value.type !== 'JSXExpressionContainer') {
          context.report({
            node: node.value,
            message:
              'className must be a static string or a static classNames(...) call.',
          });
          return;
        }

        const expression = node.value.expression;
        const className = getStaticString(expression);

        if (className !== null) {
          reportInvalidClassString(expression, className);
          return;
        }

        if (
          expression.type === 'CallExpression' &&
          expression.callee.type === 'Identifier' &&
          expression.callee.name === 'classNames'
        ) {
          return;
        }

        if (isAllowedDynamicClassArgument(expression)) {
          return;
        }

        context.report({
          node: expression,
          message:
            'Dynamic className values are not allowed by the strict Tailwind policy.',
        });
      },
      CallExpression: validateClassNamesCall,
    };
  },
};

const tailwindLayoutPlugin = {
  rules: {
    'no-vanilla-layout': noVanillaLayout,
    'restricted-classes': restrictedTailwindClasses,
    'prefer-tailwind': preferTailwind,
  },
};

export default tailwindLayoutPlugin;
