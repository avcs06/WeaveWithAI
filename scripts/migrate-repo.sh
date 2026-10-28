#!/usr/bin/env bash
# Restructures the design-system repository for the generator agent:
#
#   <repo>/template/   the design-system repo as it is today: packages, web,
#                      server, tools, configs. The copy source for generated apps.
#   <repo>/mcp/        weave-design-system-mcp, moved out of template/tools.
#   <repo>/            the generator agent (this kit's files).
#
# template/tools/weave-design-system-mcp becomes a symlink to ../../mcp, so
# every template script, test and ESLint plugin that imports the MCP keeps
# working unchanged. generate.mjs is patched to copy through the link, so a
# generated app still gets a real, self-contained copy of the MCP.
#
# Usage (from anywhere):
#   bash <kit>/scripts/migrate-repo.sh <repo> [--base <branch>] [--clean] [--no-kit] [--no-commit]
#
#   --base       branch to start from (default: hackathon). It is checked out first.
#   --clean      delete regenerable root folders (node_modules, .nx, dist,
#                tmp, coverage) before moving; reinstall inside template/ after.
#   --no-kit     only restructure; don't copy the kit files into the repo.
#   --no-commit  leave the changes staged instead of committing them.
#
# Runs on a new branch, restructure/agent-root, cut from the base branch, in
# two commits: the move, then the kit. The script prints the commands to merge
# it into the base branch, or to undo it. It checks everything it needs before
# changing anything; the two generate.mjs patches skip themselves with a
# warning if that file looks different from what they expect.
set -euo pipefail

KIT="$(cd "$(dirname "$0")/.." && pwd)"
REPO=""
BASE="hackathon"
CLEAN=false
COPY_KIT=true
COMMIT=true
while [ $# -gt 0 ]; do
  case "$1" in
    --base) BASE="${2:?--base needs a branch name}"; shift ;;
    --base=*) BASE="${1#--base=}" ;;
    --clean) CLEAN=true ;;
    --no-kit) COPY_KIT=false ;;
    --no-commit) COMMIT=false ;;
    -*) echo "Unknown option: $1" >&2; exit 2 ;;
    *) REPO="$1" ;;
  esac
  shift
done
[ -n "$REPO" ] || { echo "Usage: migrate-repo.sh <repo> [--base <branch>] [--clean] [--no-kit] [--no-commit]" >&2; exit 2; }
cd "$REPO"

