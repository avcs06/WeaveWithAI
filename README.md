# Weave

An agent that turns an idea, written at any level of detail, into a website
that is close to production ready: user flows, a design built on a real design
system, API contracts, a working frontend and backend, end-to-end tests and a
deployment package. Built on Meta's Muse models through the Meta Model API.

The approach in one line: models write specifications; code generates, checks
and ships. Every stage writes a JSON artifact with stable IDs, a code validator
checks it, and only mandatory findings go back to the model, a bounded number
of times.

## Repository

| Path        | Contents                                                                                       |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `src/`      | The generator: CLI, stage runner, stages, validators                                           |
| `template/` | The design-system workspace that every generated app is copied from: packages, web, server     |
| `mcps/`     | MCP servers, one folder each; `design-system` makes the design system queryable and checkable |
| `docs/`     | Plan, implementation options, architecture and stage specs                                     |
| `fixtures/` | Reference idea briefs and golden artifacts                                                     |

## Quick start

Requires Node 22.18+ (24.11 recommended, see `mcps/frontend/.nvmrc`) and pnpm.

```sh
pnpm template:setup        # install the template, build and check the MCP
pnpm install               # the generator's own dependencies
cp .env.example .env       # then set MODEL_API_KEY
pnpm smoke                 # one structured call to the Meta Model API
pnpm weave run fixtures/ideas/project-tracker.md --to flows
```

Runs land in `runs/<runId>/`. Start with `docs/README.md` for how the pieces fit.
