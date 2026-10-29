// Prints this design system as JSON for the generator agent: UI components
// with their file, props, variant values and superseded alternatives, recipe
// names, and tokens. Run from anywhere: node tools/export-design-system.mjs > out.json
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadWorkspaceConfig } from './load-design-system-config.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
// The workspace's TypeScript tooling resolves from its own folder.
process.chdir(root);
const { createDesignSystem } = await import(
  './weave-design-system-mcp/dist/index.js'
);
const system = createDesignSystem(await loadWorkspaceConfig(root));

// The inventory also lists exported hooks, helpers and prop types.
const isComponent = (name) =>
  /^[A-Z]/.test(name) && !/(Props|Value|Mode|Width|Variants)$/.test(name);

const components = system
  .components()
  .filter(({ name }) => isComponent(name))
  .map(({ name }) => {
    const contract = system.component(name);
    return {
      name,
      file: contract.filePath && relative(root, contract.filePath),
      category: contract.category,
      description: contract.description,
      variantProps: contract.variantProps,
      invalidAlternatives: contract.invalidAlternatives,
      recipe: system.recipe(name)?.name ?? null,
      props: contract.props.map(({ name, type, required, allowedValues, description }) => ({
        name,
        type,
        required,
        ...(allowedValues && { allowedValues }),
        ...(description && { description }),
      })),
    };
  });

process.stdout.write(
  JSON.stringify({ components, recipes: system.recipes(), tokens: system.tokens() }),
);
