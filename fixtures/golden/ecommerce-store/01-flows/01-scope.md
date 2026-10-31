# Mitti Studio Shop: scope

For a Jaipur ceramicist selling small batches of mugs, bowls, planters and vases through DMs and forms. She oversells glazes, loses track of payments, and spends evenings answering availability questions. Shoppers browse live stock, pick glaze and size, and place a pickup or courier order with a discount code and pay-by-UPI-later, while she sees new orders, marks them packed and shipped, and gets low-glaze warnings.

Audience: Buyers of handmade ceramics and the Jaipur studio owner

## Roles
- Shopper (shopper, no sign-in): Person who browses the catalog and places an order without ever signing in.
- Studio Owner (studioOwner, signs in): Ceramicist who manages products, stock, discount codes and orders.

## Vocabulary
- Product (owned by Studio Owner): A sellable piece listing such as a mug or planter with photos, description, piece type and its glaze/size options.
- Variant (owned by Studio Owner): A buyable glaze-plus-size option of a product with its own price and stock count.
- Order (owned by Studio Owner): A guest purchase with items, fulfillment choice, discount, totals, order status and UPI payment state.
- DiscountCode (owned by Studio Owner): A weekend code with percent off and a validity window shared on Instagram.

## Capabilities
- accounts: Studio owner signs up/signs in/out to manage shop; shoppers need no account.
- userOwnedData: Owner sees only her products, orders and codes; shoppers see the public catalog.
- crud: Owner creates/edits/archives products, variants, codes and updates orders; shoppers create orders.
- filterSort: Filter catalog by piece type and by in-stock versus sold-out.
- roles: Two roles: guest shopper and signed-in studio owner.
- publicPages: Public landing page plus public catalog and ordering; owner pages require sign-in.
- statusWorkflow: Order New-Packed-Shipped/Picked Up-Cancelled plus Unpaid/Paid; variant In Stock/Almost Gone/Sold Out.
- tagsCategories: Piece types Mug, Bowl, Planter, Vase for grouping.
- datesDeadlines: Discount-code start/end dates and order placed dates.
- simpleCounts: Live per-variant stock counts, low-stock counts, order counts and totals with shipping and discount.
- fileUploads (simulated): Product photos validated and previewed in UI; kept for session per simulation placeholder.

## In scope
- Public landing page saying what the studio sells, how ordering works, pickup in Jaipur versus Rs.99 courier with free courier over Rs.1,500, and pay-later-by-UPI, with a start-shopping entry.
- Browse catalog with photos, piece type, description, glaze and size options, price, and honest live stock including Almost Gone flag and Sold Out disabled.
- Guest ordering without messaging: choose glaze/size variant and quantity, choose free studio pickup or courier, add one weekend discount code, enter name/phone/address, and place order with confirmation.
- Business rules enforced: zero-stock variants cannot be ordered; courier is Rs.99 and free when total after discount reaches Rs.1,500; pickup is always free; no online payment is taken.
- Owner order list showing newest first with items, fulfillment type, totals, discount used, and payment state, with actions to mark Packed, Shipped or Picked Up, mark UPI Paid, and Cancel with stock restore.
- Owner catalog management for products and glaze/size variants with photos, prices and stock counts, including archive.
- Owner discount-code management with code, percent off, and start/end dates.
- Low-glaze warning list showing variants with 3 or fewer left so the next batch can be planned.

## Out of scope
- Online payments and automatic UPI collection: Owner explicitly does not want online payments yet. Instead: Checkout shows pay-by-UPI-later instructions as text and owner marks the order Paid manually after collecting.
- Courier booking, shipping labels and live tracking: Small-batch manual dispatch; no courier integration implied. Instead: Owner ships via her own courier and only updates the order status to Shipped; buyer sees status text.
- Instagram DM or Google Form ordering and chat: Goal is to replace DMs and forms, not integrate them. Instead: Site shows studio contact and pickup address as text; all orders go through the shop order form.
- Batch production planning beyond low-stock warnings: Idea asks only to know when a glaze is nearly gone. Instead: Owner uses live stock and Almost Gone counts to plan the next batch manually.

## Assumptions
- A01 (permission): One studio-owner account manages the shop; shoppers never sign in and order as guests.
- A02 (behavior): Stock is tracked per glaze-plus-size variant and decremented when an order is placed; a cancelled order restores stock.
- A03 (behavior): A variant with zero stock shows as Sold Out and cannot be ordered; a variant with 3 or fewer left shows as Almost Gone.
- A04 (behavior): Fulfillment is the shopper's choice: free studio pickup in Jaipur or courier at Rs.99, with free courier when the total after discount is Rs.1,500 or more.
- A05 (behavior): Discount codes give percent off, one code per order, valid only within start and end dates; invalid or expired codes are rejected with a message.
- A06 (behavior): Order flow is New to Packed to Shipped for courier or Picked Up for pickup, plus Cancelled; payment is tracked separately as Unpaid or Paid and marked manually by the owner after UPI collection.
- A07 (data): Guest checkout asks only for name, phone, fulfillment choice, and courier address when needed; no account or payment fields.
- A08 (data): A product has name, piece type, description, photos, and variants each with glaze, size, price and stock; deleting a product archives it and leaves past orders unchanged.

## Questions
- Q01 (blocking): Can shoppers order as guests without creating an account? Why: Requiring accounts would add steps before first success and change permissions and order data. Default: Yes - guest checkout with name and phone, no buyer accounts.
- Q02: Should weekend discount codes be percent-off with an expiry window? Why: Determines DiscountCode fields and how order totals are calculated. Default: Yes - percent-off codes with start/end dates, one per order.
- Q03: Should anyone be able to choose studio pickup, or only Jaipur buyers? Why: Determines whether fulfillment choice needs any location check or stays self-selected. Default: Anyone can choose pickup; studio address is shown at checkout.
