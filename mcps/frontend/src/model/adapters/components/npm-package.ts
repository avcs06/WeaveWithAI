import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';

import { parse, type ComponentDoc } from 'react-docgen-typescript';
import ts from 'typescript';

import type { ComponentContract, PackageConfig } from '../../types.js';
import { toProps } from './props.js';

/**
 * Resolves a package's TypeScript declaration entry from the *target repo*, not
 * this server's install.
 */
function resolveTypesEntry(packageName: string, configDir: string): string | undefined {
  const require = createRequire(join(configDir, 'noop.js'));

  let packageJsonPath: string;
  try {
    packageJsonPath = require.resolve(`${packageName}/package.json`);
  } catch {
    return undefined;
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
    types?: string;
    typings?: string;
  };
  const typesField = packageJson.types ?? packageJson.typings;
  if (typesField) return resolve(dirname(packageJsonPath), typesField);

  try {
    return require.resolve(`@types/${packageName.replace('/', '__')}/index.d.ts`);
  } catch {
    return undefined;
  }
}

/**
 * Which of `names` the module at `entryPath` exports, via the TypeScript
 * checker so `export *` re-exports resolve.
 */
function existingExports(entryPath: string, names: string[]): Set<string> {
  const program = ts.createProgram([entryPath], {
    noEmit: true,
    skipLibCheck: true,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
  });
  const source = program.getSourceFile(entryPath);
  if (!source) return new Set();

  const symbol = program.getTypeChecker().getSymbolAtLocation(source);
  if (!symbol) return new Set();

  const exported = new Set(
    program
      .getTypeChecker()
      .getExportsOfModule(symbol)
      .map((s) => s.getName()),
  );
  return new Set(names.filter((name) => exported.has(name)));
}

function toContract(doc: ComponentDoc, packageName: string): ComponentContract {
  return {
    name: doc.displayName,
    // The package name is the category, which keeps external components
    // filterable as a group.
    category: packageName,
    description: doc.description,
    props: toProps(doc.props),
    variantProps: toProps(doc.props)
      .filter((p) => p.allowedValues)
      .map((p) => p.name),
    invalidAlternatives: [],
  };
}

/**
 * Scans an installed npm package (an icon library, a headless primitive set)
 * so its components are listed, searchable and gettable.
 *
 * `pkg.package` is the package name, e.g. `"lucide-react"`; `pkg.names` is
 * `"*"` or omitted for every exported component, or an array of names.
 *
 * A package whose types can't be resolved is reported on stderr and skipped,
 * so one bad icon library doesn't take the design system's own components down.
 */
export function loadComponents(pkg: PackageConfig, configDir: string): ComponentContract[] {
  const packageName = pkg.package;
  if (typeof packageName !== 'string' || packageName.length === 0) {
    throw new Error('A packages entry requires a "package" name.');
  }

  const names = pkg.names;
  if (names !== undefined && names !== '*' && !Array.isArray(names)) {
    throw new Error(`Packages entry "${packageName}": "names" must be "*" or an array of names.`);
  }
  const wanted = Array.isArray(names) ? new Set(names.map(String)) : undefined;

  const entry = resolveTypesEntry(packageName, configDir);
  if (!entry) {
    console.error(
      `[weave-frontend-mcp] could not resolve type declarations for "${packageName}" from ${configDir}; skipping it.`,
    );
    return [];
  }

  let docs: ComponentDoc[];
  try {
    docs = parse(entry, {
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
    });
  } catch (error) {
    console.error(`[weave-frontend-mcp] failed to scan "${packageName}": ${(error as Error).message}`);
    return [];
  }

  const contracts: ComponentContract[] = [];
  for (const doc of docs) {
    if (wanted && !wanted.has(doc.displayName)) continue;
    contracts.push(toContract(doc, packageName));
  }

  // A hand-asked name docgen missed (routine for terse icon one-liners) is
  // listed only once the checker confirms the package exports it, so typos stay
  // typos.
  if (wanted) {
    const found = new Set(docs.map((d) => d.displayName));
    const missing = [...wanted].filter((name) => !found.has(name));
    if (missing.length > 0) {
      const confirmed = existingExports(entry, missing);
      for (const name of missing) {
        if (confirmed.has(name)) {
          contracts.push({
            name,
            category: packageName,
            description: '',
            props: [],
            variantProps: [],
            invalidAlternatives: [],
          });
        } else {
          console.error(
            `[weave-frontend-mcp] "${name}" is not exported by "${packageName}"; skipping it.`,
          );
        }
      }
    }
  }

  return contracts;
}
