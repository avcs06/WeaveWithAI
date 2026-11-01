<!-- How a patch is written. The runner's fix prompt and the flows reconciliation put it in as {{patch}}; the runner merges the patch into the current document. -->
A patch lists only what changes. In a patch, each list of the document has two parts:

- `upsert`: every item that changes or is new.
  - Give each item complete.
  - Give every list inside an item in full, including what stays as it is.
  - An item replaces the item with the same key.
  - An item with a new key is added.
- `remove`: the keys of the items to delete.

An item's key is the field that names it, such as its `id` or its `name`. The schema names the key of each list.

For a list that does not change, leave both parts empty, as in `{ "upsert": [], "remove": [] }`.

Every other field of the document is null when it stays as it is. When it changes, give its whole new value.
