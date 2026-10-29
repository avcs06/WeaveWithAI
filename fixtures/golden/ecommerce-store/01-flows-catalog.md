# Jaipur Clay Shop: flows catalog

## Flows
- F01 Discover the studio on the landing page (Visitor, browse): A visitor arrives on the public landing page and the website shows what the Jaipur studio sells with featured photos, the studio pickup and courier explainer with Rs 99 shipping and free above Rs 1,500, and a Start shopping entry that leads into the shop; nothing is stored.
- F02 Browse and filter the shop (Visitor, browse): A visitor browses the public shop and the website shows each piece with photo, price and honest remaining counts with zero-stock shown as Sold out; the visitor narrows the list by product type and in-stock only and the filtered list persists for browsing.
- F03 View product glaze and size availability (Visitor, browse): A visitor opens a product and the website shows its photos, price, description, glaze and size choices with remaining counts per combo where sold-out combos cannot be chosen; the visitor picks a glaze and size to check availability before ordering.
- F04 Place a pay-later guest order (Visitor, core): A visitor builds a basket of glaze, size and quantity choices, picks Jaipur studio pickup or courier, optionally applies one percent-off code, enters name, phone and courier address only, and places the order as pay-by-UPI-later; the website enforces that quantity cannot exceed what is left, decrements stock on placement, applies Rs 99 courier fee with free above Rs 1,500 after discount and free pickup, and shows a confirmation with totals and UPI instructions.
- F05 Owner sign up (Shop Owner, auth): A new studio owner creates the single owner account with email and password and the website signs them into the owner workspace with their own products, glazes, orders and codes.
- F06 Owner sign in (Shop Owner, auth): A returning owner signs in with email and password and the website opens their private workspace with products, glazes, orders and discount codes.
- F07 Owner sign out (Shop Owner, auth): A signed-in owner signs out and the website closes the workspace and returns to the public shop; public browsing is unaffected.
- F08 Track orders and mark packing progress (Shop Owner, core): A signed-in owner opens the orders list sorted new-first with placed date, buyer, items, glaze, size, fulfilment, discount and totals including shipping math, filters by New, Packed, Shipped or Picked up, opens an order for detail and marks it Packed then Shipped for courier or Picked up for pickup; the updated statuses stay after refresh.
- F09 Add a product (Shop Owner, manage): A signed-in owner creates a product with name, type, description, price, cover photo validated and previewed, sizes, glazes offered and stock per glaze and size combo; the website validates required name, price, photo and at least one stock quantity and the new piece appears in the public shop.
- F10 Edit product and restock (Shop Owner, manage): A signed-in owner finds a product in the list by type or stock state, opens it and edits name, type, description, price, photo, sizes, glazes and per-combo stock to keep availability honest; the website saves the changes and the public shop reflects them.
- F11 Delete a product (Shop Owner, manage): A signed-in owner removes a product no longer sold after confirming; the website takes it out of the public shop while past orders keep their item snapshot.
- F12 Manage glazes and spot low stock (Shop Owner, manage): A signed-in owner views all glazes with remaining counts across products where glazes with 5 or fewer pieces left are flagged as nearly gone, and creates, renames or removes glazes to plan the next batch; changes persist and flags update as orders reduce stock.
- F13 Manage discount codes (Shop Owner, manage): A signed-in owner creates percent-off weekend codes with code text, start and end dates and optional total-use limit, and edits or deletes codes when plans change; active codes become usable once per order in checkout and the list persists after refresh.
- F14 Correct or remove an order (Shop Owner, manage): A signed-in owner corrects a buyer mistake by editing order contact, address, quantities or status within the honest stock rule, or deletes a mistaken order after confirming with freed stock returned; the corrected list and totals stay after refresh.

