# Jaipur Clay Shop: user flows

## F01 Discover the studio on the landing page
Visitor · browse · Goal: Understand what the studio sells and start shopping.
Before: Not signed in.

1. The visitor opens the landing page. The website shows what the Jaipur studio sells with featured photos and explains Jaipur studio pickup and courier with Rs 99 shipping and free above Rs 1,500.
2. The visitor chooses Start shopping. The website shows the public shop with pieces, photos, prices and honest remaining counts.
   Changes: lists Product.

Other paths
- F01.A01 (from 2, empty) No products are listed yet: The website says nothing is available yet and invites the visitor to check back later. Back to 2.

Outcome: No data changes; refresh still shows the same studio intro, featured photos and Start shopping entry.

## F02 Browse and filter the shop
Visitor · browse · Goal: Find pieces that are still available.

1. The visitor opens the shop. The website shows each piece with photo, price and remaining count, marking zero-stock pieces as Sold out.
   Changes: lists Product.
2. The visitor filters by product type and in-stock only.
   - Product type filter (optional, one of: All, mug, bowl, planter, vase), e.g. "mug"
   - In-stock only (optional), e.g. "true"
   The website shows only pieces matching the chosen type and availability with honest remaining counts and Sold out flags.
   Changes: lists Product.

Other paths
- F02.A01 (from 1, empty) No products are listed yet: The website says nothing is available right now and invites the visitor to check back later. Back to 1.
- F02.A02 (from 2, empty) No pieces match the chosen type or in-stock filter: The website says nothing matches and invites the visitor to clear the filters or choose another type. Back to 2.

Outcome: No data changes; refresh still shows the same list with honest remaining counts and Sold out flags.

## F03 View product glaze and size availability
Visitor · browse · Goal: Decide on glaze and size with honest availability.
Before: At least one product exists.

1. The visitor opens a product from the shop. The website shows its photos, price, description and glaze and size choices with remaining counts per combo where sold-out combos cannot be chosen.
   Changes: reads Product.
2. The visitor picks a glaze and size.
   - Glaze selection (required, one of the Glaze records), e.g. "Sage Green"
   - Size selection (required, one of: Small, Medium, Large), e.g. "Medium"
   The website shows how many pieces remain for that glaze and size and whether it can be ordered.
   Changes: reads Product.

Other paths
- F03.A01 (from 1, notFound) The product was removed in the meantime: The website says the piece is no longer available and shows the shop again. Flow ends.
- F03.A02 (from 2, other) The chosen glaze and size combo has zero left: The website shows that combo as Sold out and invites the visitor to pick another glaze or size that is still available. Back to 2.

Outcome: No data changes; refresh still shows the same product with the same per-combo availability.

## F04 Place a pay-later guest order
Visitor · core · Goal: Order chosen pieces for pickup or courier without signing in.
Before: At least one product with available stock.

1. The visitor adds a piece with chosen glaze, size and quantity to the basket.
   - Glaze selection (required, one of the Glaze records), e.g. "Sage Green"
   - Size selection (required, one of: Small, Medium, Large), e.g. "Medium"
   - Quantity (required, 1 to 99), e.g. "2"
   The website adds the choice to the basket and shows the basket with items, per-item prices and remaining counts.
   Changes: reads Product.
2. The visitor chooses pickup or courier, enters contact details and optionally a discount code. (Buyer checkout details form)
   - Buyer name (required, up to 100 characters), e.g. "Ananya Sharma"
   - Buyer phone (required, up to 15 characters), e.g. "9829012345"
   - Fulfilment method (required, one of: Studio pickup, Courier), e.g. "Courier"
   - Delivery address (optional, up to 500 characters), e.g. "B-12 Malviya Nagar Jaipur 302017"
   - Buyer discount code (optional, up to 30 characters), e.g. "CLAY10"
   The website shows the order summary with percent-off applied before shipping, Rs 99 courier fee with free above Rs 1,500 after discount and free pickup with studio address text, plus totals.
   Changes: reads Product, reads DiscountCode.
