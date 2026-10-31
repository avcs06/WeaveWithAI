# Mitti Studio Shop: user flows

## F01 Discover the studio on the landing page
Shopper · browse · Goal: Understand what the studio sells and how to order, and start shopping.
Before: Not signed in

1. The shopper arrives on the public landing page. The website explains what Mitti Studio sells in small batches, guest ordering without messaging, free Jaipur studio pickup versus Rs.99 courier with free courier over Rs.1,500, pay-later-by-UPI, and shows a start-shopping entry.
2. The shopper chooses to start shopping. The website shows the live catalog with current pieces and stock states.

Outcome: Nothing is stored; the shopper knows pickup, shipping and pay-later terms and the catalog is one action away after a refresh.

## F02 Browse catalog with live stock
Shopper · browse · Goal: Browse live pieces and find what is still available.
Before: Not signed in

1. The shopper opens the public catalog. The website shows products with photos, piece type, description, glaze and size options, price and live stock with Almost Gone flags and disabled Sold Out variants.
   Changes: lists Product, lists Variant.
2. The shopper narrows the list by piece type and by in-stock versus sold-out.
   - Piece type filter (optional, one of: All, Mug, Bowl, Planter, Vase), e.g. "Mug"
   - Availability filter (optional, one of: All, In stock, Sold out), e.g. "In stock"
   The website shows only the products matching the chosen piece type and availability.
   Changes: lists Product, lists Variant.

Other paths
- F02.A01 (from 1, empty) No products are published yet: The website says no pieces are listed right now and invites the shopper to check back or contact the studio. Flow ends.
- F02.A02 (from 2, empty) No products match the chosen piece type or availability: The website says no pieces match and offers to clear the filters. Back to 2.

Outcome: No data is changed; the shopper has seen current products and stock states that persist after a refresh.

## F03 Place a guest pickup or courier order
Shopper · core · Goal: Order chosen pieces as a guest without messaging.
Before: Not signed in; At least one variant in stock.

1. The shopper opens a product from the catalog. The website shows the product name, piece type, description, photos, glaze and size variants with price and live stock, Almost Gone flags, and disabled Sold Out variants.
   Changes: reads Product, reads Variant.
2. The shopper chooses an in-stock glaze and size variant and quantity and adds it to the order, repeating for more variants as needed.
   - Quantity (required, 1 to 20), e.g. "  2"
   The website shows the order items with quantities and running items total and blocks zero-stock variants.
   Changes: reads Variant.
3. The shopper chooses studio pickup or courier and optionally types one weekend discount code.
   - Fulfillment choice (required, one of: Studio pickup, Courier), e.g. "Courier"
   - Discount code entered (optional, up to 20 characters), e.g. "WEEKEND10"
   The website validates the code against its start and end dates, shows the discount, and shows totals with Rs.99 courier or free courier when the total after discount reaches Rs.1,500 and always-free pickup, plus the studio pickup address.
   Changes: reads DiscountCode.
4. The shopper enters name, phone, and courier address when fulfillment is courier.
   - Shopper name (required, 1 to 80 characters), e.g. "Ananya Sharma"
   - Shopper phone (required), e.g. "+91 98290 12345"
   - Courier address (optional, up to 500 characters), e.g. "B-14, Malviya Nagar, Jaipur 302017"
   The website shows the order summary with items, fulfillment, discount, shipping and total plus pay-by-UPI-later instructions.
5. The shopper places the order. The website stores the order as New and Unpaid, reduces variant stock, and shows a confirmation with order details, totals, fulfillment instructions and pay-by-UPI-later text.
   Changes: creates Order, updates Variant.

