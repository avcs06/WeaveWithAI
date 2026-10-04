import type { ComponentContract, PackageConfig } from '../types.js';
import * as npmPackageComponents from './components/npm-package.js';
import * as reactTsxComponents from './components/react-tsx.js';

/**
 * This file is a pure dispatcher — it contains no component-format code of
 * its own. Each concrete implementation lives in its own module under
 * `components/` and is only ever reached through the functions below. The
 * project's components are always React TSX, and installed packages are
 * always read from their type declarations — another format (Vue SFCs, a
 * published metadata JSON) is a new file under `components/` and a switch here.
 */
export function loadComponents(patterns: string[], configDir: string): ComponentContract[] {
  return reactTsxComponents.loadComponents(patterns, configDir);
}

/** Components exported by an installed package (a `packages` entry). */
export function loadPackageComponents(pkg: PackageConfig, configDir: string): ComponentContract[] {
  return npmPackageComponents.loadComponents(pkg, configDir);
}

/** Folders the project's components are read from; everything under them is design-system code. */
export function componentRoots(patterns: string[], configDir: string): string[] {
  return reactTsxComponents.componentRoots(patterns, configDir);
}