## Fields
- FD01 Product name (required, up to 120 characters), e.g. "Speckled Chai Mug". What the piece is called in the shop
- FD02 Product type (required, one of: mug, bowl, planter, vase), e.g. "mug". Category of piece used for filtering
- FD03 Product description (optional, up to 1000 characters), e.g. "Wheel-thrown stoneware mug with speckled glaze.". Short story and care details that help the buyer decide
- FD04 Product price (required, 1 to 100000), e.g. "650". Selling price in rupees before discount and shipping
- FD05 Product photo (required, up to 500 characters), e.g. "https://example.com/mug-sage.jpg". Cover photo the buyer sees; validated and previewed for the session
- FD06 Available sizes (required, one of: Small, Medium, Large), e.g. "Medium". Sizes this product is sold in
- FD07 Glazes offered (required, one of the Glaze records), e.g. "Sage Green". Glaze options this product can be ordered in
- FD08 Stock quantity for glaze and size combo (required, 0 to 1000), e.g. "12". How many pieces remain for one glaze and size combination
- FD09 Glaze selection (required, one of the Glaze records), e.g. "Sage Green". Glaze the buyer chose for the piece
- FD10 Size selection (required, one of: Small, Medium, Large), e.g. "Medium". Size the buyer chose for the piece
- FD11 Quantity (required, 1 to 99), e.g. "2". How many of the chosen glaze and size the buyer wants
- FD12 Buyer name (required, up to 100 characters), e.g. "Ananya Sharma". Who the order is for and who the owner contacts on UPI
- FD13 Buyer phone (required, up to 15 characters), e.g. "9829012345". Phone number for pickup coordination and UPI collection
- FD14 Fulfilment method (required, one of: Studio pickup, Courier), e.g. "Courier". Whether the buyer picks up in Jaipur or wants courier delivery
- FD15 Delivery address (optional, up to 500 characters), e.g. "B-12 Malviya Nagar Jaipur 302017". Where the courier should deliver; only asked for courier orders
- FD16 Buyer discount code (optional, up to 30 characters), e.g. "CLAY10". Weekend code the buyer types to get percent off
- FD17 Glaze name (required, up to 80 characters), e.g. "Sage Green". Finish colour option shown to buyers
- FD18 Code text (required, 3 to 30 characters), e.g. "CLAYWEEKEND". Text buyers type from Instagram to get the discount
- FD19 Percent off (required, 1 to 90), e.g. "10". How much the code takes off the items total before shipping
- FD20 Start date (required), e.g. "2026-11-01". First day the code can be used
- FD21 End date (required), e.g. "2026-11-03". Last day the code can be used
- FD22 Usage limit (optional, 1 to 10000), e.g. "50". How many orders can use the code in total; empty means unlimited
- FD23 Owner email (required, up to 254 characters), e.g. "studio@jaipurclay.in". Login for the single studio owner account
- FD24 Owner password (required, 8 to 128 characters), e.g. "clay-studio-123". Secret that protects the owner workspace
- FD25 Product type filter (optional, one of: All, mug, bowl, planter, vase), e.g. "mug". Narrows the shop to one piece type
- FD26 In-stock only (optional), e.g. "true". Hides sold-out pieces when turned on
- FD27 Order status filter (optional, one of: All, New, Packed, Shipped, Picked up), e.g. "New". Narrows the owner orders list to one packing status
- FD28 Order status (required, one of: New, Packed, Shipped, Picked up), e.g. "Packed". Where the order is in packing and handover

## Forms
- FM01 Owner auth form: FD23, FD24
- FM02 Product form: FD01, FD02, FD03, FD04, FD05, FD06, FD07, FD08
- FM03 Discount code form: FD18, FD19, FD20, FD21, FD22
- FM04 Buyer checkout details form: FD12, FD13, FD14, FD15, FD16

## STD01 Confirm deletion (standard subflow)

1. (system) The website asks to confirm the deletion and says what else will be removed with it.

Other paths
- STD01.A01 (from 1, confirm) The user confirms: The website deletes the record and what belongs to it. Back to the calling flow.
- STD01.A02 (from 1, cancel) The user cancels: Nothing is deleted; the record stays as it was. Back to the calling flow.

## New assumptions
- A11 (data, affects F03, F04, F09, F10): Sizes are Small, Medium and Large where applicable; a product offers at least one size and stock is tracked per glaze/size combo.
- A12 (behavior, affects F02, F03, F09, F10): Product photos are simulated uploads: validated and previewed and kept for the session; MVP shows one cover photo per product and that photo is required to list.
- A13 (behavior, affects F11, F12): Deleting a product or glaze does not delete past orders; orders keep a snapshot of product name, price, glaze and size.
- A14 (behavior, affects F04, F08, F14): If the owner deletes an order or lowers its quantity the freed stock returns to the glaze/size count; raising quantity follows the same honest stock rule as checkout.

## New questions
- Q03: Do pieces use standard Small, Medium and Large sizes or custom dimensions per product? Why: Decides size options, product form fields and per-combo stock tracking. Default: Assume Small, Medium and Large cover all piece types for MVP.
