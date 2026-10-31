# Jaipur Studio Ceramics Shop: user flows

## F01 Discover the shop on the landing page
Buyer · browse · Goal: Understand this is the studio's own small-batch shop and start shopping without messaging.
Before: Not signed in.

1. The buyer opens the shop landing page. The website shows the shop name, that this is the Jaipur studio's own shop for small-batch mugs, bowls, planters and vases, pieces for sale with photos, prices and honest availability, how to order without messaging, a way to browse pieces, and a way for the shop owner to sign in.
   Changes: reads ShopSetting, lists Piece.
2. The buyer chooses to browse pieces. The website shows the pieces for sale with photos, prices and availability.
   Changes: lists Piece.

Other paths
- F01.A01 (from 1, empty) No pieces are for sale yet: The website says the studio is preparing its next small batch and invites the buyer to check back later; the owner sign-in way remains available. Flow ends.
- F01.A02 (from 2, empty) No pieces are for sale yet: The website says there are no pieces for sale yet and invites the buyer to check back later for the next small batch. Flow ends.

Outcome: Nothing is stored; the buyer is oriented and can browse pieces, and a refresh shows the same shop front.

## F02 Browse and view pieces
Buyer · browse · Goal: Find an available piece and judge it without messaging the maker.
Before: Not signed in.

1. The buyer views the pieces for sale. The website shows pieces with photos, type, price and availability, with ways to filter by type and availability and to sort by price.
   Changes: lists Piece.
2. The buyer filters by type Mug, Bowl, Planter or Vase or by availability and sorts by price. The website shows only the matching pieces in the chosen price order.
   Changes: lists Piece.
3. The buyer opens a piece. The website shows the piece type, price, description, photos, glaze and size options with how many are left per glaze and size, and a clear sold-out state when none are left.
   Changes: reads Piece, lists Variant.

Other paths
- F02.A01 (from 2, empty) No pieces match the chosen filters: The website says nothing matches and invites the buyer to clear the filters to see all pieces. Back to 2.
- F02.A02 (from 1, empty) No pieces are for sale yet: The website says the studio is preparing its next batch and invites the buyer to check back later. Flow ends.
- F02.A03 (from 3, notFound) The piece was removed in the meantime: The website says the piece is no longer available and shows the pieces for sale again. Flow ends.
- F02.A04 (from 3, empty) The piece has no glaze and size options to show: The website says this piece has no glaze and size options yet and shows the pieces for sale again. Flow ends.

Outcome: Nothing is stored; the buyer has seen honest per-variant stock and a refresh shows the same catalogue.

## F03 Place an order as guest
Buyer · core · Goal: Order ceramics as a guest in five steps or fewer and see confirmation.
Before: Not signed in.; At least one variant has stock.

1. The buyer opens a piece that has stock. The website shows the piece photos, type, price, description, glaze and size options with how many are left per option, and the price including any variant adjustment.
   Changes: reads Piece, lists Variant.
2. The buyer fills in glaze, size, quantity, name, phone, fulfilment choice of Studio Pickup or Courier, delivery address for courier only, and one optional discount code, and submits for review. (Checkout form)
   - Chosen glaze (required, one of the Variant records), e.g. "Speckled White"
   - Chosen size (required, one of the Variant records), e.g. "Large"
   - Quantity (required, at least 1), e.g. "2"
   - Buyer name (required, 2 to 80 characters), e.g. "Anaya Sharma"
   - Buyer phone (required, 10 to 15 characters), e.g. "9829012345"
   - Fulfilment choice (required, one of: Studio Pickup, Courier), e.g. "Courier"
   - Delivery address (optional, 10 to 500 characters), e.g. "B-4 Rose Apartments, C-Scheme, Jaipur 302001"
   - Discount code entered (optional, 2 to 30 characters), e.g. "PINKWEEKEND"
   The website checks stock and the discount code and shows the piece total, discount, shipping charge of ₹99 for courier with free shipping above ₹1,500 after discount and always free for studio pickup, and the final total, asking the buyer to confirm.
   Changes: reads Variant, reads DiscountCode.
3. The buyer confirms the order. The website creates the order with payment status Awaiting UPI Payment, reduces the variant stock at once, and shows an order confirmation with items, glaze and size, totals, fulfilment details and pickup address and instructions for pickup orders, stating the maker will collect payment by UPI later.
   Changes: creates Order, creates OrderItem, updates Variant.

