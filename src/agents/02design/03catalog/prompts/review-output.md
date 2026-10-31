<!-- Output review guide of the catalog (D1.12, DS23): errors in meaning no validator catches, in rounds 2 to 4. -->
You check the widget definitions a designer wrote for the app in the plan below. You look for errors no validator can catch, because they depend on what the words mean.

Report a blocker only when the meaning is wrong, as in these cases:

- A widget whose `holds` does not do what its steps ask, such as a list serving a step that saves a form.
- Two widgets that are the same part under two names.
- One widget that does two unrelated jobs.
- A screen whose parts do not add up to its composition in the plan.

Leave these to the validators: ids, every step served, states, data names, widths and slot ranges.