3. The visitor places the order as pay-by-UPI-later. The website creates the order with status New, reduces stock for the ordered combos, and shows a pay-later confirmation with totals and UPI instructions.
   Changes: creates Order, updates Product, updates Glaze.

Other paths
- F04.A01 (from 1, invalid) The quantity is empty or exceeds what is left for the chosen glaze and size: The website marks the quantity, keeps the chosen glaze and size, and shows how many remain. Back to 1.
- F04.A02 (from 1, failure) Adding to the basket fails: The website keeps the chosen values and offers to try adding again. Back to 1.
- F04.A03 (from 2, invalid) Name, phone or courier address is missing or incorrect: The website marks what is wrong and keeps all typed values and the basket. Back to 2.
- F04.A04 (from 2, failure) Saving the checkout details fails: The website keeps all typed values and offers to try again. Back to 2.
- F04.A05 (from 2, other) The discount code is unknown, expired or over its usage limit: The website keeps the basket and details, shows the code was not applied, and shows totals without discount. Back to 2.
- F04.A06 (from 3, conflict) The last pieces sold out before the order was placed: The website says the combo just sold out, removes it from the basket, and shows the updated basket with what is still available. Back to 1.
- F04.A07 (from 3, failure) Placing the order fails: The website keeps the basket and details and offers to place the order again. Back to 3.

Outcome: An Order is created with status New and stock is reduced; refresh still shows the pay-later confirmation with totals and UPI instructions.

## F05 Owner sign up
Shop Owner · auth · Goal: Create the single studio owner account.
Before: Not signed in.

1. The owner chooses to sign up. The website shows an empty owner auth form.
2. The owner fills in email and password and submits. (Owner auth form)
   - Owner email (required, up to 254 characters), e.g. "studio@jaipurclay.in"
   - Owner password (required, 8 to 128 characters), e.g. "clay-studio-123"
   The website creates the single owner account and shows the signed-in owner workspace with products, glazes, orders and discount codes.

Other paths
- F05.A01 (from 2, invalid) Email or password is missing or incorrect: The website marks what is wrong and keeps the typed values. Back to 2.
- F05.A02 (from 2, failure) Creating the account fails: The website keeps the typed values and offers to try again. Back to 2.
- F05.A03 (from 2, conflict) An owner account already exists for that email: The website says the account already exists and invites the owner to sign in instead. Back to 2.

Outcome: Owner account created and signed in; refresh still shows the signed-in owner workspace.

## F06 Owner sign in
Shop Owner · auth · Goal: Access the owner workspace.
Before: Owner account exists.; Not signed in.

1. The owner chooses to sign in. The website shows an empty owner auth form.
2. The owner fills in email and password and submits. (Owner auth form)
   - Owner email (required, up to 254 characters), e.g. "studio@jaipurclay.in"
   - Owner password (required, 8 to 128 characters), e.g. "clay-studio-123"
   The website signs the owner in and shows the private workspace with products, glazes, orders and discount codes.

Other paths
- F06.A01 (from 2, invalid) Email or password is missing or incorrect: The website marks what is wrong and keeps the typed values. Back to 2.
- F06.A02 (from 2, failure) Signing in fails: The website keeps the typed values and offers to try again. Back to 2.
- F06.A03 (from 2, denied) The email or password does not match: The website says the credentials were not recognized and invites the owner to try again. Back to 2.

Outcome: Owner is signed in; refresh still shows the signed-in workspace.

## F07 Owner sign out
Shop Owner · auth · Goal: Leave the workspace secure.
Before: Signed in as shop owner.

1. The owner chooses to sign out. The website closes the workspace and shows the public shop in a signed-out state.

Outcome: Owner is signed out; refresh still shows the signed-out state and the public shop remains visible.

