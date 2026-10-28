import {
  cp,
  mkdir,
  readdir,
  readFile,
  realpath,
  rmdir,
  stat,
  writeFile,
} from 'node:fs/promises';
import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const serverPackages = [
  'express',
  '@types/express',
  '@nx/express',
  '@nx/node',
  '@nx/webpack',
  'webpack-cli',
];
const excluded = new Set([
  'node_modules',
  '.git',
  '.nx',
  '.next',
  'dist',
  'coverage',
  '.turbo',
]);
const lockfiles = new Set([
  'pnpm-lock.yaml',
  'package-lock.json',
  'npm-shrinkwrap.json',
  'yarn.lock',
]);

async function canonicalPath(path) {
  try {
    return await realpath(path);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return join(await canonicalPath(dirname(path)), basename(path));
  }
}

function contains(parent, child) {
  const path = relative(parent, child);
  return (
    path === '' ||
    (path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path))
  );
}

export function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: 'inherit', shell: false });
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) resolve();
      else
        reject(
          new Error(`${command} ${args.join(' ')} failed (${signal ?? code}).`),
        );
    });
  });
}

export async function generate(
  sourcePath,
  targetPath,
  includeServer = false,
  options = {},
) {
  const {
    skipSetup = false,
    packageManager = 'pnpm',
    execute = runCommand,
    nodeVersion = process.versions.node,
  } = options;
  if (!['pnpm', 'npm'].includes(packageManager))
    throw new Error('Package manager must be pnpm or npm.');
  if (!skipSetup) {
    const [major, minor] = nodeVersion.split('.').map(Number);
    if (
      !(
        (major === 22 && minor >= 18) ||
        (major === 24 && minor >= 11) ||
        major > 24
      )
    ) {
      throw new Error(
        'MCP setup requires Node ^22.18.0 or >=24.11.0. Upgrade Node or use --skip-setup.',
      );
    }
  }
  const source = await realpath(resolve(sourcePath));
  const target = await canonicalPath(resolve(targetPath));
  if (contains(source, target) || contains(target, source)) {
    throw new Error('Source and target folders must not overlap.');
  }
  const manifest = JSON.parse(
    await readFile(join(source, 'package.json'), 'utf8'),
  );
  const nx = JSON.parse(await readFile(join(source, 'nx.json'), 'utf8'));
  if (!(await stat(join(source, 'web'))).isDirectory()) {
    throw new Error('Source must be the boilerplate repository.');
  }
  if (includeServer && !(await stat(join(source, 'server'))).isDirectory()) {
    throw new Error('Source does not contain a server folder.');
  }
  try {
    if ((await readdir(target)).length)
      throw new Error('Target folder must be empty.');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  // cp creates the target itself; an existing (empty) target makes newer
  // Node versions fail with ERR_FS_CP_EEXIST under errorOnExist.
  await mkdir(dirname(target), { recursive: true });
  // Only an empty target gets here (checked above); rmdir refuses anything else.
  await rmdir(target).catch((error) => {
    if (error.code !== 'ENOENT') throw error;
  });
  await cp(source, target, {
    recursive: true,
    force: false,
    // tools/weave-design-system-mcp is a link to ../../mcp; copy its files.
    dereference: true,
    errorOnExist: true,
    filter(path) {
      const local = relative(source, path);
      const name = basename(path);
      if (!local) return true;
      if (excluded.has(name) || name.endsWith('.tsbuildinfo')) return false;
      // Only the root manifest is pruned; the MCP keeps its own lockfile.
      if (!includeServer && (local === 'server' || lockfiles.has(local)))
        return false;
      return true;
    },
  });

  // Not every client expands workspaceFolder or sets cwd: change only our
  // launcher path.
  const mcpPath = join(target, '.mcp.json');
  try {
    const config = JSON.parse(await readFile(mcpPath, 'utf8'));
    const server = config.mcpServers?.['weave-design-system'];
    if (server) {
      server.command = 'node';
      server.args = [join(target, 'tools/design-system-mcp.mjs')];
      await writeFile(mcpPath, `${JSON.stringify(config, null, 2)}\n`);
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  if (!includeServer) {
    for (const section of [
      'dependencies',
      'devDependencies',
      'optionalDependencies',
      'peerDependencies',
    ]) {
      for (const name of serverPackages) delete manifest[section]?.[name];
    }
    nx.plugins = nx.plugins?.filter(
      (entry) =>
        (typeof entry === 'string' ? entry : entry.plugin) !==
        '@nx/webpack/plugin',
    );
    await Promise.all([
      writeFile(
        join(target, 'package.json'),
        `${JSON.stringify(manifest, null, 2)}\n`,
      ),
      writeFile(join(target, 'nx.json'), `${JSON.stringify(nx, null, 2)}\n`),
    ]);
  }
  if (!skipSetup) {
    try {
      await execute(
        packageManager,
        packageManager === 'pnpm'
          ? ['install', '--no-frozen-lockfile']
          : ['install', '--no-audit', '--no-fund'],
        target,
      );
      await execute(packageManager, ['run', 'mcp:setup'], target);
      await execute(packageManager, ['run', 'mcp:check'], target);
    } catch (error) {
      throw new Error(
        `Files were copied to ${target}, but initialization failed: ${error.message}\nFix the error, then run ${packageManager} install, ${packageManager} run mcp:setup, and ${packageManager} run mcp:check in that folder.`,
        { cause: error },
      );
    }
  }
  return target;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const [source, target, ...flags] = process.argv.slice(2);
  if (
    !source ||
    !target ||
    flags.some(
      (flag) =>
        ![
          '--include-server',
          '--include-server=true',
          '--include-server=false',
          '--skip-setup',
          '--package-manager=npm',
          '--package-manager=pnpm',
        ].includes(flag),
    )
  ) {
    console.error(
      'Usage: node tools/generate.mjs <source> <target> [--include-server[=true|false]] [--package-manager=pnpm|npm] [--skip-setup]',
    );
    process.exitCode = 1;
  } else {
    try {
      const output = await generate(
        source,
        target,
        flags.includes('--include-server') ||
          flags.includes('--include-server=true'),
        {
          skipSetup: flags.includes('--skip-setup'),
          packageManager: flags.includes('--package-manager=npm')
            ? 'npm'
            : 'pnpm',
        },
      );
      console.log(
        `Generated ${output}\n${flags.includes('--skip-setup') ? 'Setup skipped. Install dependencies, then run mcp:setup and mcp:check before using the MCP.' : 'Dependencies installed; MCP built and checked.'}`,
      );
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
}