Other paths
- F03.A01 (from 1, notFound) The product was archived in the meantime: The website says the piece is no longer available and shows the catalog. Flow ends.
- F03.A02 (from 2, invalid) The quantity is empty, zero, or more than the live stock: The website marks the quantity and keeps what was typed. Back to 2.
- F03.A03 (from 2, failure) Adding the items fails: The website keeps the chosen variant and quantity and offers to retry. Back to 2.
- F03.A04 (from 2, conflict) The chosen variant just sold out: The website says the variant just sold out, marks it Sold Out, and shows the product with remaining options. Back to 1.
- F03.A05 (from 3, invalid) No fulfillment choice is selected: The website marks the fulfillment choice and keeps the typed code. Back to 3.
- F03.A06 (from 3, other) The code is unknown, expired, or outside its start and end dates: The website rejects the code with a message, keeps the order items, and allows ordering without a code or with a different code. Back to 3.
- F03.A07 (from 3, failure) Applying fulfillment and discount fails: The website keeps the chosen fulfillment and typed code and offers to retry. Back to 3.
- F03.A08 (from 4, invalid) Name or phone is missing or phone is not valid, or courier address is missing for courier: The website marks what is wrong and keeps all typed values. Back to 4.
- F03.A09 (from 4, failure) Saving the contact details fails: The website keeps all typed values and offers to retry. Back to 4.
- F03.A10 (from 5, failure) Placing the order fails: The website keeps the order details and offers to retry placing the order. Back to 5.
- F03.A11 (from 5, conflict) Stock changed and a chosen variant has no stock left at ordering time: The website says which variant is now Sold Out, removes it from the order, and shows updated totals. Back to 1.

Outcome: An Order is stored as New and Unpaid with items, fulfillment, discount and totals and variant stock is reduced; confirmation and order details remain after a refresh.

## F04 Studio owner sign up
Studio Owner · auth · Goal: Create the studio-owner account.
Before: Not signed in.

1. The owner chooses to create the studio account. The website shows an empty owner auth form.
2. The owner fills in email and password and submits. (Owner auth form)
   - Owner email (required), e.g. "hello@mittistudio.in"
   - Owner password (required, at least 8 characters), e.g. "clay&fire123"
   The website creates the single shop account, signs her in, and shows her shop workspace.

Other paths
- F04.A01 (from 2, invalid) Email or password is missing or not valid: The website marks what is wrong and keeps what was typed. Back to 2.
- F04.A02 (from 2, failure) Creating the account fails: The website keeps the typed values and offers to retry. Back to 2.
- F04.A03 (from 2, conflict) An owner account already exists for the email: The website says the account exists and offers to sign in instead. Back to 2.
- F04.A04 (from 1, cancel) The owner cancels signing up: Nothing is created; the website shows public pages. Flow ends.

Outcome: The owner account exists and the owner is signed in; refresh keeps her signed in.

## F05 Studio owner sign in
Studio Owner · auth · Goal: Sign in to manage the shop.
Before: Not signed in.

1. The owner chooses to sign in. The website shows the owner auth form.
2. The owner fills in email and password and submits. (Owner auth form)
   - Owner email (required), e.g. "hello@mittistudio.in"
   - Owner password (required, at least 8 characters), e.g. "clay&fire123"
   The website signs her in and shows her own products, orders and codes.

Other paths
- F05.A01 (from 2, invalid) Email or password is missing or not valid: The website marks what is wrong and keeps what was typed. Back to 2.
- F05.A02 (from 2, failure) Signing in fails: The website keeps the typed values and offers to retry. Back to 2.
- F05.A03 (from 2, denied) No account exists for the email or the password is wrong: The website says the sign-in details are not recognized and allows another try. Back to 2.

Outcome: The owner is signed in and sees her shop workspace; refresh keeps her signed in.

## F06 Studio owner sign out
Studio Owner · auth · Goal: Leave the shop account safely.
Before: Signed in as studio owner.

1. The owner chooses to sign out. The website ends the session and shows public pages; owner pages require sign-in again.

Outcome: The session is ended; refresh shows public pages and owner pages require sign-in again.

## F07 View and fulfill orders
Studio Owner · manage · Goal: See new orders and move them through packing, dispatch and payment.
Before: Signed in as studio owner.

1. The owner opens the order list. The website shows orders newest first with items, fulfillment type, totals, discount used, order status and Unpaid or Paid state plus order counts.
   Changes: lists Order.