## F08 Track orders and mark packing progress
Shop Owner · core · Goal: See newest orders first and move them to Packed then Shipped or Picked up.
Before: Signed in as shop owner.

1. The owner opens the orders list. The website shows orders sorted new-first with placed date, buyer, items, glaze, size, fulfilment, discount and totals including shipping math.
   Changes: lists Order.
2. The owner filters by New, Packed, Shipped or Picked up.
   - Order status filter (optional, one of: All, New, Packed, Shipped, Picked up), e.g. "New"
   The website shows only orders with the chosen packing status, still sorted new-first.
   Changes: lists Order.
3. The owner opens an order for detail. The website shows the order detail with buyer contact, items, glaze, size, quantities, fulfilment, discount and totals.
   Changes: reads Order.
4. The owner marks the order Packed then Shipped for courier or Picked up for pickup.
   - Order status (required, one of: New, Packed, Shipped, Picked up), e.g. "Packed"
   The website saves the new packing status and shows the updated order and list.
   Changes: updates Order.

Other paths
- F08.A01 (from 1, empty) No orders have been placed yet: The website says there are no orders yet and invites the owner to keep the shop stocked and check back for new orders. Back to 1.
- F08.A02 (from 2, empty) No orders have the chosen status: The website says no orders have that status and invites the owner to clear the filter. Back to 2.
- F08.A03 (from 3, notFound) The order was deleted in the meantime: The website says the order is gone and shows the orders list again. Back to 1.
- F08.A04 (from 4, invalid) The chosen status is not the allowed next step for that order: The website marks the status, keeps the order unchanged, and shows the allowed next step of Packed then Shipped or Picked up. Back to 4.
- F08.A05 (from 4, failure) Saving the new status fails: The website keeps the order as it was and offers to try saving again. Back to 4.

Outcome: Order statuses updated to Packed, Shipped or Picked up persist after refresh; list remains new-first with status filter.

## F09 Add a product
Shop Owner · manage · Goal: List a new piece type with photos, price, sizes, glazes and stock.
Before: Signed in as shop owner.

1. The owner chooses to add a product. The website shows an empty product form with glaze choices and a photo preview area.
2. The owner fills in the product and saves it. (Product form)
   - Product name (required, up to 120 characters), e.g. "Speckled Chai Mug"
   - Product type (required, one of: mug, bowl, planter, vase), e.g. "mug"
   - Product description (optional, up to 1000 characters), e.g. "Wheel-thrown stoneware mug with speckled glaze."
   - Product price (required, 1 to 100000), e.g. "650"
   - Product photo (required, up to 500 characters), e.g. "https://example.com/mug-sage.jpg"
   - Available sizes (required, one of: Small, Medium, Large), e.g. "Medium"
   - Glazes offered (required, one of the Glaze records), e.g. "Sage Green"
   - Stock quantity for glaze and size combo (required, 0 to 1000), e.g. "12"
   The website validates and previews the photo, saves the product with its per-combo stock and shows it in the product list and the public shop.
   Changes: creates Product, lists Glaze.

Other paths
- F09.A01 (from 2, invalid) A required value is missing or the price or stock quantity is not valid: The website marks what is wrong and keeps what was typed. Back to 2.
- F09.A02 (from 2, failure) Saving fails: The website keeps the typed values and offers to retry. Back to 2.
- F09.A03 (from 2, cancel) The owner cancels without saving: Nothing is saved; the website shows the product list as it was. Flow ends.
- F09.A04 (from 2, empty) There are no glazes to offer yet: The website says there are no glazes yet and offers to add a glaze before saving the product. Back to 2.

Outcome: New Product is created and visible in the public shop; refresh still shows it.

## F10 Edit product and restock
Shop Owner · manage · Goal: Keep price, description, sizes, glazes and per-combo stock honest.
Before: Signed in as shop owner.; At least one product exists.

