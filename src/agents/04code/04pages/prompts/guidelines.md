<!-- CODE-006 (src/engine/conformance.ts) looks for each operation that loads a screen and its dialogs in the screen's route folder only, so a call made in a shared block fails it. -->

# Screens

- Each file here is one screen. It gives the screen's title, its purpose,
  its steps in reading order, its alternatives, the dialogs it opens, its
  route folder and the operations that load it.
- A screen goes in its route folder. Its `page.tsx` goes there, its styles
  in `page.css.ts` beside it, and its own parts and dialogs in
  `components/` beside it. When two screens use a dialog or a part, build
  it once, in `web/app/blocks/` or `web/app/components/`.
- Sign in and sign up are the template's pages, at `/sign-in` and
  `/sign-up`. Keep them as they are, and link to them.
- The template's starter page, `web/app/(routes)/(marketing)/page.tsx` at
  `/`, is a placeholder. When the screen at `/` is in the marketing group,
  write that screen over it. Otherwise, delete it.
- A screen fills its frame's main region. It has no header, navigation or
  footer of its own. Every screen but the landing page starts with a
  `PageHeader` from `@app/components/PageHeader`. Its title is the page's
  only H1. It also holds the description, the breadcrumbs to the pages
  above, and the page's actions.
- When a record's screen finds its record gone, it returns `NotFound` from
  `@app/components/NotFound` alone, in place of the page. Its title names
  what is missing, such as "Order not found" or "Patient not found". Its
  way back leads to the list.
- The frame's page container already sets the page padding, the width and
  the gap between sections. A page returns its sections, with no padding,
  max width or outer gap of its own.
- Build every step, in the order its file gives them, and every
  alternative. A step that leads to a route opens that route. A step that
  opens a dialog opens that dialog.
- Load the records through the operations the screen's file names,
  including its dialogs' operations. Call each one inside the screen's
  route folder, where a check looks for it. A dialog or a part from
  `web/app/blocks/` or `web/app/components/` gets its records from the
  screen.
- To find a component a step needs, ask the MCP. Call `search_components`,
  then `get_component` and `get_recipe`. When nothing fits, build it
  yourself in `components/` beside the page.
- Every list of records is a `Table` or a `CardList`, never anything else:
  no `ul`, no grid of Cards built by hand, no rows of text. Pick by what
  the user does with the records. A `Table` holds records the user scans,
  sorts or compares, such as an admin's list of tickets, invoices or
  orders. A `CardList` holds records the user browses or opens one by one,
  each with a photo, a description or several lines. Use `layout="grid"`
  for records browsed side by side, and `columns` for a fixed set.

## The landing page

- The hero is `Hero` from `@app/components/Hero`, first on the page. Its
  `title` is the headline, the page's only H1. Its `description` is the
  line under it. Its `actions` are the main action and the way to sign in.
  Its `media` is the preview beside them. The hero spans the page on the
  brand's gradient, and its content stays on the page's edge. When the
  hero needs a background of its own, such as the brief's signature, put
  it in a colocated `.css.ts` and pass it as `className`. Keep all text at
  4.5:1 against every background color, in each supported mode.
- Each action appears once in the view, the header included. When the
  design gives the hero signing up and the header only signing in, build
  it that way. The preview and the reasons repeat neither action.
- Build the preview from the app's own components and blocks, with records
  from the seed data. Show a few records, three at most, never a whole
  list. The preview is read-only, so nothing in it saves. The app ships no
  images, so this preview is the landing page's picture.
- Put the three or four reasons in a grid whose column count divides them.
  Three reasons go in one row, and four go in two rows of two. When the
  brief's `imagery` is `icons`, give each reason an icon from
  `lucide-react`.
- Make the brief's `signature` in `theme.json` visible on the landing page.
- All checks still hold. DESIGN-R-006 needs the H1 in the first view.
  Contrast and target sizes apply as everywhere else.
