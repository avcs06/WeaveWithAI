# Jaipur Studio Ceramics Shop: flows catalog

## Flows
- F01 Discover the shop on the landing page (Buyer, browse): A buyer who is not signed in arrives on the public landing page that is the shop front, sees what the Jaipur studio shop is for, its pieces for sale with honest availability, and how to order without messaging, then chooses to browse pieces or view a piece, while the page also offers the shop owner entry to sign in.
- F02 Browse and view pieces (Buyer, browse): A buyer browses pieces with photos doing the talking, filters by type Mug, Bowl, Planter or Vase and by availability, sorts by price, and opens a piece to see its type, price, description, glaze and size options, remaining count per variant and sold-out state where none are left.
- F03 Place an order as guest (Buyer, core): A buyer chooses a piece with its glaze, size and quantity within remaining stock, enters name, phone and Studio Pickup or Courier with delivery address for courier only, optionally enters one discount code, reviews piece total, discount, ₹99 courier charge with free shipping above ₹1,500 after discount and final total, then confirms the order and sees a confirmation stating payment will be collected later by UPI and stock is now reduced.
- F04 Shop owner sign up (Shop Owner, auth): The maker creates the single shop owner account with email and password from the landing page and lands signed in ready to set up the shop and catalogue.
- F05 Shop owner sign in (Shop Owner, auth): The shop owner chooses to sign in from the landing page, enters email and password, and lands signed in on their orders and catalogue overview.
- F06 Shop owner sign out (Shop Owner, auth): The signed-in shop owner chooses to sign out and is returned to the public shop front as a signed-out visitor.
- F07 Create a piece with variants (Shop Owner, manage): The signed-in owner creates a new piece with its name, type, price, description and photos through the simulated upload with validation and preview, then adds its glaze and size variants with stock counts and any price adjustment, and publishes it so buyers see it with honest per-variant stock.
- F08 Edit a piece and its variants (Shop Owner, manage): The signed-in owner opens a piece from their catalogue, changes its name, type, price, description or photos, and adjusts its glaze and size variants including stock counts and price adjustments, then saves so the public shop immediately reflects honest availability.
- F09 Delete a piece (Shop Owner, manage): The signed-in owner chooses to delete a piece, confirms the choice, and the piece with its variants disappears from the public shop while past orders containing it remain visible in the order list.
- F10 Create a discount code (Shop Owner, manage): The signed-in owner creates a discount code for a weekend Instagram promotion by setting its code word, whether it is percentage off or fixed rupees off with its value, and its start and end dates, then saves it as active so buyers can use it at checkout.
- F11 Update or deactivate a discount code (Shop Owner, manage): The signed-in owner views discount codes newest or by date, opens a code to change its value or dates, or deactivates it so it is rejected at checkout, keeping expired and deactivated codes visible for records.
- F12 View and filter orders (Shop Owner, manage): The signed-in owner opens the order list newest first, sees buyer name and phone, pickup or courier with address, items with glaze and size, piece total, discount, shipping and final total with placed date and time, order status and payment status, and filters by order status and payment status to find New orders and those awaiting UPI payment.
- F13 Advance order fulfilment (Shop Owner, core): The signed-in owner opens a New or Packed order and moves it forward from New to Packed, then to Shipped for courier orders or Collected for pickup orders, following the allowed transitions, so buyers' fulfilment state stays truthful.
- F14 Mark order as Paid (Shop Owner, manage): The signed-in owner opens an order showing Awaiting UPI Payment and, after collecting payment by UPI outside the app, marks it Paid so the payment list no longer shows it as outstanding.
- F15 Cancel an order (Shop Owner, manage): The signed-in owner opens a New or Packed order that cannot be fulfilled, confirms cancellation, and the order becomes Cancelled with its quantities returned to variant stock while remaining visible in the order list.
- F16 Review low stock and order counts (Shop Owner, manage): The signed-in owner opens a stock overview showing counts of new orders and orders awaiting UPI payment alongside variants that are nearly gone with 2 or fewer left and variants that are sold out, to plan the next batch of ten or twenty.
- F17 Update shop settings (Shop Owner, settings): The signed-in owner updates the single shop's name, studio pickup address and pickup instructions, then saves so the shop front and order confirmations show the new text to buyers.