Other paths
- F03.A01 (from 1, notFound) The piece was removed or sold out in the meantime: The website says the piece is no longer available and shows the pieces for sale again. Flow ends.
- F03.A02 (from 2, invalid) Required details are missing or wrong, quantity exceeds remaining stock, or a courier order has no delivery address: The website marks what is wrong, keeps what was typed, and asks the buyer to correct it. Back to 2.
- F03.A03 (from 2, failure) Showing the order review fails: The website keeps the entered values and offers to try showing the review again. Back to 2.
- F03.A04 (from 2, other) The entered discount code is invalid, expired or deactivated: The website rejects the code with a message explaining why and lets the buyer continue without it with updated totals. Back to 2.
- F03.A05 (from 3, failure) Saving the order fails: The website keeps the confirmed details and offers to place the order again. Back to 3.
- F03.A06 (from 3, conflict) The stock ran out after the review was shown: The website says the chosen glaze and size just sold out, no order was created, and shows the piece with updated honest stock. Flow ends.
- F03.A07 (from 1, empty) The piece has no glaze and size variants with stock left: The website says the piece is sold out with no orderable glaze and size left and shows the pieces for sale again. Flow ends.

Outcome: An Order with its OrderItems is created with payment Awaiting UPI Payment and variant stock is reduced; the confirmation remains visible after a refresh in the same session.

## F04 Shop owner sign up
Shop Owner · auth · Goal: Create the shop owner account.
Before: Not signed in.; No shop owner account exists yet.

1. The maker chooses to sign up as shop owner from the landing page. The website shows an empty owner account form.
2. The maker fills in the owner account and submits it. (Owner account form)
   - Owner email (required, up to 254 characters), e.g. "owner@jaipurceramics.in"
   - Owner password (required, 8 to 128 characters), e.g. "monsoon-kiln-42"
   The website creates the single shop owner account, signs the owner in, and shows the owner's orders and catalogue overview.

Other paths
- F04.A01 (from 2, invalid) Email or password is missing or badly formed: The website marks what is wrong and keeps what was typed. Back to 2.
- F04.A02 (from 2, failure) Creating the account fails: The website keeps the entered values and offers to try again. Back to 2.
- F04.A03 (from 2, conflict) A shop owner account already exists: The website says there is already a shop owner account and offers a way to sign in instead. Flow ends.
- F04.A04 (from 1, cancel) The maker cancels signing up: Nothing is created; the website shows the public shop front again. Flow ends.

Outcome: The shop owner account exists and the owner is signed in; a refresh still shows the owner as signed in.

## F05 Shop owner sign in
Shop Owner · auth · Goal: Sign in to manage the shop.
Before: Not signed in.; Shop owner account exists.

1. The shop owner chooses to sign in from the landing page. The website shows an empty owner account form.
2. The shop owner fills in email and password and submits. (Owner account form)
   - Owner email (required, up to 254 characters), e.g. "owner@jaipurceramics.in"
   - Owner password (required, 8 to 128 characters), e.g. "monsoon-kiln-42"
   The website signs the owner in and shows the owner's orders and catalogue overview with counts of new orders and orders awaiting UPI payment.
   Changes: lists Order, lists Piece.

Other paths
- F05.A01 (from 2, invalid) Email or password is missing or badly formed: The website marks what is wrong and keeps what was typed. Back to 2.
- F05.A02 (from 2, failure) Signing in fails: The website keeps the entered values and offers to try again. Back to 2.
- F05.A03 (from 2, denied) The email is unknown or the password is wrong: The website says the sign-in details were not recognised and lets the owner try again. Back to 2.
- F05.A04 (from 2, empty) There are no orders and no pieces yet: The website says there are no orders and no pieces yet and offers a way to add the first piece. Flow ends.

Outcome: The owner is signed in and sees their own shop data; a refresh still shows them signed in.

## F06 Shop owner sign out
Shop Owner · auth · Goal: Leave the shop account safely.
Before: Signed in as shop owner.

1. The shop owner chooses to sign out. The website signs the owner out and shows the public shop front with no owner data.

Outcome: The owner is signed out; a refresh still shows the public shop front with no owner data.

## F07 Create a piece with variants
Shop Owner · manage · Goal: Add a new design with its glazes, sizes and stock to the shop.
Before: Signed in as shop owner.