2. The owner finds orders by status.
   - Order status filter (optional, one of: All, New, Packed, Shipped, Picked Up, Cancelled), e.g. "New"
   The website shows only orders with the chosen status.
   Changes: lists Order.
3. The owner opens an order. The website shows the order items, fulfillment choice and address, discount used, totals with shipping, order status and payment state.
   Changes: reads Order.
4. The owner marks the order Packed, then Shipped for courier or Picked Up for pickup, and marks UPI Paid after collecting. The website stores the new status and payment state and shows the updated order.
   Changes: updates Order.
5. The owner chooses to cancel the order. The website asks to confirm cancellation and says the Order will be marked Cancelled, Variant stock will be restored, and nothing will be deleted.
   Changes: updates Order, updates Variant.

Other paths
- F07.A01 (from 1, empty) No orders exist yet: The website says no orders have come in yet and shows how new guest orders will appear. Flow ends.
- F07.A02 (from 2, empty) No orders match the chosen status: The website says no orders have that status and offers to clear the filter. Back to 2.
- F07.A03 (from 3, notFound) The order was removed or cannot be found: The website says the order is gone and shows the newest-first order list. Flow ends.
- F07.A04 (from 4, failure) Updating status or payment fails: The website keeps the order as it was and offers to retry. Back to 4.
- F07.A05 (from 4, denied) The status change is not allowed, such as shipping before packing or picking up a courier order: The website explains the allowed order flow New to Packed to Shipped or Picked Up and keeps the order unchanged. Back to 4.
- F07.A06 (from 5, confirm) The owner confirms cancellation: The website marks the Order Cancelled, restores Variant stock, deletes nothing, and shows the updated newest-first list. Flow ends.
- F07.A07 (from 5, cancel) The owner cancels the cancellation: Nothing is changed; the website shows the order again unchanged. Flow ends.

Outcome: Order status and payment state changes are stored and stock is restored on cancel; the updated newest-first list remains after a refresh.

## F08 Create a product with variants
Studio Owner · manage · Goal: Add a new piece with its glaze and size options.
Before: Signed in as studio owner.

1. The owner chooses to add a product. The website shows an empty product form with space for glaze and size variants.
2. The owner fills in name, piece type, description and photos. (Product form)
   - Product name (required, 1 to 120 characters), e.g. "Speckled Chai Mug"
   - Piece type (required, one of: Mug, Bowl, Planter, Vase), e.g. "Mug"
   - Product description (optional, up to 1000 characters), e.g. "Hand-thrown stoneware mug with speckled glaze, 300 ml."
   - Product photo (required), e.g. "https://mitti.example/photos/mug-speckled.jpg"
   The website validates each photo as an image, shows a preview kept for the session, and keeps all typed values.
3. The owner fills in one or more glaze and size variants with price and stock and publishes the listing. (Variant form)
   - Glaze (required, 1 to 80 characters), e.g. "Sea Green"
   - Size (required, 1 to 40 characters), e.g. "300 ml"
   - Variant price (required, at least 1), e.g. "  650"
   - Variant stock count (required, at least 0), e.g. "  12"
   The website stores the product with its variants and shows it in the owner catalog and in the shopper catalog with live stock.
   Changes: creates Product, creates Variant.

Other paths
- F08.A01 (from 2, invalid) Product name, piece type, photo, or variant glaze, size, price or stock is missing or not valid: The website marks what is wrong and keeps all typed values and photo previews. Back to 2.
- F08.A02 (from 2, failure) Saving the product details or photo preview fails: The website keeps all typed values and previews and offers to retry. Back to 2.
- F08.A03 (from 2, other) The photo is not a valid image: The website rejects the photo with a message, keeps the other values, and allows choosing another photo. Back to 2.
- F08.A04 (from 3, invalid) Variant glaze, size, price or stock is missing or not valid: The website marks what is wrong and keeps all typed variant values. Back to 3.
- F08.A05 (from 3, failure) Publishing the product fails: The website keeps all product and variant values and offers to retry. Back to 3.
- F08.A06 (from 1, cancel) The owner cancels creating the product: Nothing is saved; the website shows the owner catalog as it was. Flow ends.

