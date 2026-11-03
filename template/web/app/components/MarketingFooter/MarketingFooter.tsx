/**
 * The public site's footer bar, under its pages. Sign in and sign up have
 * their own layout, without this footer.
 *
 * Put here:
 * - Links to the site's own pages. Use a `NextLink` from
 *   `@app/components/NextLink` with `look="plain"`. Example: About,
 *   Contact. Each link opens a route from
 *   `.weave/01-scaffold/routes.json`.
 * - Links to other sites or an email. Use `Link` from `@packages/ui/Link`
 *   with `look="plain"`. Example: a `mailto:` link to the support address.
 * - A line of small print. Use a `Paragraph` from `@packages/ui/Typography`
 *   with `color="muted"`. Example: "© 2026" and the site's name.
 *
 * PageLayout draws the bar and stacks its lines, one under the other, with
 * the theme's gap. Return each line as one element, such as a row of links
 * or a line of small print.
 *
 * Example:
 *   <div className="flex-row-gap-4 flex-wrap">
 *     <NextLink look="plain" href="/about">About</NextLink>
 *     <NextLink look="plain" href="/contact">Contact</NextLink>
 *   </div>
 *   <Paragraph color="muted">© 2026 Hillside Bakery</Paragraph>
 *
 * Never put here:
 * - The logo or the account. They sit in the header.
 * - A `footer` element, height, padding, background or border. PageLayout
 *   draws the bar.
 * - The header's links again.
 * - A page, a policy or a social link that the scope and the flows do not
 *   have.
 *
 * The line "The theme puts here" below names this app's items. Build those
 * and nothing else.
 */
export const MarketingFooter = () => null;
