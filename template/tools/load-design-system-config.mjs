/** Load repository policy once at startup, sharing the ESLint vanilla-extract and Tailwind policy. */
export async function loadWorkspaceConfig(root) {
  const { loadConfig } = await import(
    './weave-design-system-mcp/dist/index.js'
  );
  const { tailwindPolicy, vanillaExtractPolicy } = await import(
    './eslint/tailwind-layout-plugin.mjs'
  );
  return {
    ...loadConfig(root),
    tailwind: tailwindPolicy,
    vanillaExtract: vanillaExtractPolicy,
  };
}