Outcome: A Product with its Variants is stored and appears in the shopper catalog; it is still there after a refresh.

## F09 Edit a product and its variants
Studio Owner · manage · Goal: Keep listings, prices and stock counts correct.
Before: Signed in as studio owner.; At least one product exists.

1. The owner opens the product list. The website shows her products with name, piece type, photo, variant prices and live stock states including Almost Gone and Sold Out.
   Changes: lists Product.
2. The owner opens a product from the list. The website shows the product name, piece type, description, photos and its glaze and size variants with price and stock count.
   Changes: reads Product, lists Variant.
3. The owner edits the product details and saves them. (Product form)
   - Product name (required, 1 to 120 characters), e.g. "Speckled Chai Mug"
   - Piece type (required, one of: Mug, Bowl, Planter, Vase), e.g. "Mug"
   - Product description (optional, up to 1000 characters), e.g. "Hand-thrown stoneware mug with speckled glaze, 300 ml."
   - Product photo (required), e.g. "https://mitti.example/photos/mug-speckled.jpg"
   The website validates the photo, shows a preview, saves the changes and shows the updated listing.
   Changes: updates Product.
4. The owner edits a variant glaze, size, price and stock count and saves it. (Variant form)
   - Glaze (required, 1 to 80 characters), e.g. "Sea Green"
   - Size (required, 1 to 40 characters), e.g. "300 ml"
   - Variant price (required, at least 1), e.g. "  650"
   - Variant stock count (required, at least 0), e.g. "  12"
   The website saves the variant and refreshes its Almost Gone and Sold Out flags in the listing and shopper catalog.
   Changes: updates Variant.

Other paths
- F09.A01 (from 1, empty) There are no products: The website says there are no products yet and offers to create one. Flow ends.
- F09.A02 (from 2, notFound) The product was archived in the meantime: The website says the product is gone and shows the product list. Flow ends.
- F09.A03 (from 3, invalid) A required product field is empty or the photo is not an image: The website marks what is wrong and keeps what was typed. Back to 3.
- F09.A04 (from 3, failure) Saving the product fails: The website keeps the values and offers to retry. Back to 3.
- F09.A05 (from 4, invalid) Glaze or size is empty, price is missing, or stock count is negative: The website marks what is wrong and keeps what was typed. Back to 4.
- F09.A06 (from 4, failure) Saving the variant fails: The website keeps the values and offers to retry. Back to 4.
- F09.A07 (from 2, empty) The product has no variants yet: The website shows the product details with no variants and offers to edit the product details. Back to 3.

Outcome: Product and Variant changes are stored and the updated listing and stock states remain after a refresh.

## F10 Archive a product
Studio Owner · manage · Goal: Remove a piece from sale without losing order history.
Before: Signed in as studio owner.; At least one product exists.

1. The owner opens the product list. The website shows her products with name, piece type, photos and variant stock states.
   Changes: lists Product.
2. The owner opens a product from the list. The website shows the product name, piece type, description, photos and its variants with price and stock count and an archive option.
   Changes: reads Product, lists Variant.
3. The owner chooses to archive the product. Confirm deletion (subflow STD01):
   1. (system) The website asks to confirm the deletion and says what else will be removed with it.

   Other paths
   - STD01.A01 (from 1, confirm) The user confirms: The website deletes the record and what belongs to it. Back to the calling flow.
   - STD01.A02 (from 1, cancel) The user cancels: Nothing is deleted; the record stays as it was. Back to the calling flow.
   Changes: deletes Product.

Other paths
- F10.A01 (from 1, empty) There are no products: The website says there are no products and offers to create one. Flow ends.
- F10.A02 (from 2, notFound) The product was already archived: The website says the product is gone and shows the product list. Flow ends.
- F10.A03 (from 3, confirm) The owner confirmed archiving: The website hides the product from the public catalog, leaves past orders unchanged, and shows the product list without it. Flow ends.
- F10.A04 (from 3, cancel) The owner cancelled: Nothing is archived; the website shows the product again, unchanged. Flow ends.
- F10.A05 (from 2, empty) The product has no variants: The website shows the product details with no variants and still offers to archive it. Back to 3.