1. The owner chooses to add a piece. The website shows an empty piece form with a photo upload that validates and previews each file and keeps it for the session.
2. The owner fills in the piece name, type, base price, description and photos and saves the piece. (Piece form)
   - Piece name (required, 2 to 80 characters), e.g. "Speckled Chai Mug"
   - Piece type (required, one of: Mug, Bowl, Planter, Vase), e.g. "Mug"
   - Piece base price (required, at least 1), e.g. "650"
   - Piece description (required, up to 1000 characters), e.g. "Wheel-thrown stoneware mug with speckled glaze, 300ml"
   - Piece photo (required, up to 500 characters), e.g. "https://example.in/photos/speckled-mug-1.jpg"
   The website validates the photo with a preview kept for the session, saves the piece, and shows a way to add its glaze and size variants.
   Changes: creates Piece.
3. The owner adds glaze and size variants with a stock count for each and any price adjustment and saves them. (Variant form)
   - Glaze name (required, 1 to 60 characters), e.g. "Speckled White"
   - Size name (required, 1 to 60 characters), e.g. "Large"
   - Variant stock count (required, 0 to 1000), e.g. "12"
   - Variant price adjustment (optional), e.g. "0"
   The website saves the variants and shows the piece with honest per-variant stock in the public shop where at least one variant has stock.
   Changes: creates Variant.

Other paths
- F07.A01 (from 2, invalid) The piece name, type, price, description, photo or variant details are missing or wrong: The website marks what is wrong and keeps what was typed, including the photo preview. Back to 2.
- F07.A02 (from 2, failure) Saving the piece fails: The website keeps the entered values and photo preview and offers to save again. Back to 2.
- F07.A03 (from 3, invalid) A glaze name, size name or stock count is missing or wrong: The website marks what is wrong and keeps what was typed. Back to 3.
- F07.A04 (from 3, failure) Saving the variants fails: The website keeps the entered variant values and offers to save again. Back to 3.
- F07.A05 (from 1, cancel) The owner cancels creating the piece: Nothing is saved; the website shows the catalogue as it was. Flow ends.

Outcome: A new Piece with its Variants is saved and appears in the public shop where stock allows; a refresh still shows it.

## F08 Edit a piece and its variants
Shop Owner · manage · Goal: Keep a piece and its stock honest as batches sell and are remade.
Before: Signed in as shop owner.; At least one piece exists.

1. The owner views the catalogue. The website shows the owner's pieces with type, price and stock summary.
   Changes: lists Piece.
2. The owner opens a piece. The website shows the piece name, type, price, description, photos and its glaze and size variants with stock counts and price adjustments.
   Changes: reads Piece, lists Variant.
3. The owner changes the piece details and its glaze and size variants including stock counts and saves. (Piece form)
   - Piece name (required, 2 to 80 characters), e.g. "Speckled Chai Mug"
   - Piece type (required, one of: Mug, Bowl, Planter, Vase), e.g. "Mug"
   - Piece base price (required, at least 1), e.g. "650"
   - Piece description (required, up to 1000 characters), e.g. "Wheel-thrown stoneware mug with speckled glaze, 300ml"
   - Piece photo (required, up to 500 characters), e.g. "https://example.in/photos/speckled-mug-1.jpg"
   - Glaze name (required, 1 to 60 characters), e.g. "Speckled White"
   - Size name (required, 1 to 60 characters), e.g. "Large"
   - Variant stock count (required, 0 to 1000), e.g. "12"
   - Variant price adjustment (optional), e.g. "0"
   The website saves the changes and shows the updated piece, with the public shop immediately reflecting the new honest availability.
   Changes: updates Piece, updates Variant.

Other paths
- F08.A01 (from 1, empty) There are no pieces yet: The website says no pieces exist yet and offers a way to add the first piece. Flow ends.
- F08.A02 (from 2, notFound) The piece was deleted in the meantime: The website says the piece is gone and shows the catalogue again. Flow ends.
- F08.A03 (from 3, invalid) The changed name, type, price, description, photo or variant stock is missing or wrong: The website marks what is wrong and keeps what was typed. Back to 3.
- F08.A04 (from 3, failure) Saving the changes fails: The website keeps the edited values and offers to save again. Back to 3.
- F08.A05 (from 3, cancel) The owner cancels editing: Nothing is changed; the website shows the piece as it was. Flow ends.
- F08.A06 (from 2, empty) The piece has no glaze and size variants yet: The website says the piece has no glaze and size variants yet and invites the owner to add them while editing. Back to 3.

