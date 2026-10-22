import { fileURLToPath } from 'node:url';

import { loadWorkspaceConfig } from '../load-design-system-config.mjs';
import { isDesignSystemFile } from './tailwind-layout-plugin.mjs';

// Each state a control can be put in, and the prop that puts it there with a
// reason the user sees.
const reasonProps = {
  disabled: 'disabledWithReason',
  readOnly: 'readOnlyWithReason',
  loading: 'loadingWithReason',
};

const designSystemImport = /^@packages\/ui\//;

const isFalse = (value) =>
  value?.type === 'JSXExpressionContainer' &&
  value.expression.type === 'Literal' &&
  value.expression.value === false;

// A disable directive turns the rule off; it doesn't say why.
const isExplanation = (comment) => {
  const text = comment.value.trim();
  return text !== '' && !/^eslint[- ]/.test(text);
};

/** `propsOf(name)`: the prop names design-system component `name` takes. */
export const createWithReasonOrComment = (propsOf) => ({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer the WithReason props; without one, require a comment saying why',
    },
    schema: [],
    messages: {
      missingReason:
        'Use `{{reasonProp}}` so the user sees why, or write a comment right above `{{prop}}` saying why it has no reason.',
    },
  },
  create(context) {
    // Components forward a state their caller already explained.
    if (isDesignSystemFile(context.filename)) return {};

    // Local name → the design-system component it was imported as.
    const components = new Map();

    return {
      ImportDeclaration(node) {
        if (!designSystemImport.test(node.source.value)) return;
        for (const specifier of node.specifiers)
          if (specifier.type === 'ImportSpecifier')
            components.set(specifier.local.name, specifier.imported.name);
      },
      JSXAttribute(node) {
        if (node.name.type !== 'JSXIdentifier') return;
        const prop = node.name.name;
        const reasonProp = reasonProps[prop];
        if (!reasonProp || isFalse(node.value)) return;

        const element = node.parent;
        if (element.name.type !== 'JSXIdentifier') return;
        const component = components.get(element.name.name);
        // Only where a reason can be given: Table's `loading` has none.
        if (!component || !propsOf(component)?.has(reasonProp)) return;

        const hasReason = element.attributes.some(
          (attribute) =>
            attribute.type === 'JSXAttribute' &&
            attribute.name.name === reasonProp,
        );
        if (hasReason) return;
        if (context.sourceCode.getCommentsBefore(node).some(isExplanation))
          return;

        context.report({
          node,
          messageId: 'missingReason',
          data: { prop, reasonProp },
        });
      },
    };
  },
});

const loadComponentProps = async () => {
  try {
    const { createDesignSystem } = await import(
      '../weave-design-system-mcp/dist/index.js'
    );
    const root = fileURLToPath(new URL('../../', import.meta.url));
    const system = createDesignSystem(await loadWorkspaceConfig(root));
    return new Map(
      system
        .components()
        .map(({ name }) => [
          name,
          new Set(
            (system.component(name)?.props ?? []).map(({ name }) => name),
          ),
        ]),
    );
  } catch (error) {
    throw new Error(
      'disabled-reasons reads component props from the design-system MCP: build it with `pnpm mcp:setup`.',
      { cause: error },
    );
  }
};

const componentProps = await loadComponentProps();

export default {
  meta: { name: 'disabled-reasons' },
  rules: {
    'with-reason-or-comment': createWithReasonOrComment((name) =>
      componentProps.get(name),
    ),
  },
};
