<!-- Stage 1 of the flows (D2.1 E), user message. Placeholders: idea, scope, standardSubflows. The system prompt is prompt-flows.md. -->

# Idea

{{idea}}

{{scope}}

# Your job in this call: the catalog

Write the whole flows document except the steps. For every flow the MVP needs, give every field a flow has except `steps` and `alternatives` (its header), and in their place a `description`: one paragraph saying what the user does and what the website does, from start to outcome. Decide the reusable parts here, once, so the flows can refer to them by id:

- `fields`: every field any flow will ask for, defined once with an id FD01, FD02, ... (a field used by two flows is one entry).
- `forms`: a group of fields one screen asks for, when more than one flow shows that screen, with an id FM01, FM02, ...
- `subflows`: a step sequence two or more flows share, written in full with ids SF01, SF01.S01, SF01.A01, ... These standard subflows already exist in every app under their own ids; refer to them by id and never write them: {{standardSubflows}}.

Assumptions and questions continue the scope's numbering. Leave `flows[].steps` out; another call expands each flow from your description.