Outcome: The Piece and its Variants are updated and the public shop shows the new details; a refresh still shows the changes.

## F09 Delete a piece
Shop Owner · manage · Goal: Remove a design that will no longer be sold.
Before: Signed in as shop owner.; At least one piece exists.

1. The owner opens the catalogue list. The website shows the owner's pieces with type and availability.
   Changes: lists Piece.
2. The owner opens a piece. The website shows the piece name, type, price, description, photos and its glaze and size variants with stock.
   Changes: reads Piece.
3. The owner chooses Delete on the piece. Confirm deletion (subflow STD01):
   1. (system) The website asks to confirm the deletion and says what else will be removed with it.

   Other paths
   - STD01.A01 (from 1, confirm) The user confirms: The website deletes the record and what belongs to it. Back to the calling flow.
   - STD01.A02 (from 1, cancel) The user cancels: Nothing is deleted; the record stays as it was. Back to the calling flow.
   Changes: deletes Piece, deletes Variant.

Other paths
- F09.A01 (from 1, empty) There are no pieces yet: The website shows the catalogue is empty and invites the owner to create a piece. Flow ends.
- F09.A02 (from 2, notFound) The piece was deleted in the meantime: The website says the piece is gone and shows the catalogue list. Flow ends.
- F09.A03 (from 3, confirm) The owner confirms the deletion: The website shows the catalogue list without the piece; past orders containing it remain unchanged. Flow ends.
- F09.A04 (from 3, cancel) The owner cancels the deletion: Nothing is deleted; the website shows the piece again, unchanged. Back to 2.

Outcome: The Piece and its Variants are gone from the public shop but past Orders are unchanged; a refresh still shows it gone.

## F10 Create a discount code
Shop Owner · manage · Goal: Offer a time-limited promotion buyers enter at checkout.
Before: Signed in as shop owner.

1. The owner chooses to create a discount code. The website shows an empty discount code form.
2. The owner fills in the code word, kind, value and dates and saves it. (Discount code form)
   - Discount code word (required, 2 to 30 characters), e.g. "PINKWEEKEND"
   - Discount kind (required, one of: Percentage off, Fixed rupees off), e.g. "Percentage off"
   - Discount value (required, 1 to 100), e.g. "10"
   - Discount start date (required), e.g. "2026-12-05"
   - Discount end date (required), e.g. "2026-12-07"
   The website saves the code as active and shows it in the discount code list.
   Changes: creates DiscountCode.

Other paths
- F10.A01 (from 2, invalid) The code word is empty, the value is out of range, or the end date is before the start date: The website marks what is wrong and keeps what was typed. Back to 2.
- F10.A02 (from 2, failure) Saving fails: The website keeps the values and offers to retry. Back to 2.
- F10.A03 (from 2, cancel) The owner cancels: Nothing is saved; the website shows the discount code list as it was. Flow ends.

Outcome: A new active DiscountCode is saved and works at checkout within its dates; a refresh still shows it.

## F11 Update or deactivate a discount code
Shop Owner · manage · Goal: Control which codes work and stop a promotion early.
Before: Signed in as shop owner.; At least one discount code exists.

1. The owner opens the discount code list. The website shows discount codes with code word, value, dates and active state.
   Changes: lists DiscountCode.
2. The owner opens a discount code. The website shows the code word, kind, value, dates and whether it is active.
   Changes: reads DiscountCode.
3. The owner changes the value, dates or active state and saves. (Discount code edit form)
   - Discount code word (required, 2 to 30 characters), e.g. "PINKWEEKEND"
   - Discount kind (required, one of: Percentage off, Fixed rupees off), e.g. "Percentage off"
   - Discount value (required, 1 to 100), e.g. "10"
   - Discount start date (required), e.g. "2026-12-05"
   - Discount end date (required), e.g. "2026-12-07"
   - Discount active (required), e.g. "yes"
   The website saves the changes and shows the updated code; a deactivated code is rejected at checkout.
   Changes: updates DiscountCode.

Other paths
- F11.A01 (from 1, empty) There are no discount codes yet: The website shows no codes yet and invites the owner to create one. Flow ends.
- F11.A02 (from 2, notFound) The code was deleted in the meantime: The website says the code is gone and shows the code list. Flow ends.
- F11.A03 (from 3, invalid) A required value is missing or out of range, or the end date is before the start date: The website marks what is wrong and keeps what was typed. Back to 3.
- F11.A04 (from 3, failure) Saving fails: The website keeps the values and offers to retry. Back to 3.
- F11.A05 (from 3, cancel) The owner cancels editing: Nothing is changed; the website shows the code again as it was. Back to 2.