fail() { echo "migrate-repo: $*" >&2; exit 1; }
warn() { echo "migrate-repo: WARNING: $*" >&2; }
[ -d .git ] || fail "$(pwd) is not the root of a git repository."
[ -z "$(git status --porcelain)" ] || fail "commit or stash your changes first (git status is not clean)."
case "$KIT" in "$(pwd)"|"$(pwd)"/*) fail "run the script from a kit folder outside the repository." ;; esac
git rev-parse --verify --quiet "refs/heads/$BASE" >/dev/null || fail "branch $BASE not found (use --base <branch>)."
git rev-parse --verify --quiet "refs/heads/restructure/agent-root" >/dev/null && fail "branch restructure/agent-root already exists."
git checkout -q "$BASE"
[ ! -e template ] || fail "template/ already exists on $BASE; this branch looks migrated."
[ ! -e mcp ] || fail "mcp/ already exists on $BASE."
[ -d tools/weave-design-system-mcp ] || fail "tools/weave-design-system-mcp not found on $BASE."
[ -f tools/generate.mjs ] || warn "tools/generate.mjs not found; its patches will be skipped."
echo "Base branch: $BASE"

git checkout -b restructure/agent-root

if $CLEAN; then
  for dir in node_modules .nx dist tmp coverage tools/weave-design-system-mcp/node_modules tools/weave-design-system-mcp/dist; do
    if [ -e "$dir" ]; then echo "Removing $dir"; rm -rf "$dir"; fi
  done
fi

# 1. Every tracked top-level entry, dotfiles included, moves into template/.
#    git mv renames whole folders, so untracked files inside them (web/.env.local,
#    caches) move along.
mkdir template
git ls-tree --name-only HEAD | while IFS= read -r entry; do
  git mv -- "$entry" "template/$entry"
done

# 2. The MCP leaves the template and is linked back for the template's scripts.
git mv template/tools/weave-design-system-mcp mcp
ln -s ../../mcp template/tools/weave-design-system-mcp
git add template/tools/weave-design-system-mcp

# 3. generate.mjs copies through the link, so generated apps get a real copy.
#    Skipped with a warning if the file looks different from what's expected.
if [ -f template/tools/generate.mjs ]; then
  node - template/tools/generate.mjs <<'NODE'
const { readFileSync, writeFileSync } = require('node:fs');
const file = process.argv[2];
const source = readFileSync(file, 'utf8');
const anchor = '    force: false,\n';
if (source.includes('dereference: true')) process.exit(0);
if (!source.includes(anchor)) {
  console.error(`migrate-repo: WARNING: no "force: false," line in ${file}. Add "dereference: true" to its cp() options by hand, or generated apps get a symlink instead of a copy of the MCP.`);
  process.exit(0);
}
writeFileSync(file, source.replace(anchor, `${anchor}    // tools/weave-design-system-mcp is a link to ../../mcp; copy its files.\n    dereference: true,\n`));
NODE
  git add template/tools/generate.mjs
fi

# 4. Root files the move leaves missing. The template's .gitignore now only
#    covers template/, so the root one must cover mcp/node_modules and mcp/dist.
cat > .gitignore <<'EOF'
# dependencies and build output, anywhere (mcp/ relies on this)
node_modules
dist
*.tsbuildinfo
.pnpm-store

# generator runs and caches
/runs/
/.weave-cache/

# local environment
.env
.env.*
!.env.example

# editors and OS
.DS_Store
Thumbs.db
/.idea
.vscode/*
!.vscode/mcp.json
.claude/settings.local.json
.claude/worktrees
EOF

cat > .mcp.json <<'EOF'
{
  "mcpServers": {
    "weave-design-system": {
      "command": "node",
      "args": ["template/tools/design-system-mcp.mjs"]
    }
  }
}
EOF

mkdir -p .vscode
cat > .vscode/mcp.json <<'EOF'
{
  "servers": {
    "weave-design-system": {
      "type": "stdio",
      "command": "node",
      "args": ["${workspaceFolder}/template/tools/design-system-mcp.mjs"]
    }
  }
}
EOF

[ -f template/LICENSE ] && cp template/LICENSE LICENSE
git add .gitignore .mcp.json .vscode/mcp.json LICENSE 2>/dev/null || git add .gitignore .mcp.json .vscode/mcp.json

if $COMMIT; then
  git commit -q -m "Move the design system into template/ and the MCP into mcp/

template/tools/weave-design-system-mcp links to ../../mcp so the template's
scripts, tests and ESLint plugin resolve the MCP unchanged; generate.mjs
dereferences the link so generated apps get a real copy."
  echo "Committed the move."
fi

# 5. The kit: agent rules, plan, specs, prompts, fixtures, root package.
if $COPY_KIT; then
  for entry in AGENTS.md CLAUDE.md README.md package.json vitest.config.ts .env.example docs fixtures src scripts; do
    if [ -e "$KIT/$entry" ]; then
      if [ -e "$entry" ]; then echo "Keeping existing $entry (not overwritten)"; else cp -R "$KIT/$entry" "$entry"; fi
      git add -A -- "$entry"
    fi
  done

  # Template additions the agent needs: the inventory exporter, and a fix for
  # generate.mjs failing with ERR_FS_CP_EEXIST on newer Node versions (its
  # tests fail on Node 22.23 before this change, pass after).
  if [ -f "$KIT/template/tools/export-design-system.mjs" ] && [ ! -e template/tools/export-design-system.mjs ]; then
    cp "$KIT/template/tools/export-design-system.mjs" template/tools/export-design-system.mjs
    git add template/tools/export-design-system.mjs
  fi
  if [ -f template/tools/generate.mjs ]; then
    node - template/tools/generate.mjs <<'NODE'
const { readFileSync, writeFileSync } = require('node:fs');
const file = process.argv[2];
const source = readFileSync(file, 'utf8');
const anchor = '  await mkdir(target, { recursive: true });\n';
const imports = '  realpath,\n  stat,\n';
// Only when both expected lines are there; a branch that already changed this
// code is left alone.
if (source.includes(anchor) && source.includes(imports) && !source.includes('rmdir')) {
  writeFileSync(
    file,
    source
      .replace(
        anchor,
        "  // cp creates the target itself; an existing (empty) target makes newer\n" +
          "  // Node versions fail with ERR_FS_CP_EEXIST under errorOnExist.\n" +
          "  await mkdir(dirname(target), { recursive: true });\n" +
          "  // Only an empty target gets here (checked above); rmdir refuses anything else.\n" +
          "  await rmdir(target).catch((error) => {\n" +
          "    if (error.code !== 'ENOENT') throw error;\n" +
          "  });\n",
      )
      .replace(imports, '  realpath,\n  rmdir,\n  stat,\n'),
  );
} else {
  console.error('migrate-repo: generate.mjs differs from the tested version; EEXIST fix skipped (see docs/MIGRATION.md).');
}
NODE
    git add template/tools/generate.mjs
  fi

  if $COMMIT; then
    git commit -q -m "Add the generator agent kickoff: plan, options, specs, prompts, fixtures

Also adds template/tools/export-design-system.mjs for the agent and fixes
generate.mjs failing with ERR_FS_CP_EEXIST on newer Node versions."
    echo "Committed the kit."
  fi
fi

echo
echo "Done, on branch restructure/agent-root (from $BASE). Next:"
echo "  cd template && pnpm install --frozen-lockfile && pnpm mcp:setup && pnpm mcp:check && pnpm typecheck"
echo "  cd .. && pnpm install && pnpm test"
echo "When the checks pass, merge it into $BASE:"
echo "  git checkout $BASE && git merge --ff-only restructure/agent-root"
echo "To undo instead:"
echo "  git checkout $BASE && git branch -D restructure/agent-root"
echo "Untracked files still at the root (delete or move them yourself):"
git status --porcelain --ignored --untracked-files=normal | awk '{print $2}' | grep -v '^template/' | grep -v '^mcp/' || echo "  none"