## Fields
- FD01 Owner email (required, up to 254 characters), e.g. "owner@jaipurceramics.in". Email the shop owner uses to sign up and sign in
- FD02 Owner password (required, 8 to 128 characters), e.g. "monsoon-kiln-42". Secret that proves the shop owner owns the account
- FD03 Shop name (required, 2 to 80 characters), e.g. "Jaipur Studio Ceramics". Name of the shop shown on the landing page and confirmations
- FD04 Studio pickup address (required, 10 to 500 characters), e.g. "14 Potter Lane, Amer Road, Jaipur 302002". Where Jaipur buyers collect pickup orders
- FD05 Pickup instructions (required, up to 500 characters), e.g. "Pickup Tue to Sat 11am to 6pm, call on arrival". How and when a buyer collects a studio pickup order
- FD06 Piece name (required, 2 to 80 characters), e.g. "Speckled Chai Mug". How the maker and buyers refer to the ceramic design
- FD07 Piece type (required, one of: Mug, Bowl, Planter, Vase), e.g. "Mug". Category of the piece used for buyer filtering
- FD08 Piece base price (required, at least 1), e.g. "650". Base selling price in rupees before variant adjustment, discount and shipping
- FD09 Piece description (required, up to 1000 characters), e.g. "Wheel-thrown stoneware mug with speckled glaze, 300ml". What the piece is, its feel and use, so buyers need not message the maker
- FD10 Piece photo (required, up to 500 characters), e.g. "https://example.in/photos/speckled-mug-1.jpg". Photo of the piece so photos do the talking; upload is validated and previewed and kept for the session
- FD11 Glaze name (required, 1 to 60 characters), e.g. "Speckled White". Glaze option the owner offers for a piece, entered when creating stock
- FD12 Size name (required, 1 to 60 characters), e.g. "Large". Size option the owner offers for a piece, entered when creating stock
- FD13 Variant stock count (required, 0 to 1000), e.g. "12". How many pieces remain for that glaze and size; 0 means sold out and cannot be ordered
- FD14 Variant price adjustment (optional), e.g. "0". Extra rupees added to the base price for that glaze and size, 0 when no difference
- FD15 Chosen glaze (required, one of the Variant records), e.g. "Speckled White". Glaze the buyer picks for the piece, chosen from variants that still have stock
- FD16 Chosen size (required, one of the Variant records), e.g. "Large". Size the buyer picks for the piece, chosen from variants that still have stock
- FD17 Quantity (required, at least 1), e.g. "2". How many of the chosen glaze and size the buyer orders, never more than stock left
- FD18 Buyer name (required, 2 to 80 characters), e.g. "Anaya Sharma". Who placed the order and who the maker contacts about UPI and handover
- FD19 Buyer phone (required, 10 to 15 characters), e.g. "9829012345". Phone number the maker uses to collect UPI payment and arrange pickup or courier
- FD20 Fulfilment choice (required, one of: Studio Pickup, Courier), e.g. "Courier". Whether the buyer collects at the Jaipur studio for free or pays for courier delivery
- FD21 Delivery address (optional, 10 to 500 characters), e.g. "B-4 Rose Apartments, C-Scheme, Jaipur 302001". Where the courier sends the order; only needed for courier orders
- FD22 Discount code entered (optional, 2 to 30 characters), e.g. "PINKWEEKEND". Code word the buyer types at checkout to get the Instagram promotion
- FD23 Discount code word (required, 2 to 30 characters), e.g. "PINKWEEKEND". Code word the owner shares on Instagram that buyers type at checkout
- FD24 Discount kind (required, one of: Percentage off, Fixed rupees off), e.g. "Percentage off". Whether the code takes a percentage off or a fixed rupees amount off
- FD25 Discount value (required, 1 to 100), e.g. "10". How much the code takes off: percent when percentage off, rupees when fixed rupees off
- FD26 Discount start date (required), e.g. "2026-12-05". First day the code can be used
- FD27 Discount end date (required), e.g. "2026-12-07". Last day the code can be used; after this it is rejected as expired
- FD28 Discount active (required), e.g. "yes". Whether the code can be used; the owner switches it off to deactivate

## Forms
- FM01 Owner account form: FD01, FD02
- FM02 Piece form: FD06, FD07, FD08, FD09, FD10
- FM03 Variant form: FD11, FD12, FD13, FD14
- FM04 Checkout form: FD15, FD16, FD17, FD18, FD19, FD20, FD21, FD22
- FM05 Discount code form: FD23, FD24, FD25, FD26, FD27
- FM06 Shop settings form: FD03, FD04, FD05

## STD01 Confirm deletion (standard subflow)

1. (system) The website asks to confirm the deletion and says what else will be removed with it.

Other paths
- STD01.A01 (from 1, confirm) The user confirms: The website deletes the record and what belongs to it. Back to the calling flow.
- STD01.A02 (from 1, cancel) The user cancels: Nothing is deleted; the record stays as it was. Back to the calling flow.

## New assumptions
- A08 (data, affects Piece creation, public shop visibility): A piece appears in the public shop only when it has a name, type, price, description, at least one photo and at least one glaze and size variant. A variant requires a glaze name, size name and stock count; its price adjustment defaults to 0 so the variant price is the piece base price plus adjustment.
- A09 (behavior, affects past orders, deletion): Deleting a piece removes it and its variants from the public shop but never deletes or changes past orders. Past orders keep the piece name, glaze, size, quantity and prices as they were at ordering time.
- A10 (behavior, affects dashboard counts, low stock): Owner counts are derived live: new orders are orders with status New, awaiting payment are orders with payment status Awaiting UPI Payment, nearly gone variants have stock 1 or 2 left, sold out variants have 0 left.
