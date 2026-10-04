import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { generate as generateProject, runCommand } from './generate.mjs';
const generate = (source, target, includeServer) =>
  generateProject(source, target, includeServer, { skipSetup: true });

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'boilerplate-generator-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const source = join(root, 'source');
  const files = {
    'package.json': JSON.stringify({
      dependencies: { express: '1', react: '1' },
      devDependencies: {
        '@types/express': '1',
        '@nx/express': '1',
        '@nx/node': '1',
        '@nx/webpack': '1',
        'webpack-cli': '1',
        '@nx/next': '1',
      },
    }),
    'nx.json': JSON.stringify({
      plugins: [
        '@nx/webpack/plugin',
        { plugin: '@nx/webpack/plugin' },
        { plugin: '@nx/next/plugin' },
      ],
    }),
    'web/app/page.tsx': 'page',
    'server/src/main.ts': 'server',
    'packages/ui/index.ts': 'shared',
    '.editorconfig': 'root = true',
    'web/.env.example': 'EXAMPLE=true',
    'pnpm-lock.yaml': 'lockfile',
    'node_modules/example/index.js': 'dependency',
    'web/node_modules/example/index.js': 'nested dependency',
    '.git/config': 'git',
    '.nx/cache/example': 'cache',
    'web/.next/cache/example': 'cache',
    'dist/server/main.js': 'build',
    'web/tsconfig.tsbuildinfo': 'cache',
    '.mcp.json': JSON.stringify({
      mcpServers: {
        'weave-design-system': { command: 'node', args: ['/old/launcher'] },
        other: { command: 'other' },
      },
    }),
    'designsystem.config.json': '{}',
    'tsconfig.designsystem.json': '{}',
    'tools/eslint/tailwind-equivalents.mjs': 'policy',
    'tools/load-design-system-config.mjs': 'loader',
    'tools/check-design-system.mjs': 'check',
    'tools/weave-design-system-mcp/src/index.ts': 'mcp source',
    'tools/weave-design-system-mcp/package-lock.json': 'mcp lock',
    'tools/weave-design-system-mcp/node_modules/example/index.js': 'dependency',
    'tools/weave-design-system-mcp/dist/index.js': 'build',
  };
  for (const [name, content] of Object.entries(files)) {
    const path = join(source, name);
    await mkdir(join(path, '..'), { recursive: true });
    await writeFile(path, content);
  }
  return { root, source, target: join(root, 'target') };
}

async function missing(path) {
  await assert.rejects(access(path), { code: 'ENOENT' });
}

test('frontend-only copy prunes server dependencies and keeps shared files', async (t) => {
  const { source, target } = await fixture(t);
  await generate(source, target);
  for (const path of [
    'server',
    'pnpm-lock.yaml',
    'node_modules',
    'web/node_modules',
    '.git',
    '.nx',
    'web/.next',
    'dist',
    'web/tsconfig.tsbuildinfo',
    'tools/weave-design-system-mcp/node_modules',
    'tools/weave-design-system-mcp/dist',
  ])
    await missing(join(target, path));
  for (const path of [
    'web/app/page.tsx',
    'packages/ui/index.ts',
    '.editorconfig',
    'web/.env.example',
    'designsystem.config.json',
    'tsconfig.designsystem.json',
    'tools/eslint/tailwind-equivalents.mjs',
    'tools/load-design-system-config.mjs',
    'tools/check-design-system.mjs',
    'tools/weave-design-system-mcp/src/index.ts',
    'tools/weave-design-system-mcp/package-lock.json',
  ]) {
    assert.equal(
      await readFile(join(target, path), 'utf8'),
      await readFile(join(source, path), 'utf8'),
    );
  }
  assert.deepEqual(
    JSON.parse(await readFile(join(target, 'package.json'), 'utf8')),
    {
      dependencies: { react: '1' },
      devDependencies: { '@nx/next': '1' },
    },
  );
  assert.deepEqual(
    JSON.parse(await readFile(join(target, 'nx.json'), 'utf8')).plugins,
    [{ plugin: '@nx/next/plugin' }],
  );
  await access(join(source, 'server/src/main.ts'));
  const mcp = JSON.parse(await readFile(join(target, '.mcp.json'), 'utf8'));
  assert.deepEqual(mcp.mcpServers['weave-design-system'].args, [
    join(target, 'tools/design-system-mcp.mjs'),
  ]);
  assert.deepEqual(mcp.mcpServers.other, { command: 'other' });
  assert.equal(
    JSON.parse(await readFile(join(source, 'package.json'), 'utf8'))
      .dependencies.express,
    '1',
  );
});