Outcome: The DiscountCode is updated or marked deactivated and checkout immediately honours the change; a refresh still shows the change.

## F12 View and filter orders
Shop Owner · manage · Goal: See new orders and track who has paid without losing track.
Before: Signed in as shop owner.

1. The owner opens the order list. The website shows orders newest first with buyer name and phone, pickup or courier choice, totals, order status and payment status.
   Changes: lists Order.
2. The owner filters by order status and payment status. The website shows only orders with the chosen order status and payment status.
   Changes: lists Order.
3. The owner opens an order. The website shows buyer name and phone, pickup or courier with delivery address where relevant, items with glaze and size, piece total, discount, shipping and final total, placed date and time, order status and payment status.
   Changes: reads Order, lists OrderItem.

Other paths
- F12.A01 (from 1, empty) There are no orders yet: The website shows no orders yet and explains new guest orders will appear here. Flow ends.
- F12.A02 (from 2, empty) No orders match the chosen filters: The website shows no matching orders and offers to clear the filters. Back to 2.
- F12.A03 (from 3, notFound) The order was removed in the meantime: The website says the order is gone and shows the order list. Flow ends.
- F12.A04 (from 3, empty) The order has no items yet: The website shows the order details with no items yet and offers to return to the order list. Flow ends.

Outcome: Nothing is changed; the owner has seen their own orders with totals and statuses and a refresh shows the same list.

## F13 Advance order fulfilment
Shop Owner · core · Goal: Work through packing and handover of orders.
Before: Signed in as shop owner.; At least one order with status New or Packed exists.

1. The owner opens the order list. The website shows orders newest first with order status and pickup or courier choice.
   Changes: lists Order.
2. The owner opens a New or Packed order. The website shows the order with its current status and only its allowed next status: Packed for a New order, Shipped for a Packed courier order, Collected for a Packed pickup order.
   Changes: reads Order.
3. The owner moves the order to its allowed next status. The website saves the new status and shows the order as Packed, Shipped or Collected.
   Changes: updates Order.

Other paths
- F13.A01 (from 1, empty) There are no New or Packed orders: The website shows no orders waiting for packing or handover. Flow ends.
- F13.A02 (from 2, notFound) The order is gone: The website says the order is gone and shows the order list. Flow ends.
- F13.A03 (from 3, denied) The requested move is not allowed, such as New directly to Shipped, a pickup order to Shipped, or a courier order to Collected: The website says only New to Packed and then Packed to Shipped for courier or Packed to Collected for pickup are allowed and shows the order unchanged. Back to 2.
- F13.A04 (from 3, failure) Saving the new status fails: The website keeps the order as it was and offers to retry. Back to 3.

Outcome: The Order status is advanced to Packed, Shipped or Collected; a refresh still shows the new status.

## F14 Mark order as Paid
Shop Owner · manage · Goal: Record that UPI payment has been collected.
Before: Signed in as shop owner.; At least one order awaiting UPI payment exists.

1. The owner opens orders awaiting UPI payment. The website shows orders with payment status Awaiting UPI Payment newest first.
   Changes: lists Order.
2. The owner opens an order awaiting payment. The website shows the order totals and payment status Awaiting UPI Payment with the option to mark it Paid.
   Changes: reads Order.
3. The owner marks the order as Paid after collecting UPI outside the app. The website shows the order payment status as Paid.
   Changes: updates Order.

Other paths
- F14.A01 (from 1, empty) There are no orders awaiting UPI payment: The website shows no orders awaiting payment. Flow ends.
- F14.A02 (from 2, notFound) The order is gone: The website says the order is gone and shows the order list. Flow ends.
- F14.A03 (from 3, denied) The order is already marked Paid: The website says the order is already Paid and shows it unchanged. Back to 2.
- F14.A04 (from 3, failure) Saving fails: The website keeps the order as awaiting payment and offers to retry. Back to 3.

Outcome: The Order payment status moves to Paid; a refresh still shows it as Paid.

## F15 Cancel an order
Shop Owner · manage · Goal: Cancel an order that cannot be fulfilled and restore honest stock.
Before: Signed in as shop owner.; At least one order with status New or Packed exists.

1. The owner opens the order list. The website shows orders newest first with order status.
   Changes: lists Order.