Outcome: The product is archived and absent from the public catalog but past orders are unchanged; the state persists after a refresh.

## F11 Manage discount codes
Studio Owner · manage · Goal: Manage weekend Instagram discount codes.
Before: Signed in as studio owner.

1. The owner opens the discount-code list. The website shows her codes with code value, percent off, start and end dates and whether each code is currently valid.
   Changes: lists DiscountCode.
2. The owner fills in a new weekend code, percent off and start and end dates and saves it.
   - Code value (required, 1 to 20 characters), e.g. "WEEKEND10"
   - Discount percent (required, 1 to 90), e.g. "  10"
   - Discount start date (required), e.g. "2026-11-01"
   - Discount end date (required), e.g. "2026-11-03"
   The website saves the code and shows it in the list with its validity.
   Changes: creates DiscountCode.
3. The owner opens a code from the list. The website shows the code value, percent off and start and end dates.
   Changes: reads DiscountCode.
4. The owner edits the code value, percent off or dates and saves the changes.
   - Code value (required, 1 to 20 characters), e.g. "WEEKEND10"
   - Discount percent (required, 1 to 90), e.g. "  10"
   - Discount start date (required), e.g. "2026-11-01"
   - Discount end date (required), e.g. "2026-11-03"
   The website saves the changes and shows the updated code with its validity.
   Changes: updates DiscountCode.
5. The owner chooses to delete the code. Confirm deletion (subflow STD01):
   1. (system) The website asks to confirm the deletion and says what else will be removed with it.

   Other paths
   - STD01.A01 (from 1, confirm) The user confirms: The website deletes the record and what belongs to it. Back to the calling flow.
   - STD01.A02 (from 1, cancel) The user cancels: Nothing is deleted; the record stays as it was. Back to the calling flow.
   Changes: deletes DiscountCode.

Other paths
- F11.A01 (from 1, empty) There are no discount codes yet: The website says there are no codes yet and offers to create one. Flow ends.
- F11.A02 (from 2, invalid) The code is empty, the percent is outside 1 to 90, a date is missing, or the end date is before the start date: The website marks what is wrong and keeps what was typed. Back to 2.
- F11.A03 (from 2, failure) Saving the new code fails: The website keeps the values and offers to retry. Back to 2.
- F11.A04 (from 3, notFound) The code was deleted in the meantime: The website says the code is gone and shows the code list. Flow ends.
- F11.A05 (from 4, invalid) The code is empty, the percent is outside 1 to 90, a date is missing, or the end date is before the start date: The website marks what is wrong and keeps what was typed. Back to 4.
- F11.A06 (from 4, failure) Saving the changes fails: The website keeps the values and offers to retry. Back to 4.
- F11.A07 (from 5, confirm) The owner confirmed the deletion: The website deletes the code and shows the code list without it. Flow ends.
- F11.A08 (from 5, cancel) The owner cancelled: Nothing is deleted; the website shows the code again, unchanged. Flow ends.

Outcome: DiscountCode records are created, updated or deleted; the current list and their validity remain after a refresh.

## F12 View low-glaze warnings
Studio Owner · manage · Goal: Know which glazes are nearly gone.
Before: Signed in as studio owner.

1. The owner opens the low-stock view. The website shows variants with 3 or fewer units left with product name, glaze, size and remaining count for planning the next batch.
   Changes: lists Variant, reads Product.

Other paths
- F12.A01 (from 1, empty) No variant has 3 or fewer units left: The website says all glazes are sufficiently stocked and offers to return to the product list. Flow ends.

Outcome: Nothing is changed; the low-stock list with current counts is still shown after a refresh until stock changes.