1. The owner opens the product list and filters by type or stock state.
   - Product type filter (optional, one of: All, mug, bowl, planter, vase), e.g. "mug"
   - In-stock only (optional), e.g. "true"
   The website shows the owner's products with photo, price, type and remaining counts per glaze and size.
   Changes: lists Product.
2. The owner opens a product for editing. The website shows the product's current name, type, description, price, photo, sizes, glazes and per-combo stock.
   Changes: reads Product.
3. The owner edits the product and saves the changes. (Product form)
   - Product name (required, up to 120 characters), e.g. "Speckled Chai Mug"
   - Product type (required, one of: mug, bowl, planter, vase), e.g. "mug"
   - Product description (optional, up to 1000 characters), e.g. "Wheel-thrown stoneware mug with speckled glaze."
   - Product price (required, 1 to 100000), e.g. "650"
   - Product photo (required, up to 500 characters), e.g. "https://example.com/mug-sage.jpg"
   - Available sizes (required, one of: Small, Medium, Large), e.g. "Medium"
   - Glazes offered (required, one of the Glaze records), e.g. "Sage Green"
   - Stock quantity for glaze and size combo (required, 0 to 1000), e.g. "12"
   The website saves the changes and shows the updated product; the public shop reflects the new details and availability.
   Changes: updates Product.

Other paths
- F10.A01 (from 1, empty) There are no products yet: The website says there are no products yet and offers to add one. Flow ends.
- F10.A02 (from 2, notFound) The product was deleted in the meantime: The website says the product is gone and shows the product list. Flow ends.
- F10.A03 (from 3, invalid) A required value is missing or the price or stock quantity is not valid: The website marks what is wrong and keeps what was typed. Back to 3.
- F10.A04 (from 3, failure) Saving fails: The website keeps the typed values and offers to retry. Back to 3.
- F10.A05 (from 3, cancel) The owner cancels without saving: Nothing is changed; the website shows the product as it was. Flow ends.

Outcome: Product changes are saved and the public shop reflects them after refresh.

## F11 Delete a product
Shop Owner · manage · Goal: Remove a piece type no longer sold.
Before: Signed in as shop owner.; At least one product exists.

1. The owner opens the product list. The website shows the owner's products with photo, price and remaining counts.
   Changes: lists Product.
2. The owner opens a product to delete. The website shows the product's details and remaining stock.
   Changes: reads Product.
3. The owner chooses Delete on the product. Confirm deletion (subflow STD01):
   1. (system) The website asks to confirm the deletion and says what else will be removed with it.

   Other paths
   - STD01.A01 (from 1, confirm) The user confirms: The website deletes the record and what belongs to it. Back to the calling flow.
   - STD01.A02 (from 1, cancel) The user cancels: Nothing is deleted; the record stays as it was. Back to the calling flow.
   Changes: deletes Product.

Other paths
- F11.A01 (from 1, empty) There are no products to delete: The website says there are no products and offers to add one. Flow ends.
- F11.A02 (from 2, notFound) The product was deleted in the meantime: The website says the product is gone and shows the product list. Flow ends.
- F11.A03 (from 3, confirm) The owner confirms the deletion: The website removes the product from the public shop; past orders keep their item snapshot. Flow ends.
- F11.A04 (from 3, cancel) The owner cancels: Nothing is deleted; the website shows the product again, unchanged. Flow ends.

Outcome: Product is removed from the shop and stays gone after refresh; past orders keep their snapshot.

## F12 Manage glazes and spot low stock
Shop Owner · manage · Goal: Maintain glaze options and know when a glaze is nearly gone.
Before: Signed in as shop owner.

1. The owner opens the glaze list. The website shows all glazes with remaining piece counts across products, flagging glazes with 5 or fewer pieces left as nearly gone.
   Changes: lists Glaze, lists Product.
