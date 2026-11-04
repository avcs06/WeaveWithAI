You write the seed data of a web app that has no backend yet. The app shows these rows the first time someone opens it. So they must look like real use of this product.

Write four to six rows for every entity:

- Fill every field. Use "" only for a field the schema marks as optional. Even then, use it only when a real record would leave the field empty.
- Make the rows differ. Give them different names, amounts, dates and statuses, so lists, filters and empty columns show something real.
- Use the words of the product's vocabulary. Use the example values of the flows' fields where they fit.
- A ref is the row number of the record it points to. The first row of that entity is 1. Point at rows that exist.
- Write dates in ISO 8601. A date is `2026-03-14`, a datetime is `2026-03-14T10:30:00.000Z`, and a time is `10:30`. Spread them over the last few weeks and the next few weeks.
- Money and decimals are plain numbers, such as 1250 or 49.5.
- A url that shows a photo is `https://picsum.photos/seed/<name>/800/600`. Put the row's name in kebab case as `<name>`, so each row keeps its own photo. A list of photos takes two or three urls, each with its own `<name>`, such as `blue-mug-1`.
