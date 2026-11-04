# Weave

An agent that turns an idea, written at any level of detail, into a website
that is close to production ready: user flows, a design built on a real design
system, a data contract, and a working frontend that keeps its data in entity
stores inside the app. Built on Meta's Muse models through the Meta Model API.

The approach in one line: models write specifications and code; code checks
both. Each spec stage writes a JSON artifact with stable IDs. Model reviewers
check it, and so do code validators where the stage has them. Only mandatory
issues and reviewer blockers go back to the model, for at most three rounds. The
coding stages run Muse Code sessions, and checks and reviewers judge each one.

## Repository

| Path        | Contents                                                                                       |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `src/`      | The generator: CLI, stage runner, stages, validators                                           |
| `template/` | The design-system workspace that every generated app is copied from: packages, web, server     |
| `mcps/`     | MCP servers, one folder each; `design-system` makes the design system queryable and checkable |
| `docs/`     | The benchmark spec                                                                             |
| `fixtures/` | Reference idea briefs and golden artifacts                                                     |

## Quick start

Requires Node 22.18+ (24.11 recommended, see `mcps/frontend/.nvmrc`) and pnpm.

```sh
pnpm template:setup        # install the template, build and check the MCP
pnpm install               # the generator's own dependencies
cp .env.example .env       # then set MODEL_API_KEY
pnpm smoke                 # one structured call to the Meta Model API
pnpm weave run fixtures/ideas/freelancer-workspace.md --to flows-expand
```

Runs land in `runs/<runId>/`.