## Fields
- FD01 Product name (required, 1 to 120 characters), e.g. "Speckled Chai Mug". How the studio and shoppers refer to the piece listing
- FD02 Piece type (required, one of: Mug, Bowl, Planter, Vase), e.g. "Mug". Grouping of the piece as Mug, Bowl, Planter or Vase
- FD03 Product description (optional, up to 1000 characters), e.g. "Hand-thrown stoneware mug with speckled glaze, 300 ml.". What the piece is, how it is made and how it looks
- FD04 Product photo (required), e.g. "https://mitti.example/photos/mug-speckled.jpg". Photo of the piece that shoppers see; validated and previewed before saving
- FD05 Glaze (required, 1 to 80 characters), e.g. "Sea Green". Colour/finish option of the variant
- FD06 Size (required, 1 to 40 characters), e.g. "300 ml". Size or capacity option of the variant
- FD07 Variant price (required, at least 1), e.g. "  650". Price in rupees for one unit of this glaze-plus-size variant
- FD08 Variant stock count (required, at least 0), e.g. "  12". How many units of this variant are left and can be sold
- FD09 Quantity (required, 1 to 20), e.g. "  2". How many units of the chosen variant the shopper wants, limited by live stock
- FD10 Fulfillment choice (required, one of: Studio pickup, Courier), e.g. "Courier". Whether the shopper picks up free at the Jaipur studio or pays for courier
- FD11 Discount code entered (optional, up to 20 characters), e.g. "WEEKEND10". Optional weekend code the shopper types at checkout for percent off
- FD12 Shopper name (required, 1 to 80 characters), e.g. "Ananya Sharma". Who the guest order belongs to for packing and contact
- FD13 Shopper phone (required), e.g. "+91 98290 12345". Phone number to contact the shopper about pickup or courier and UPI collection
- FD14 Courier address (optional, up to 500 characters), e.g. "B-14, Malviya Nagar, Jaipur 302017". Delivery address, required only when fulfillment choice is Courier
- FD15 Code value (required, 1 to 20 characters), e.g. "WEEKEND10". Short code shared on Instagram that shoppers type at checkout
- FD16 Discount percent (required, 1 to 90), e.g. "  10". Percent off the items total when the code is valid
- FD17 Discount start date (required), e.g. "2026-11-01". First day the code can be used
- FD18 Discount end date (required), e.g. "2026-11-03". Last day the code can be used
- FD19 Owner email (required), e.g. "hello@mittistudio.in". Email the studio owner uses to sign in
- FD20 Owner password (required, at least 8 characters), e.g. "clay&fire123". Secret that protects the owner account
- FD21 Availability filter (optional, one of: All, In stock, Sold out), e.g. "In stock". Shopper filter to show in-stock pieces versus sold-out pieces
- FD22 Order status filter (optional, one of: All, New, Packed, Shipped, Picked Up, Cancelled), e.g. "New". Owner filter to find orders by New, Packed, Shipped, Picked Up or Cancelled
- FD23 Piece type filter (optional, one of: All, Mug, Bowl, Planter, Vase), e.g. "Mug". Shopper filter to show pieces of one piece type or all piece types

## Forms
- FM01 Product form: FD01, FD02, FD03, FD04
- FM02 Variant form: FD05, FD06, FD07, FD08
- FM03 Owner auth form: FD19, FD20

## STD01 Confirm deletion (standard subflow)

1. (system) The website asks to confirm the deletion and says what else will be removed with it.

Other paths
- STD01.A01 (from 1, confirm) The user confirms: The website deletes the record and what belongs to it. Back to the calling flow.
- STD01.A02 (from 1, cancel) The user cancels: Nothing is deleted; the record stays as it was. Back to the calling flow.

## New assumptions
- A09 (data): Archived products are hidden from the shopper catalog but past orders keep their product, variant, price and quantity details unchanged.
- A10 (behavior): Owner order list is newest first; order total is items total minus percent discount plus courier fee per the Rs.99 / free over Rs.1,500 rule.
- A11 (behavior): Product photos are validated as images and previewed before saving and kept for the session per file-upload simulation; no external storage is implied.

## New questions
- Q04: Can one guest order contain multiple different glaze/size variants? Why: Determines whether checkout supports a basket of items versus a single variant and how totals and stock checks work. Default: Yes - one order can contain multiple variants and quantities; stock is checked per variant.
