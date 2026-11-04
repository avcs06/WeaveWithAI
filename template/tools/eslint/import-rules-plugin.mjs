import path from 'path';

const noRoutesSiblingImports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow importing from sibling route folders inside (routes)',
    },
    schema: [],
    messages: {
      siblingRoute:
        'Cannot import from sibling route "{{route}}". Routes must not import from each other.',
    },
  },
  create(context) {
    const filename = context.getFilename().replace(/\\/g, '/');
    const routesMatch = filename.match(/\/\(routes\)\/([^/]+)\//);
    if (!routesMatch) return {};
    const currentRoute = routesMatch[1];

    return {
      ImportDeclaration(node) {
        const importPath = node.source.value;
        if (!importPath.startsWith('../')) return;

        const fileDir = path.dirname(filename);
        const resolved = path.resolve(fileDir, importPath).replace(/\\/g, '/');
        const resolvedRouteMatch = resolved.match(/\/\(routes\)\/([^/]+)/);

        if (resolvedRouteMatch && resolvedRouteMatch[1] !== currentRoute) {
          context.report({
            node,
            messageId: 'siblingRoute',
            data: { route: resolvedRouteMatch[1] },
          });
        }
      },
    };
  },
};

const barrelOnlySiblingImports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow deep imports from sibling folders; use the barrel (index) instead',
    },
    schema: [],
    messages: {
      deepSibling:
        'Deep sibling imports are not allowed. Use the barrel instead: "{{barrel}}"',
    },
  },
  create(context) {
    const filename = context.getFilename().replace(/\\/g, '/');
    if (filename.includes('/(routes)/')) return {};

    return {
      ImportDeclaration(node) {
        const importPath = node.source.value;
        // `../Sibling/x` or `../../Cousin/x`: any climb is fine; going past the
        // folder name is deep.
        const match = importPath.match(/^((?:\.\.\/)+)(?!\.\.)([^/]+)\/.+/);
        if (!match) return;

        const barrel = `${match[1]}${match[2]}`;
        context.report({
          node,
          messageId: 'deepSibling',
          data: { barrel },
        });
      },
    };
  },
};

export default {
  meta: { name: 'import-rules' },
  rules: {
    'no-routes-sibling-imports': noRoutesSiblingImports,
    'barrel-only-sibling-imports': barrelOnlySiblingImports,
  },
};