2. The owner enters a new glaze name and saves it.
   - Glaze name (required, up to 80 characters), e.g. "Sage Green"
   The website saves the glaze and shows it in the glaze list.
   Changes: creates Glaze.
3. The owner chooses a glaze and renames it.
   - Glaze name (required, up to 80 characters), e.g. "Sage Green"
   The website saves the new glaze name and shows the updated list with refreshed low-stock flags.
   Changes: updates Glaze.
4. The owner chooses Delete on a glaze. Confirm deletion (subflow STD01):
   1. (system) The website asks to confirm the deletion and says what else will be removed with it.

   Other paths
   - STD01.A01 (from 1, confirm) The user confirms: The website deletes the record and what belongs to it. Back to the calling flow.
   - STD01.A02 (from 1, cancel) The user cancels: Nothing is deleted; the record stays as it was. Back to the calling flow.
   Changes: deletes Glaze.

Other paths
- F12.A01 (from 1, empty) There are no glazes yet: The website says there are no glazes yet and offers to add the first one. Back to 2.
- F12.A02 (from 2, invalid) The glaze name is empty: The website marks the field and keeps what was typed. Back to 2.
- F12.A03 (from 2, failure) Saving fails: The website keeps the typed value and offers to retry. Back to 2.
- F12.A04 (from 3, invalid) The new glaze name is empty: The website marks the field and keeps what was typed. Back to 3.
- F12.A05 (from 3, failure) Saving the rename fails: The website keeps the typed value and offers to retry. Back to 3.
- F12.A06 (from 3, notFound) The glaze was deleted in the meantime: The website says the glaze is gone and shows the glaze list. Flow ends.
- F12.A07 (from 4, confirm) The owner confirms the deletion: The website removes the glaze from the list; past orders keep their glaze snapshot. Flow ends.
- F12.A08 (from 4, cancel) The owner cancels: Nothing is deleted; the website shows the glaze list unchanged. Flow ends.

Outcome: Glaze list with low-stock flags persists after refresh and guides the next batch.

## F13 Manage discount codes
Shop Owner · manage · Goal: Offer weekend percent-off codes for Instagram.
Before: Signed in as shop owner.

1. The owner opens the discount code list. The website shows all discount codes with code text, percent off, start and end dates and usage limit.
   Changes: lists DiscountCode.
2. The owner fills in a new weekend code and saves it. (Discount code form)
   - Code text (required, 3 to 30 characters), e.g. "CLAYWEEKEND"
   - Percent off (required, 1 to 90), e.g. "10"
   - Start date (required), e.g. "2026-11-01"
   - End date (required), e.g. "2026-11-03"
   - Usage limit (optional, 1 to 10000), e.g. "50"
   The website saves the code and shows it in the code list as usable by buyers.
   Changes: creates DiscountCode.
3. The owner opens a code, edits its details and saves. (Discount code form)
   - Code text (required, 3 to 30 characters), e.g. "CLAYWEEKEND"
   - Percent off (required, 1 to 90), e.g. "10"
   - Start date (required), e.g. "2026-11-01"
   - End date (required), e.g. "2026-11-03"
   - Usage limit (optional, 1 to 10000), e.g. "50"
   The website saves the changes and shows the updated code list.
   Changes: updates DiscountCode.
4. The owner chooses Delete on a discount code. Confirm deletion (subflow STD01):
   1. (system) The website asks to confirm the deletion and says what else will be removed with it.

   Other paths
   - STD01.A01 (from 1, confirm) The user confirms: The website deletes the record and what belongs to it. Back to the calling flow.
   - STD01.A02 (from 1, cancel) The user cancels: Nothing is deleted; the record stays as it was. Back to the calling flow.
   Changes: deletes DiscountCode.

