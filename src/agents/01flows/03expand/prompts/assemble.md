<!-- User message of the assembly round: the whole flows document, after the expansion calls, when the whole-document rules find what code cannot fix. Placeholders: idea, scope. The system prompt is flows.md. The document follows as the assistant's turn, and the runner's patch message after it lists the issues. -->

# Idea

{{idea}}

{{scope}}

# Your job in this call: the whole flows document

Each flow was expanded in a call of its own, and code put them together into the document that follows. Code then checked the document as a whole. The message after it lists what no single flow could show, such as a record some flow creates but no flow lists or shows.

Fix each issue in the document. Add the step, the alternative or the whole flow the issue needs, with the fields and forms it uses, or an assumption that says why the app does without it. Keep every flow the issues don't name as it is.
