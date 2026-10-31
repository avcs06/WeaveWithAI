# Mitti Studio Shop: flows catalog

## Flows
- F01 Discover the studio on the landing page (Shopper, browse): A visitor arrives on the public landing page and the website explains what Mitti Studio sells in small batches, how guest ordering works without messaging, free Jaipur studio pickup versus Rs.99 courier with free courier over Rs.1,500, and pay-later-by-UPI, then offers a start-shopping entry that leads to the live catalog.
- F02 Browse catalog with live stock (Shopper, browse): The shopper opens the public catalog and the website shows products with photos, piece type, description, glaze and size options, price and honest live stock with Almost Gone flags and disabled Sold Out variants, and the shopper narrows the list by piece type Mug, Bowl, Planter, Vase and by in-stock versus sold-out.
- F03 Place a guest pickup or courier order (Shopper, core): The shopper chooses an in-stock glaze and size variant and quantity, picks free studio pickup or courier, optionally adds one weekend discount code validated against its dates, enters name, phone and courier address when needed, and places the order; the website enforces zero-stock blocking, Rs.99 courier with free courier when the total after discount reaches Rs.1,500 and always-free pickup, decrements stock, and shows a confirmation with pay-by-UPI-later instructions.
- F04 Studio owner sign up (Studio Owner, auth): A new studio owner creates the single shop account with email and password and the website signs her in so she can manage products, orders and discount codes.
- F05 Studio owner sign in (Studio Owner, auth): The studio owner returns with email and password and the website signs her in to her own products, orders and codes.
- F06 Studio owner sign out (Studio Owner, auth): The signed-in studio owner chooses to sign out and the website ends the session and returns to public pages.
- F07 View and fulfill orders (Studio Owner, manage): The signed-in owner opens the order list newest first and the website shows items, fulfillment type, totals, discount used and Unpaid or Paid state with counts, lets her find orders by status, and lets her mark an order Packed then Shipped for courier or Picked Up for pickup, mark UPI Paid after collecting, and Cancel with stock restore.
- F08 Create a product with variants (Studio Owner, manage): The signed-in owner creates a new product listing with name, piece type, description and photos plus one or more glaze and size variants each with price and stock count, and the website validates the photo preview and publishes the listing to the public catalog with live stock.
- F09 Edit a product and its variants (Studio Owner, manage): The signed-in owner finds a product in her catalog list, updates its name, description, photos, piece type and its variants glaze, size, price and stock counts, and the website saves the changes and refreshes live stock flags including Almost Gone and Sold Out in the shopper catalog.
- F10 Archive a product (Studio Owner, manage): The signed-in owner chooses to archive a product she no longer sells and confirms, and the website hides it from the shopper catalog while leaving past orders that contain it unchanged.
- F11 Manage discount codes (Studio Owner, manage): The signed-in owner opens the discount-code list and creates, edits and deletes weekend codes with code value, percent off and start and end dates, and the website validates dates and makes valid codes usable once per guest order at checkout.
- F12 View low-glaze warnings (Studio Owner, manage): The signed-in owner opens the low-stock view and the website lists variants with 3 or fewer units left with their product, glaze, size and remaining count so she can plan the next batch.

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
