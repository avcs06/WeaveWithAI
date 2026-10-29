# Jaipur Clay Shop: scope

For buyers of handmade mugs, bowls, planters and vases and the Jaipur studio owner who loses track of DMs, payments and glaze stock. Buyers cannot tell what is still available and the owner spends evenings answering availability. The shop shows live stock with photos, lets a buyer pick glaze and size and place a pay-later order for studio pickup or courier, while the owner tracks new orders, packing status and low glazes.

Audience: Buyers of handmade ceramics across India and the single studio owner in Jaipur

## Roles
- Visitor (visitor, no sign-in): Person browsing the shop and placing an order without signing in.
- Shop Owner (shopOwner, signs in): Studio owner in Jaipur who manages products, glazes, discount codes and orders.

## Vocabulary
- Product (owned by Shop Owner): A piece type for sale such as mug, bowl, planter or vase with photos, price, sizes and stock per glaze and size.
- Glaze (owned by Shop Owner): A finish colour option with remaining quantity used to warn when nearly gone.
- Order (owned by Shop Owner): A buyer request with chosen items, glaze and size, quantities, pickup or courier choice, discount, totals and packing status.
- DiscountCode (owned by Shop Owner): A weekend code from Instagram giving percent off with dates and usage limit.

## Capabilities
- accounts: Owner signs up/signs in/out; buyers order as guests with no account.
- userOwnedData: Owner sees only own products, glazes, orders and codes; public shop is same for all visitors.
- crud: Owner lists/views/creates/edits/deletes products, glazes and codes; visitors create orders, owner updates order status.
- filterSort: Shop filters by type and in-stock; orders sort new-first and filter by status.
- roles: Guest visitor plus signed-in shop owner.
- publicPages: Public landing page plus public shop and product views.
- statusWorkflow: Order New to Packed to Shipped/Picked up; product/glaze Sold out and low-stock flags.
- tagsCategories: Product types mug, bowl, planter, vase as categories.
- datesDeadlines: Order placed date shown and used for new-first list; discount start/end dates.
- simpleCounts: Remaining counts per glaze/size, order totals, shipping math, low-stock counts.
- fileUploads (simulated): Product photos validated and previewed, kept for session; nothing stored (simulated).

## In scope
- Public landing page saying what the studio sells, with featured photos, pickup/shipping explainer and Start shopping entry
- Public shop that shows each piece with photos, price, glaze and size choices and honest remaining counts; zero-stock options show as Sold out
- Guest ordering without messaging or sign-in: basket, Jaipur studio pickup or courier choice, discount code box, contact details, and place order as pay-by-UPI-later
- Honest stock rule: an order cannot take more than what is left; stock drops when an order is placed and sold-out combos cannot be ordered
- Shipping rule: Rs 99 courier fee, free when order total after discount is above Rs 1,500; Jaipur pickup is always free
- Discount codes: owner creates percent-off weekend codes with code text, dates and usage limit; buyers apply one code per order
- Owner orders view: new orders first with details and totals, mark Packed then Shipped or Picked up, list stays after refresh
- Low-glaze warning: glazes with little stock left are flagged so the owner can plan the next batch

## Out of scope
- Online payment or automatic UPI collection: Owner explicitly does not want online payments yet Instead: Checkout ends in a pay-later confirmation with UPI instructions; owner collects separately
- Courier booking, labels and live tracking: Single-studio manual fulfilment; no courier integration requested Instead: Owner books the courier outside the app and only marks the order Shipped
- Full kiln and batch production planning: Idea only asks to know when a glaze is nearly gone Instead: Low-glaze flagged list guides the next batch; no batch sheets or kiln schedules

## Assumptions
- A01 (permission): Buyers browse and order as guests without sign-in; only the studio owner signs in to manage the shop.
- A02 (behavior): Stock decrements when an order is placed, not when packed; if two buyers order the last piece together the first submitted order wins and the second sees sold out.
- A03 (behavior): A glaze is flagged as nearly gone when 5 or fewer pieces remain across all products using that glaze.
- A04 (behavior): One discount code per order, percent-off only, applied before shipping math; each code has code text, start/end dates and optional total-use limit.
- A05 (behavior): Order statuses are New to Packed to Shipped for courier or Picked up for pickup; there is no buyer cancel flow, the owner edits or deletes if needed.
- A06 (data): A product keeps name, type, photos, description, price, sizes, glazes offered and quantity per glaze/size combo; required to list is name, price, one photo and one stock quantity.
- A07 (behavior): Buyer chooses fulfilment: Jaipur studio pickup is always free and shows the studio address as text, courier is Rs 99 and free when the total after discount is above Rs 1,500.
- A08 (presentation): Design is earthy with lots of white space and photo-first cards; pickup location is text only with no map.
- A09 (scope): Single studio and single owner account; no staff accounts, no buyer accounts, and no buyer order-tracking logins.
- A10 (data): Checkout collects buyer name, phone and, for courier only, delivery address; no other buyer fields are required.

## Questions
- Q01: Do Jaipur buyers ever need courier and outstation buyers ever need pickup, or should the app auto-decide by pincode or city? Why: Decides whether checkout needs a manual pickup/courier choice or address-based logic and shipping validation. Default: Assume manual buyer choice; pickup shows studio address, courier asks for address.
- Q02: Should a buyer be able to cancel or change an order after placing it, or is messaging the studio enough for MVP? Why: Adds buyer-facing status, permissions and extra workflow if needed. Default: Assume no buyer cancel or edit; owner corrects or deletes the order.
