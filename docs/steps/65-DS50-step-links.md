# 65 · DS50 A step that goes on to another screen links there

Phase 3 · 60 min · Depends: DS49 · Decisions: DS23 · Spec: specs/design.md "Draw" and its rule table

## Goal

When the flow of a step goes on at a step another screen shows, the control
that does the step opens that screen. No page of a flow is left with no way
in.

## Why

The ecommerce run 20261101-0150 ended with two pages nobody can reach:
S04 Order confirmation and S11 Order detail (DESIGN-017, known).

- The architect lists the step that opens a page on that page: "The owner
  opens an order" (F12.S03) on S11, "The buyer confirms the order" (F03.S03)
  on S04.
- The control one step before, on the previous page, never opens it. The
  order row's navigation S10.n09 has `navigatesTo` "", and the checkout S03
  has no control that goes to S04.
- DESIGN-017 notices only at assemble, at a screen id no call owns, so it
  stays known. An owner cannot open an order, and a checkout never reaches
  its confirmation.

## What this step does

1. **Leads, in code.** `leadsOf(widget, plan, catalog, flows)` in
   `rules/helpers.ts`. For each step the widget serves, take the next step
   of its flow, or the first step of the subflow it runs. When no screen
   that shows the widget lists that next step, the screens that do list it
   are the step's lead: `{ step, next, screens }`. A next step a screen's
   frame serves (`frameSteps`) counts as listed on that screen. Alternatives
   are not leads.
2. **The draw input** gets a block "Where the flow goes on", one line a
   lead: `F12.S02 → S11 Order detail`. The `navigatesTo` bullet of the node
   guide (`06draw/prompts/nodes.md`) gains: "When the flow of a step goes on
   on another screen, the control that does the step opens that screen. The
   input lists those steps."
3. **DESIGN-049 · mandatory**, a widget rule in the draw checks. For each
   lead, some node of the build that serves the step has `navigatesTo` one
   of the lead's screens. The issue sits at the node that serves the step
   when one action or navigation does, else at the widget, and says: "W12
   serves F12.S02, and the flow goes on at F12.S03 on S11 Order detail. The
   control that does F12.S02 opens that screen. Set navigatesTo of W12.n09
   to S11." The draw stage computes the leads and passes them in
   `WidgetInput`.
4. DESIGN-017 stays at assemble as the net.

## Tests

- `leadsOf`: in the reading-list fixture F03.S01 on S04 leads to S05;
  F05.S02 runs STD01 and leads to the dialog S07; a step whose next step is
  on its own screen has no lead.
- Every reading-list build passes DESIGN-049: its four steps that go on to
  another screen already link (F01.S01 to S03, F02.S01 to S02, F03.S01 to
  S05, F05.S02 to S07).
- Clearing `navigatesTo` of the shelf header's Add book action (S04.n06 in
  the screens fixture) fails DESIGN-049 at that node.
- The draw input names each lead with its screen's name.

## Done when

```sh
pnpm typecheck
pnpm test
```

The spec's rule table has DESIGN-049, and its "Draw" section says a control
opens the screen its flow goes on to.

## Watch out

- A step served on several screens leads only when none of the widget's
  screens list the next step.
- A dialog opened by a delete is a lead too: the delete opens the dialog
  that runs the subflow.
