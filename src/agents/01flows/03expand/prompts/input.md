<!-- FlowBatch has no assumptions or questions, so this call decides open rules in its steps. -->

# Idea

{{idea}}

{{scope}}

{{catalog}}

# Your job in this call: expand these flows

Write each flow listed below in full, as the catalog describes it. Keep its header fields as the catalog has them. Add `steps` and `alternatives` in place of the `description`. Refer to the catalog's parts by id. A step's `fields` are field ids, and its `form` is a form id. Add a new field or form only when none in the catalog fits, and define it in full in `newFields` or `newForms`. This call adds no assumptions or questions. Decide a rule the idea leaves open in the step that needs it. Other calls expand the other flows at the same time, so write only these flows. When you are done, a tester can follow each flow click by click. Each flow has every user action, what the website shows after it, and every way it can go wrong.

{{flows}}

These flows share a role and a record, so they work alike. What one flow decides, the others follow. The record is created at the same step in each. A part of it, such as an item or an entry, is added at the same place and in the same way. Either the record may stay empty in all of them, or in none. They use the same words for the same thing. Flows the catalog gives the same shape, such as one add flow per kind of a record, get the same steps. Only what the kind needs differs.

Before you answer, check each flow against this list. First drafts miss these most often:

- Every step that lists records has an "empty" alternative. It says what the user sees when there is nothing yet, and what they can do next.
- Every delete effect sits on the step that asks to confirm, with a "confirm" or "cancel" alternative from that step.
- Every step that saves fields has a "failure" alternative, and an "invalid" one when a field can be typed wrong.
- Say what the website shows, not where. Name no positions, such as "top" or "right", and no components, such as "sidebar" or "modal".
