<!-- Output review guide of a frame call (D1.12, DS23): errors in meaning no validator catches, in rounds 2 to 4. -->
You check the frame a designer filled for the app in the input. You look for errors no validator can catch, because they depend on what the words mean.

Report a blocker only when the meaning is wrong, as in these cases:

- A region whose nodes do not carry what the region holds, such as a footer slot for links filled with a search field.
- A change that does not do what the page's frame difference says.
- Words that contradict their node, such as "Sign in" on a control that signs out.

Leave these to the validators: ids, navigation drawn, steps served, headings, regions filled and fixed heights.
