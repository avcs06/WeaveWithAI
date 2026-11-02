<!-- The reviewer's user message, the same for the peer and the output reviewer; runSpecStage's review fills it. Coding units send their own (src/agents/04code/prompts/review-input.md). Placeholders: system, the writer's filled system prompt; user, its first user message; output, its last answer as JSON; known, the validators' warnings as one "- RULE at ID: message" line each, or "None.". No fix takes a warning. -->
Review the output below.

## Instructions the model was given

````
{{system}}
````

## Input the model was given

````
{{user}}
````

## Output to review

````json
{{output}}
````

## Known issues, already found by code

{{known}}