test('initializes after copying and pruning, in sequence for both package managers', async (t) => {
  for (const packageManager of ['pnpm', 'npm']) {
    const { source, target } = await fixture(t);
    const calls = [];
    await generateProject(source, target, false, {
      nodeVersion: '24.11.0',
      packageManager,
      async execute(command, args, cwd) {
        assert.equal(cwd, target);
        assert.equal(
          JSON.parse(await readFile(join(target, 'package.json'), 'utf8'))
            .dependencies.express,
          undefined,
        );
        await access(
          join(target, 'tools/weave-design-system-mcp/package-lock.json'),
        );
        calls.push([command, args]);
      },
    });
    assert.deepEqual(calls, [
      [
        packageManager,
        packageManager === 'pnpm'
          ? ['install', '--no-frozen-lockfile']
          : ['install', '--no-audit', '--no-fund'],
      ],
      [packageManager, ['run', 'mcp:setup']],
      [packageManager, ['run', 'mcp:check']],
    ]);
  }
});

test('stops setup on failure and preserves the copy with recovery instructions', async (t) => {
  const { source, target } = await fixture(t);
  let calls = 0;
  await assert.rejects(
    generateProject(source, target, false, {
      nodeVersion: '24.11.0',
      async execute() {
        calls++;
        throw new Error('install failed');
      },
    }),
    /Files were copied.*initialization failed: install failed/s,
  );
  assert.equal(calls, 1);
  await access(join(target, 'package.json'));
});

test('rejects unsupported Node before copying', async (t) => {
  const { source, target } = await fixture(t);
  await assert.rejects(
    generateProject(source, target, false, { nodeVersion: '24.3.0' }),
    /requires Node/,
  );
  await missing(target);
});

test('command runner uses target cwd and propagates subprocess failures', async (t) => {
  const { target } = await fixture(t);
  await mkdir(target);
  await runCommand(
    process.execPath,
    ['-e', "require('fs').writeFileSync('initialized', 'yes')"],
    target,
  );
  assert.equal(await readFile(join(target, 'initialized'), 'utf8'), 'yes');
  await assert.rejects(
    runCommand(process.execPath, ['-e', 'process.exit(3)'], target),
    /failed \(3\)/,
  );
});

test('server copy preserves manifest, Nx configuration, and lockfile', async (t) => {
  const { source, target } = await fixture(t);
  await mkdir(target);
  await generate(source, target, true);
  for (const path of [
    'package.json',
    'nx.json',
    'pnpm-lock.yaml',
    'server/src/main.ts',
  ]) {
    assert.equal(
      await readFile(join(target, path), 'utf8'),
      await readFile(join(source, path), 'utf8'),
    );
  }
  await missing(join(target, 'node_modules'));
});

test('rejects overlapping paths, symlink aliases, and non-empty targets', async (t) => {
  const { root, source, target } = await fixture(t);
  for (const path of [source, join(source, 'output'), root]) {
    await assert.rejects(generate(source, path), /must not overlap/);
  }
  await symlink(source, join(root, 'alias'));
  await assert.rejects(
    generate(source, join(root, 'alias/output')),
    /must not overlap/,
  );
  await mkdir(target);
  await writeFile(join(target, 'keep.txt'), 'keep');
  await assert.rejects(generate(source, target), /must be empty/);
  assert.equal(await readFile(join(target, 'keep.txt'), 'utf8'), 'keep');
});

test('CLI accepts boolean flags and rejects unknown arguments', async (t) => {
  const { root, source } = await fixture(t);
  const script = fileURLToPath(new URL('./generate.mjs', import.meta.url));
  for (const flag of [
    '--include-server',
    '--include-server=true',
    '--include-server=false',
  ]) {
    const target = join(root, flag);
    execFileSync(process.execPath, [
      script,
      source,
      target,
      flag,
      '--skip-setup',
    ]);
    if (flag.endsWith('false')) await missing(join(target, 'server'));
    else await access(join(target, 'server'));
  }
  assert.throws(() =>
    execFileSync(
      process.execPath,
      [script, source, join(root, 'invalid'), '--typo'],
      { stdio: 'pipe' },
    ),
  );
  await missing(join(root, 'invalid'));
});