2. The owner opens a New or Packed order. The website shows the order with its items, totals and statuses and the option to cancel it.
   Changes: reads Order.
3. The owner chooses to cancel the order. The website asks to confirm the cancellation and says the ordered quantities will be returned to stock.
4. The owner confirms the cancellation. The website marks the order as Cancelled, returns its quantities to variant stock, and shows the order as Cancelled in the list.
   Changes: updates Order, updates Variant.

Other paths
- F15.A01 (from 1, empty) There are no New or Packed orders: The website shows no cancellable orders. Flow ends.
- F15.A02 (from 2, notFound) The order is gone: The website says the order is gone and shows the order list. Flow ends.
- F15.A03 (from 3, denied) The order is no longer New or Packed, such as already Shipped, Collected or Cancelled: The website says only New or Packed orders can be cancelled and shows the order unchanged. Back to 2.
- F15.A04 (from 4, cancel) The owner cancels the confirmation: Nothing is changed; the website shows the order again with its status as it was. Back to 2.
- F15.A05 (from 4, failure) Saving the cancellation fails: The website keeps the order as it was and offers to retry. Back to 4.

Outcome: The Order is marked Cancelled and its Variant stock is returned; a refresh still shows it as Cancelled.

## F16 Review low stock and order counts
Shop Owner · manage · Goal: Know which glazes are nearly gone and what needs making next.
Before: Signed in as shop owner.

1. The owner opens the stock overview. The website shows counts of new orders and orders awaiting UPI payment alongside variants that are nearly gone with 2 or fewer left and variants that are sold out with 0 left.
   Changes: lists Order, lists Variant.

Other paths
- F16.A01 (from 1, empty) All variants have more than 2 left and there are no new or unpaid orders: The website shows zero new orders, zero awaiting payment and no nearly-gone or sold-out variants, and offers to view the catalogue and orders. Flow ends.

Outcome: Nothing is changed; the owner has seen low-stock, sold-out and count summaries and a refresh shows the same figures.

## F17 Update shop settings
Shop Owner · settings · Goal: Keep shop identity and pickup details correct for buyers.
Before: Signed in as shop owner.

1. The shop owner chooses to view shop settings. The website shows the current shop name, studio pickup address and pickup instructions ready to edit.
   Changes: reads ShopSetting.
2. The shop owner updates the shop details and saves them. (Shop settings form)
   - Shop name (required, 2 to 80 characters), e.g. "Jaipur Studio Ceramics"
   - Studio pickup address (required, 10 to 500 characters), e.g. "14 Potter Lane, Amer Road, Jaipur 302002"
   - Pickup instructions (required, up to 500 characters), e.g. "Pickup Tue to Sat 11am to 6pm, call on arrival"
   The website saves the changes and shows the updated shop name, pickup address and pickup instructions as buyers will see them.
   Changes: updates ShopSetting.

Other paths
- F17.A01 (from 2, invalid) Required text is missing or too short: The website marks what is wrong and keeps what was typed. Back to 2.
- F17.A02 (from 2, failure) Saving fails: The website keeps the values and offers to retry. Back to 2.

Outcome: The ShopSetting is updated and shown to buyers; a refresh still shows the new details.

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
- FM07 Discount code edit form: FD23, FD24, FD25, FD26, FD27, FD28

## STD01 Confirm deletion (standard subflow)

1. (system) The website asks to confirm the deletion and says what else will be removed with it.

Other paths
- STD01.A01 (from 1, confirm) The user confirms: The website deletes the record and what belongs to it. Back to the calling flow.
- STD01.A02 (from 1, cancel) The user cancels: Nothing is deleted; the record stays as it was. Back to the calling flow.

## New assumptions
- A08 (data, affects Piece creation, public shop visibility): A piece appears in the public shop only when it has a name, type, price, description, at least one photo and at least one glaze and size variant. A variant requires a glaze name, size name and stock count; its price adjustment defaults to 0 so the variant price is the piece base price plus adjustment.
- A09 (behavior, affects past orders, deletion): Deleting a piece removes it and its variants from the public shop but never deletes or changes past orders. Past orders keep the piece name, glaze, size, quantity and prices as they were at ordering time.
- A10 (behavior, affects dashboard counts, low stock): Owner counts are derived live: new orders are orders with status New, awaiting payment are orders with payment status Awaiting UPI Payment, nearly gone variants have stock 1 or 2 left, sold out variants have 0 left.
