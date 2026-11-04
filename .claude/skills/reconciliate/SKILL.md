---
name: reconciliate
description: End-to-end review of a Weave stage chain (design, flows, code, or whatever the working-tree diff touches) after a series of patches and decision changes. Finds and fixes stale prompts, code, docs and tests, contradictions, prompts that don't hand off to each other, validator coverage gaps, and prompt wording that is hard to follow. Use when the user runs /reconciliate.
argument-hint: "[design | flows | code]"
---

# Reconciliate

After many patches, a stage chain keeps old decisions in some files, rules
drift apart, and prompts stop fitting together. Review the chain as it is now,
fix that damage, and leave every change unstaged.

## Scope

The argument names the chain:

- `design`: brief, theme, architect. Also the design-system inventory and
  prose, and the design and font config.
- `flows`: scope, flows-catalog, flows-expand, flows. Also the domain
  checklist (`domains.json`).
- `code`: contract, scaffold, contract code, frames, pages. Also the coding
  guidelines, the fix task and the code reviewers.
- empty: every chain that `git status --short` touches, each reviewed whole.

Every chain also covers: the core code it calls (the stage runner, the review
call, the schema helpers, the fix and review prompts) and its entries in the
stage registry. Find each piece by searching; don't assume a folder.

## 1. Establish the current truth

- Decisions: AGENTS.md and the ones the user made in this session. Never
  change a decision; fix the text that contradicts it.
- For each step, in chain order, read whole files: the system prompt, its
  input message, the builder that fills both, the schema, the stage code that
  calls it, its rules and the list that registers them, its peer and output
  review guides, render, fixtures and tests. Patch damage sits next to the
  diff, not in it.
- Write the chain table: per step, what it reads (artifact fields and
  placeholders), what it decides, what it writes. Everything below checks
  against this table.

## 2. Check

### Stale

- Text that matches a dropped decision: prompts, the HTML comments in prompts
  (notes for us; `loadPrompt` strips them), schema `.describe()` strings,
  docs, test names, fixtures, snapshots.
- Unused code: exports, rule helpers, types, schema fields no prompt asks for
  and no code reads, fixture files, mutation entries. Prove each with
  `grep -rn` over the code, docs and fixtures.
- An export with one caller: inline it.
- Obsolete vitest snapshots (`pnpm test` prints the count): delete those
  entries. A changed snapshot is a finding to read; never accept it with `-u`.
- Comments that tell history ("no longer", "still", "instead of", "now") or
  restate the code. A comment says only the why.

### Contradictions

- Prompt and schema: every field the prompt asks for exists with the same
  name and allowed values, and the schema asks for nothing the prompt doesn't
  explain.
- Prompt and rule: the same threshold and the same cases.
- Two prompts: a later step redefines a term or rule an earlier one set.
- AGENTS.md and the code.
- A test name and its assertion; a rule file's name, its id and what it checks.
- One rule written in several places: keep one, delete the others.

### Handoffs

- Read the system prompts in chain order as one document, then the input
  messages. Each step uses the names and fields the step before wrote, doesn't
  re-decide what an earlier step decided, and asks for what the next step
  reads. A field a later step needs that nothing produces is a gap. A field
  produced that nothing reads is stale.
- `fillPrompt` throws on missing and unused placeholders, so check meaning:
  the value the builder passes is what the prompt says it is.
- A placeholder holding a list or JSON sits in its own labelled block, after
  the paragraph that mentions it.
- An exception bolted onto a rule where the rule itself should change. A rule
  that conflicts with a newer one is deleted, not narrowed.
- Review guides ask only for major blockers that no rule can check. A blocker
  a pure function could check is a missing rule, noted for later.
- The fix prompt and the review prompts match the current issue and review
  shapes.

### Rule coverage

- Table: each checkable rule a prompt states, next to its rule id. Checkable
  means decidable by a pure function from the artifact, the inventory, scope
  and flows.
- Missing rule: list it in the report as noted for later. Don't add it. New
  validators are on hold until a real run proves the design.
- Stale rule, for a case that no longer exists: delete its file, its
  registration, its mutation and any helper only it used. Its number stays
  unused.

### Wording

A model reads each prompt once and knows nothing else, so every prompt must
be easy to follow. Every system prompt, input message and review guide:

- Opens with one paragraph that gives the model a role and the whole job:
  what it writes, who builds on it, and who reviews it against which
  standard. The writer and its reviewer get the same standard.
- Names each section for what it holds. An input message names the call's
  job and says what to leave out because another call writes it.
- Says one thing per sentence, in plain words and the users' terms. A
  sentence that chains clauses with semicolons, colons and parentheses
  becomes several sentences.
- Explains each output field once, in backticks, with its format and a short
  example in parentheses.
- Gives exact limits, the same numbers the rules check. Never "about", "a
  few" or "short" where a number is meant. A vague limit with no rule behind
  it is a question for the user.
- Says what to do before what not to do. A ban that is easy to break shows a
  right and a wrong example side by side.
- Gives a reason only where the model would decide wrong without it.
- Keeps one name and one meaning per term across the chain. A later prompt
  uses the word an earlier prompt or artifact set.
- Names no rule ids, file names or code in the model's text.
  Those go in the HTML comment at the top, with the placeholders and who
  fills them.
- In review guides, the peer reviewer judges decisions and the output
  reviewer judges meaning. Each says when a finding is a blocker and ends
  with what to leave to the validators.

Rewording keeps every rule, number, case and example: after the rewrite,
every row of the rule-coverage table is still stated. A prompt test that pins
a reworded phrase gets the new phrase; what it checks stays.

## 3. Fix

- Fix stale items, contradictions, handoffs, coverage and wording directly,
  toward the current decision. Never revert an agreed decision.
- Ask, with AskUserQuestion, after the read-through and before touching those
  items, when: code and tests disagree; a fix needs a new decision.
- Never weaken a rule, threshold, fixture or test. Never rewrite a golden
  fixture: report a stale one instead.
- No model calls: no `weave run`, no `pnpm smoke`.
- Work that is not a fix goes in the report as noted for later, with one line
  saying why.
- Keep files under about 300 lines. Docs in short plain sentences, no em
  dashes.

## 4. Verify

- `pnpm typecheck` and `pnpm test`. Show the summary lines.
- `pnpm weave validate <runId>` on the latest run of each reference idea, before
  and after the fixes. It reruns the validators of the stages that register a
  `validate` hook, with no model calls. A new issue from a new rule is
  expected: list it. Any other change is a finding.
- `grep -rn` every removed name and show there are no hits.

## 5. Report

Lead with the counts: fixed, asked, noted for later, left as is. Then each
finding with `file:line`, what was wrong, the fix and its diff. Open
questions last.
