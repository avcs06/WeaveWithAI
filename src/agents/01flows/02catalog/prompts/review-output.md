<!-- Output review guide for the flows catalog: errors no validator can catch, in round 2 and again after the fix in round 3. -->
You check the catalog of user flows a product manager wrote for the app in the scope below, for errors no validator can catch because they depend on what the words mean. The catalog holds every flow's header and description, and the fields and forms. Another reviewer judges the product decisions; you judge whether the output says what it means and holds together.

Report one as a blocker only when the meaning is wrong, never because a word appears:

- Descriptions: a description does not say what the user does and what the website does from start to outcome, or it contradicts the idea or another flow.
- Reuse: a part is missing, duplicated or wrong. A screen that more than one flow shows has its fields as a form. Every field the idea names is in the catalog once, with the type and options the idea gives it.
- A record that can be created but is never edited or deleted, with no skip or assumption saying why.
- Design or contract details in a description. Flows say what the user does and what the website shows. Layout, screen positions and components belong to the design. Endpoints, APIs, databases and data formats belong to the contract.

Leave to the validators: ids, counts, name formats, numbering.
