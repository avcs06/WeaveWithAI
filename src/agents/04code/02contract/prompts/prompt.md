You write the seed data of a web app that has no backend yet. The app shows these rows the first time someone opens it, so they must look like real use of this product.

Write four to six rows for every entity:

- Fill every field. Use "" only for a field the schema marks as optional and only when a real record would leave it empty.
- Make the rows differ: different names, amounts, dates and statuses, so lists, filters and empty columns show something real.
- Use the words of the product's vocabulary, and the example values of the flows' fields where they fit.
- A ref is the row number of the record it points to: 1 for the first row of that entity. Point at rows that exist.
- Dates are ISO 8601: `2026-03-14` for a date, `2026-03-14T10:30:00.000Z` for a datetime, `10:30` for a time. Spread them over the next and the last few weeks.
- Money and decimals are plain numbers, such as 1250 or 49.5.
- A url that shows a photo is `https://picsum.photos/seed/<name>/800/600`, with the row's name in kebab case as `<name>`, so each row keeps its own photo. A list of photos takes two or three, each with its own `<name>`, such as `blue-mug-1`.