Other paths
- F13.A01 (from 1, empty) There are no discount codes yet: The website says there are no discount codes yet and offers to create one. Back to 2.
- F13.A02 (from 2, invalid) The code text, percent, dates or limit are missing or not valid, or the end date is before the start date: The website marks what is wrong and keeps what was typed. Back to 2.
- F13.A03 (from 2, failure) Saving fails: The website keeps the typed values and offers to retry. Back to 2.
- F13.A04 (from 3, invalid) The edited code text, percent, dates or limit are missing or not valid, or the end date is before the start date: The website marks what is wrong and keeps what was typed. Back to 3.
- F13.A05 (from 3, failure) Saving the edit fails: The website keeps the typed values and offers to retry. Back to 3.
- F13.A06 (from 3, notFound) The code was deleted in the meantime: The website says the discount code is gone and shows the code list. Flow ends.
- F13.A07 (from 4, confirm) The owner confirms the deletion: The website removes the code; it can no longer be used by buyers. Flow ends.
- F13.A08 (from 4, cancel) The owner cancels: Nothing is deleted; the website shows the code list unchanged. Flow ends.

Outcome: Discount codes with dates and limits persist after refresh and become usable by buyers.

## F14 Correct or remove an order
Shop Owner · manage · Goal: Fix buyer mistakes by editing or deleting an order.
Before: Signed in as shop owner.; At least one order exists.

1. The owner opens the orders list and filters by packing status.
   - Order status filter (optional, one of: All, New, Packed, Shipped, Picked up), e.g. "New"
   The website shows orders newest first with placed date, buyer, items, fulfilment and totals.
   Changes: lists Order.
2. The owner opens an order for detail. The website shows the order's buyer name and phone, fulfilment method, address for courier, items with glaze, size and quantities, discount, shipping and total.
   Changes: reads Order.
3. The owner corrects contact, fulfilment, quantities or status and saves.
   - Buyer name (required, up to 100 characters), e.g. "Ananya Sharma"
   - Buyer phone (required, up to 15 characters), e.g. "9829012345"
   - Fulfilment method (required, one of: Studio pickup, Courier), e.g. "Courier"
   - Delivery address (optional, up to 500 characters), e.g. "B-12 Malviya Nagar Jaipur 302017"
   - Quantity (required, 1 to 99), e.g. "2"
   - Order status (required, one of: New, Packed, Shipped, Picked up), e.g. "Packed"
   The website enforces that quantities cannot exceed what is left, updates totals with discount and shipping math, adjusts stock counts and shows the corrected order.
   Changes: updates Order, updates Product.
4. The owner chooses Delete on the mistaken order. Confirm deletion (subflow STD01):
   1. (system) The website asks to confirm the deletion and says what else will be removed with it.

   Other paths
   - STD01.A01 (from 1, confirm) The user confirms: The website deletes the record and what belongs to it. Back to the calling flow.
   - STD01.A02 (from 1, cancel) The user cancels: Nothing is deleted; the record stays as it was. Back to the calling flow.
   Changes: deletes Order, updates Product.

Other paths
- F14.A01 (from 1, empty) There are no orders yet: The website says there are no orders yet. Flow ends.
- F14.A02 (from 2, notFound) The order was deleted in the meantime: The website says the order is gone and shows the orders list. Flow ends.
- F14.A03 (from 3, invalid) A required contact value is missing or not valid: The website marks what is wrong and keeps what was typed. Back to 3.
- F14.A04 (from 3, conflict) The raised quantity is more than what is left for that glaze and size: The website says only that many pieces are left, keeps the typed values and offers to use the available quantity. Back to 3.
- F14.A05 (from 3, failure) Saving the correction fails: The website keeps the typed values and offers to retry. Back to 3.
- F14.A06 (from 4, confirm) The owner confirms the deletion: The website removes the order, returns its stock to the glaze and size counts and shows the orders list. Flow ends.
- F14.A07 (from 4, cancel) The owner cancels: Nothing is deleted; the website shows the order again, unchanged. Flow ends.

Outcome: Order corrections or removal persist after refresh and stock counts reflect the change.

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
