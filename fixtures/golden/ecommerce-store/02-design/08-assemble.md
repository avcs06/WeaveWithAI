# Jaipur Studio Ceramics Shop: design

Audience: A solo Jaipur ceramics maker selling small batches of ten or twenty pieces, and buyers across India who want honest stock and guest checkout without Instagram messages. Feels earthy, warm, honest, calm; copy is Plain, warm and direct: short sentences, honest stock language, no hype, and clear next steps for pickup, courier and UPI payment..

- Density comfortable, radius 8px surfaces and 6px controls, focus ring halo, imagery icons.
- Fonts: Lato for text, Fraunces for headings, IBM Plex Mono for code.
- Logo: the name as a wordmark in Fraunces 600, as written, letter spacing -0.02em; #894100 in light.
- Style earthy and minimal, light only; brand hue 53, balanced; page background linear-gradient(180deg, oklch(0.985 0.009 53) 0%, oklch(0.96 0.015 53) 100%); frame hue 53, muted.
- Wireframes of every screen at desktop width: `02-design/08-wireframes.html`.

## Palette

### page, light

| Role | Hex | Contrast |
| ---- | --- | -------- |
| pageBg | `#FFF9F5` |  |
| pageFg | `#28190F` | 16.28:1 on pageBg, 16.28:1 on frameBg |
| pageFgMuted | `#734F38` | 6.93:1 on pageBg, 6.93:1 on frameBg |
| frameBg | `#FFF9F5` |  |
| divider | `#E0C8BA` | 1.53:1 on pageBg, 1.53:1 on frameBg |
| backdrop | `#28190F` |  |
| skeleton | `#EAD6CB` | 1.34:1 on pageBg, 1.34:1 on frameBg |
| pageBackground | `linear-gradient(180deg, oklch(0.985 0.009 53) 0%, oklch(0.96 0.015 53) 100%)` |  |

### theme, light

| Role | Hex | Contrast |
| ---- | --- | -------- |
| bg | `#FFF9F5` |  |
| fg | `#683101` | 9.92:1 on pageBg, 9.92:1 on frameBg, 9.92:1 on bg, 9.17:1 on hoverBg |
| fgMuted | `#894100` | 7.14:1 on bg |
| border | `#B67449` | 3.6:1 on pageBg, 3.6:1 on frameBg, 3.6:1 on bg |
| hoverBg | `#FFEEE4` |  |
| accentBg | `#9D5218` |  |
| accentFg | `#FFF9F5` | 5.51:1 on accentBg, 7.14:1 on accentHoverBg |
| accentBorder | `#894100` |  |
| accentHoverBg | `#894100` |  |
| focus | `#B67449` | 3.6:1 on pageBg, 3.6:1 on frameBg, 3.6:1 on bg |
| accentFocus | `#683101` |  |
| shadow | `#311300` |  |

### base, light

| Role | Hex | Contrast |
| ---- | --- | -------- |
| bg | `#FFF9F5` |  |
| fg | `#28190F` | 16.28:1 on pageBg, 16.28:1 on frameBg, 16.28:1 on bg, 15.04:1 on hoverBg |
| fgMuted | `#734F38` | 6.93:1 on bg |
| border | `#9F7E6A` | 3.55:1 on pageBg, 3.55:1 on frameBg, 3.55:1 on bg |
| hoverBg | `#FAEFE9` |  |
| accentBg | `#573B2A` |  |
| accentFg | `#FFF9F5` | 9.75:1 on accentBg, 16.28:1 on accentHoverBg |
| accentBorder | `#573B2A` |  |
| accentHoverBg | `#28190F` |  |
| focus | `#9F7E6A` | 3.55:1 on pageBg, 3.55:1 on frameBg, 3.55:1 on bg |
| accentFocus | `#855F48` |  |
| shadow | `#28190F` |  |

## Layouts, shells and navigation

- app: header first; container fixed 1200 center, padding 6, section gap 6; header sticky, divider; sidebar left 248 wide sticky, divider; footer, divider.
- marketing: header first; container fixed 1240 center, padding 8, section gap 8, full-bleed sections; header sticky, over the hero, none; footer, divider.

Component defaults: Textarea look outline; Tag variant base, size sm, look bordered; Tabs variant default; Switch variant default, size md; MultiSelect look outline; Select look outline; Radio variant default, size md; PopoverButton look rounded ghost; Link variant default, look plain; Input look outline; NumberInput look outline; PasswordInput look outline; SearchInput look outline; FormControl variant default, size md, look outline; Dialog size md; Chip variant default, size sm, look outline rounded; ChipGroup look collapsed; Checkbox variant default, size md; Card variant default, look outline; Button variant default, size md, look rounded; IconButton look rounded ghost; Avatar size md; Accordion look bordered; Collapsible look bordered; Toast status info.

Navigation: Jaipur Studio Ceramics → S01 (public), Owner sign in → S06 (public), Pieces → S08 (signedIn), Orders → S10 (signedIn), Discount codes → S12 (signedIn), Overview → S07 (signedIn), Shop settings → S18 (signedIn).

### SH1 app

The frame of every framed app page, from the theme's app layout. Frames S07, S08, S09, S10, S11, S12, S18.

- SH1.r1 top, 64 tall, row gap 4 padding 4 align center justify between: start: Wordmark; center: Shop, Orders and stock navigation; end: Account menu
  - [Link plain · navigation] Pieces → S08 `SH1.S09.n01`
  - [Link plain · navigation] Orders → S10 `SH1.S11.n01`
  - [Truncate] Jaipur Studio Ceramics Shop → S01 `SH1.n01`
  - [container · row gap 2 align center justify center] shop orders and stock navigation row `SH1.n02`
    - [Link plain · navigation] Pieces → S08 `SH1.n03`
    - [Link plain · navigation] Orders → S10 `SH1.n04`
    - [Link plain · navigation] Discount codes → S12 `SH1.n05`
  - [container · row gap 2 align center justify end] account actions row `SH1.n06`
    - [Dropdown · secondary-action] "Account menu" (F06.S01) `SH1.n07`
    - [Link plain · navigation] Owner sign in → S06 `SH1.n08`
- SH1.r2 bottom, content height, row gap 4 padding 4 align center justify between: start: Shop name and Jaipur studio note; center: Studio pickup and courier note; end: Shop owner sign in
  - [text caption] Jaipur Studio Ceramics · Jaipur studio `SH1.n16`
  - [text caption] Studio pickup and courier available `SH1.n17`
  - [Link plain · navigation] Owner sign in → S06 `SH1.n18`
- SH1.r3 left, 248 wide, column gap 3 padding 4 align stretch justify between: top: Pieces, Orders, Discount codes navigation; bottom: Low stock and shop settings links
  - [container · column gap 1.5 align stretch] primary owner navigation column (fills) `SH1.n09`
    - [Link plain · navigation] Pieces → S08 (fills) `SH1.n10`
    - [Link plain · navigation] Orders → S10 (fills) `SH1.n11`
    - [Link plain · navigation] Discount codes → S12 (fills) `SH1.n12`
  - [container · column gap 1.5 align stretch] secondary owner navigation column (fills) `SH1.n13`
    - [Link plain · navigation] Overview → S07 (fills) `SH1.n14`
    - [Link plain · navigation] Shop settings → S18 (fills) `SH1.n15`

### SH2 marketing

The frame of every framed marketing page, from the theme's marketing layout. Frames S01, S02, S03, S04.

- SH2.r1 top, over the page, 72 tall, row gap 4 padding 4 align center justify between: start: Wordmark; center: Mugs, Bowls, Planters, Vases; end: Shop owner sign in
  - [Truncate] Jaipur Studio Ceramics Shop → S01 `SH2.n01`
  - [container · row gap 4 align center justify center] row of category links `SH2.n02`
    - [Link plain · navigation] Jaipur Studio Ceramics → S01 `SH2.n03`
    - [Link plain · navigation] Jaipur Studio Ceramics → S01 `SH2.n04`
    - [Link plain · navigation] Jaipur Studio Ceramics → S01 `SH2.n05`
    - [Link plain · navigation] Jaipur Studio Ceramics → S01 `SH2.n06`
  - [Link plain · navigation] Back to piece → S02 `SH2.S03.n01`
  - [Link plain · navigation] Owner sign in → S06 `SH2.n07`
- SH2.r2 bottom, content height, row gap 4 padding 6 align center justify between: start: Wordmark and small-batch note; center: Pickup address and instructions summary; end: Shop owner sign in
  - [container · column gap 2] footer brand block `SH2.n08`
    - [text body] Jaipur Studio Ceramics Shop `SH2.n09`
    - [text caption] Small-batch ceramics made in Jaipur. `SH2.n10`
  - [container · column gap 1 align center] pickup address summary block (fills) `SH2.n11`
    - [text caption] Studio pickup daily 10am to 6pm in Jaipur. `SH2.n12`
    - [text caption] Courier across India. Pay by UPI. `SH2.n13`
  - [Link plain · navigation] Owner sign in → S06 `SH2.n14`

## S01 Shop front

/ · marketing screen · shell SH2 · wide width · public · entry

Let guest buyers understand the studio shop and browse available pieces.

States: empty, error. Serves: F01.S01, F01.S02, F02.S01, F02.S02, F01.A01, F01.A02, F02.A01, F02.A02. Sections: column gap 8 padding 8 align stretch.

### S01.sec1 Jaipur Studio Ceramics (hero, column gap 4 padding 12 align center, on the brand surface)

Shows the shop name heading, small-batch story and how to order without messaging plus pickup and courier notes.

- [Truncate] Jaipur Studio Ceramics (F01.S01) (fills; data ShopSetting.shopName; states default, empty, error) `S01.n01`
- [text title] Small-batch mugs, bowls, planters and vases from our Jaipur studio. Every piece has photos, price and honest availability. Order here without messaging. Choose studio pickup or courier at checkout. (F01.S01) (data ShopSetting.pickupAddress, ShopSetting.pickupInstructions; states default, empty, error) `S01.n02`
- [Button md rounded · primary-action] Browse pieces (F01.S01) (states default, empty) `S01.n03`

### S01.sec2 Shop pieces grid (cards, column gap 4 align stretch)

Provides type, availability and price-sort filters above a photo grid of pieces with price and availability tags and empty-state with clear-filters.

- [container · row gap 2 align stretch wraps] a row of piece filters (fills; states default, empty) `S01.n04`
  - [Select outline · input] Type (F02.S01, F02.S02) (160 wide; states default, empty) `S01.n05`
  - [Select outline · input] Availability (F02.S01, F02.S02) (160 wide; states default, empty) `S01.n06`
  - [Select outline · input] Sort by price (F02.S01, F02.S02) (160 wide; states default, empty) `S01.n07`
- [container · grid 3 columns gap 4 align stretch] a grid of piece cards (fills) `S01.n08`
  - [container · column gap 4] a piece card (F01.S02, F02.S01) (240 wide) `S01.n09`
    - [media] "Photo of the piece" (fills, 200 tall) `S01.n10`
    - [Truncate] Speckled Stoneware Mug (F01.S02, F02.S01) (fills; data Piece.name) `S01.n11`
    - [text caption] Mug (F02.S01) (data Piece.type) `S01.n12`
    - [text body] ₹850 (F01.S02, F02.S01) (data Piece.basePrice) `S01.n13`
    - [Tag sm bordered · display] Only 2 left (F01.S02, F02.S01) (data Variant.stockCount) `S01.n14`
    - [Link plain · navigation] View piece → S02 (F01.S02, F02.S01) `S01.n15`
- [container · column gap 4 padding 4 align center justify center] a centred empty state (fills; states empty) `S01.n16`
  - [media] an empty tray icon (states empty) `S01.n17`
  - [text body] No pieces to show right now. (F01.A01, F01.A02, F02.A01, F02.A02) (states empty) `S01.n18`
  - [Button md rounded · secondary-action] Clear filters (F02.A01) (states empty) `S01.n19`
- [feedback body] Pieces did not load. (fills; states error) `S01.n20`

### S01.sec3 Shop footer (footer, row gap 4 padding 4 justify between wraps)

Repeats the studio pickup address and pickup instructions for buyers.

- [container · column gap 1] a column with the studio pickup address (fills) `S01.n21`
  - [text label] Studio pickup (fills) `S01.n22`
  - [text body] 14 Clay Lane, Kothrud, Pune 411038 (fills; data ShopSetting.pickupAddress) `S01.n23`
- [container · column gap 1] a column with pickup instructions (fills) `S01.n24`
  - [text label] Pickup instructions (fills) `S01.n25`
  - [text body] Call on arrival. Pickup Tue-Sun, 10 AM to 6 PM. Bring your order ID. (fills; data ShopSetting.pickupInstructions) `S01.n26`

## S02 Piece detail

/pieces/[pieceId] · marketing screen · shell SH2 · wide width · public · entry

Let a buyer judge a piece and see honest per-variant stock.

States: empty, error, notFound. Serves: F02.S03, F03.S01, F02.A03, F02.A04, F03.A01, F03.A07. Sections: column gap 8 padding 8 align stretch.
Box S02.b1: column gap 8 align center, fills.

### S02.sec1 Piece purchase detail (detail, column gap 4 padding 11 align stretch, 960 wide, in S02.b1)

Shows gallery photos, type tag, price, description and per-variant stock with variant picker, quantity selector and checkout button, plus sold-out state with link back to shop.

- [h1 display] Speckled Stoneware Mug (fills; data Piece.name) `S02.n01`
- [container · row gap 4 wraps] a row with gallery and details (fills) `S02.n02`
  - [new PieceGallery · media] the piece gallery with large photo and thumbnails (fills; data Piece.photo) `S02.n03`
  - [container · column gap 4] a column with type, price and description (fills) `S02.n04`
    - [Tag sm bordered · display] Mug (data Piece.type) `S02.n05`
    - [text body] ₹850 (fills; data Piece.basePrice, Variant.priceAdjustment) `S02.n06`
    - [text body] Hand-thrown mug in speckled clay. Holds 300 ml. Pickup or courier. (fills; data Piece.description) `S02.n07`
- [container · row gap 2 align center wraps] a row with variant picker, quantity and checkout (fills) `S02.n08`
  - [new VariantPicker · input] "Choose glaze and size" (F02.S03, F03.S01) (fills; data Variant.glazeName, Variant.sizeName, Variant.stockCount, Variant.priceAdjustment) `S02.n09`
  - [container · row gap 2 align center wraps] a quantity stepper `S02.n10`
    - [IconButton rounded ghost · secondary-action] "Decrease quantity" (F03.S01) `S02.n11`
    - [text body] 1 `S02.n12`
    - [IconButton rounded ghost · secondary-action] "Increase quantity" (F03.S01) `S02.n13`
  - [Button md rounded · primary-action] Continue to checkout → S03 (F02.S03, F03.S01) `S02.n14`
- [feedback body] Sold out. No glaze and size left to order. (F02.A04, F03.A07) (fills; states empty) `S02.n15`
- [Link plain · navigation] Back to shop → S01 (F02.A04, F03.A07) (states empty) `S02.n16`
- [feedback body] This piece is no longer available. (F02.A03, F03.A01) (fills; states notFound) `S02.n17`
- [Link plain · navigation] See pieces for sale → S01 (F02.A03, F03.A01) (states notFound) `S02.n18`
- [feedback body] Something went wrong. Please try again. (fills; states error) `S02.n19`

## S03 Checkout

/pieces/[pieceId]/checkout · marketing screen · shell SH2 · narrow width · public

Collect guest details and show honest totals before confirming.

States: . Serves: F03.S02, F03.A02, F03.A03, F03.A04. Sections: column gap 8 padding 8 align stretch.
Box S03.b1: column gap 8, fills.
Frame: adds SH2.S03.n01; leaves out SH2.n02, SH2.n03, SH2.n04, SH2.n05, SH2.n06.

### S03.sec1 Checkout (form, column gap 4 padding 4 align stretch, in S03.b1)

Collects glaze, size, quantity, name, phone, fulfilment choice with conditional delivery address and optional discount code with Apply, shows piece total, discount, shipping and final total with inline errors and a submit button to review.

- [h1 display] Checkout (fills) `S03.n01`
- [container · column gap 6 align stretch] a column of checkout groups (fills) `S03.n02`
  - [container · column gap 4 align stretch] a row of variant fields (fills) `S03.n03`
    - [Select outline · input] Chosen glaze (F03.S02) (fills; field FD15; data Variant.glazeName, Variant.stockCount) `S03.n04`
    - [Select outline · input] Chosen size (F03.S02) (fills; field FD16; data Variant.sizeName, Variant.stockCount) `S03.n05`
    - [NumberInput outline · input] Quantity (F03.S02) (fills; field FD17; data Variant.stockCount) `S03.n06`
  - [container · column gap 4 align stretch] a row of buyer fields (fills) `S03.n07`
    - [Input outline · input] Buyer name (F03.S02) (fills; field FD18; data Order.buyerName) `S03.n08`
    - [Input outline · input] Buyer phone (F03.S02) (fills; field FD19; data Order.phone) `S03.n09`
  - [container · column gap 4 align stretch] a column of fulfilment fields (fills) `S03.n10`
    - [RadioGroup · input] Fulfilment choice (F03.S02) (fills; field FD20; data Order.fulfilment) `S03.n11`
    - [Textarea outline · input] Delivery address (F03.S02) (fills; field FD21; data Order.deliveryAddress) `S03.n12`
  - [container · column gap 4 align stretch] a row of discount input and apply (fills) `S03.n13`
    - [Input outline · input] Discount code (F03.S02) (fills; field FD22; data DiscountCode.codeWord) `S03.n14`
    - [Button md rounded · secondary-action] Apply (F03.S02, F03.A04) (data DiscountCode.codeWord, Order.discountAmount) `S03.n15`
  - [container · column gap 4 align stretch] a column of order totals (fills) `S03.n16`
    - [display body] Piece total: (fills; data Order.pieceTotal) `S03.n17`
    - [display body] Discount: (fills; data Order.discountAmount) `S03.n18`
    - [display body] Shipping: (fills; data Order.shippingCharge) `S03.n19`
    - [display body] Total to pay on UPI: (fills; data Order.finalTotal) `S03.n20`
  - [Button md rounded · primary-action] Review order (F03.S02, F03.A02, F03.A03, F03.A04) (fills; data Order.finalTotal) `S03.n21`

## S04 Order confirmation

/orders/[orderId] · marketing screen · shell SH2 · medium width · public

Review the order before creation and keep a visible confirmation afterwards.

States: error, notFound. Serves: F03.S03, F03.A05, F03.A06. Sections: column gap 8 padding 8 align stretch.
Box S04.b1: column gap 8, fills.

### S04.sec1 Order confirmed (detail, column gap 4 padding 10 align stretch, in S04.b1)

Shows review of items with glaze and size, buyer and fulfilment details and totals with Confirm order button, then becomes a receipt with pickup address and UPI-later note.

- [h1 display] Order confirmed (fills) `S04.n01`
- [container · column gap 6 align stretch] a column of detail groups (fills) `S04.n02`
  - [container · column gap 2 align stretch] a column of item and buyer lines (fills) `S04.n03`
    - [text body] Speckled Mug · Oat glaze · 250 ml × 2 — ₹900 (fills; data OrderItem.quantity, OrderItem.price) `S04.n04`
    - [text body] Asha Rao · 98200 12345 (fills; data Order.buyerName, Order.phone) `S04.n05`
    - [text body] Studio Pickup (fills; data Order.fulfilment) `S04.n06`
    - [text body] Deliver to: 2 Rose Villa, Kochi 682001 (fills; data Order.deliveryAddress) `S04.n07`
  - [container · column gap 4 align stretch] a column of totals and receipt notes (fills) `S04.n08`
    - [text body] Piece total ₹900 · Discount −₹100 · Shipping ₹80 · Total ₹880 (fills; data Order.pieceTotal, Order.discountAmount, Order.shippingCharge, Order.finalTotal) `S04.n09`
    - [text body] Pickup: 14 Pottery Lane, Kochi. Come Tue-Sat, 10 to 6. Call on arrival. (fills; data ShopSetting.pickupAddress, ShopSetting.pickupInstructions) `S04.n10`
    - [text body] Awaiting UPI Payment. No payment taken now. Pay by UPI when the maker shares the QR. (fills; data Order.paymentStatus) `S04.n11`
    - [Tag sm bordered · display] New · Awaiting UPI Payment (data Order.status, Order.paymentStatus) `S04.n12`
  - [container · column gap 4] a column for the confirm action and messages (fills) `S04.n13`
    - [Button md rounded · primary-action] Confirm order (F03.S03) `S04.n14`
    - [feedback body] Could not place your order. Details are kept. Try again. (F03.A05) (fills; states error) `S04.n15`
    - [feedback body] That glaze and size just sold out. No order was made. (F03.A06) (fills; states notFound) `S04.n16`
    - [Link plain · navigation] Back to piece → S02 (F03.A06) (states notFound) `S04.n17`

## S05 Owner sign up

/owner/signup · app screen · shell none · narrow width · public · entry

Create the single shop owner account.

States: . Serves: F04.S01, F04.S02, F04.A01, F04.A02, F04.A03, F04.A04. Sections: column gap 6 padding 6 align stretch.
Box S05.b1: column gap 6 align center, fills.

### S05.sec1 Create owner account (auth-form, column gap 4 padding 4 align stretch, in S05.b1)

Shows centered card with email and password fields, inline errors, Create account button plus Sign in instead and Cancel to shop links.

- [h1 title] Create owner account (F04.S01) (fills) `S05.n01`
- [Input outline · input] Owner email (F04.S01, F04.S02, F04.A01, F04.A02) (fills; field FD01) `S05.n02`
- [PasswordInput outline · input] Owner password (F04.S01, F04.S02, F04.A01, F04.A02) (fills; field FD02) `S05.n03`
- [Button md rounded · primary-action] Create account (F04.S02, F04.A01, F04.A02, F04.A03) (fills) `S05.n04`
- [container · row gap 2 align center justify center wraps] a row of links (fills) `S05.n05`
  - [Link plain] Sign in instead → S06 (F04.A03) `S05.n06`
  - [Link plain] Cancel and back to shop → S01 (F04.A04) `S05.n07`

## S06 Owner sign in

/owner/signin · app screen · shell none · narrow width · public · entry

Sign the shop owner in to manage the shop.

States: empty, error. Serves: F05.S01, F05.S02, F05.A01, F05.A02, F05.A03, F05.A04. Sections: column gap 6 padding 6 align stretch.
Box S06.b1: column gap 6 align center, fills.

### S06.sec1 Owner sign in (auth-form, column gap 4 padding 4 align stretch, 400 wide, in S06.b1)

Shows centered card with email and password fields, inline errors, Sign in button plus Sign up and Cancel to shop links.

- [h1 title] Owner sign in (fills) `S06.n01`
- [Input outline · input] Owner email (F05.S01, F05.S02) (fills; field FD01; states default, empty, error) `S06.n02`
- [PasswordInput outline · input] Owner password (F05.S01, F05.S02) (fills; field FD02; states default, empty, error) `S06.n03`
- [Button md rounded · primary-action] Sign in → S07 (F05.S02, F05.A01, F05.A02, F05.A03, F05.A04) (fills; data Order.status, Piece.name; states default, empty, error) `S06.n04`
- [container · row gap 2 align center justify between wraps] a row of links (fills) `S06.n05`
  - [Link plain · navigation] Sign up → S05 `S06.n06`
  - [Link plain · navigation] Back to shop → S01 `S06.n07`

## S07 Dashboard

/owner · app screen · shell SH1 · wide width · signed in (shopOwner) · entry

Show what needs packing, payment and remaking next.

States: empty, error. Serves: F06.S01, F16.S01, F16.A01. Sections: column gap 6 padding 6 align stretch.
Box S07.b1: column gap 6, fills.

### S07.sec1 Overview (stats, column gap 4 align stretch, in S07.b1)

Shows count cards for new orders, orders awaiting UPI payment, nearly-gone and sold-out variants with links to orders and catalogue.

- [h1 title] Overview (fills) `S07.n01`
- [container · grid 4 columns gap 4 align stretch] row of count cards (fills; states default, empty) `S07.n02`
  - [container · column gap 4] new orders count card (fills; states default, empty) `S07.n03`
    - [Truncate] 12 (fills; data Order.status; states default, empty) `S07.n04`
    - [text body] New orders (fills; states default, empty) `S07.n05`
    - [Link plain · navigation] View orders → S10 (F16.S01) (states default, empty) `S07.n06`
  - [container · column gap 4] awaiting payment count card (fills; states default, empty) `S07.n07`
    - [Truncate] 4 (fills; data Order.paymentStatus; states default, empty) `S07.n08`
    - [text body] Awaiting UPI payment (fills; states default, empty) `S07.n09`
    - [Link plain · navigation] View orders → S10 (F16.S01) (states default, empty) `S07.n10`
  - [container · column gap 4] nearly gone count card (fills; states default, empty) `S07.n11`
    - [Truncate] 3 (fills; data Variant.stockCount; states default, empty) `S07.n12`
    - [text body] Nearly gone (fills; states default, empty) `S07.n13`
    - [Link plain · navigation] View catalogue → S08 (F16.S01) (states default, empty) `S07.n14`
  - [container · column gap 4] sold out count card (fills; states default, empty) `S07.n15`
    - [Truncate] 1 (fills; data Variant.stockCount; states default, empty) `S07.n16`
    - [text body] Sold out (fills; states default, empty) `S07.n17`
    - [Link plain · navigation] View catalogue → S08 (F16.S01) (states default, empty) `S07.n18`
- [container · column gap 4 align center justify center] empty state message (fills; states empty) `S07.n19`
  - [text body] All caught up. No new orders and stock looks good. (states empty) `S07.n20`
  - [Link plain · navigation] View orders → S10 (F16.A01) (states empty) `S07.n21`
  - [Link plain · navigation] View catalogue → S08 (F16.A01) (states empty) `S07.n22`
- [feedback body] Counts did not load. Check connection and try again. (fills; states error) `S07.n23`

### S07.sec2 Low-stock variants table (table, column gap 4 align stretch, in S07.b1)

Lists variants with 2 or fewer left and sold-out with 0 left linking to their pieces for remaking.

- [Table · column gap 2 align stretch · display] low-stock variants table (F16.S01) (fills) `S07.n24`
  - [container · row gap 4 align center justify between] a low-stock variant row (fills) `S07.n25`
    - [Link plain] River Mug · Matte White · Medium → S09 (fills; data Piece.name, Variant.glazeName, Variant.sizeName) `S07.n26`
    - [Tag sm bordered · display] Only 1 left (data Variant.stockCount) `S07.n27`
- [container · column gap 4 padding 4 align center justify center] an all-stocked-up empty state (fills; states empty) `S07.n28`
  - [media] a small stacked-bowls outline illustration (48 wide, 48 tall; states empty) `S07.n29`
  - [text body] All stocked up with nothing running low. (states empty) `S07.n30`
  - [Link plain] View catalogue → S08 (F16.A01) (states empty) `S07.n31`
- [feedback body] Could not load low-stock variants. Check your connection and try again. (fills; states error) `S07.n32`

### S07.sec3 Recent orders preview (list, column gap 4 padding 4 align stretch, in S07.b1)

Previews newest orders with buyer, totals and status tags linking to the full order list.

- [container · column gap 2 align stretch] list of newest orders (F16.S01) (fills) `S07.n33`
  - [container · row gap 2 align center justify between] a recent order row (F16.S01) (fills) `S07.n34`
    - [Truncate] Meera Rao · ₹1,850 (F16.S01) (fills; data Order.buyerName, Order.finalTotal) `S07.n35`
    - [Tag sm bordered · display] New (F16.S01) (data Order.status) `S07.n36`
    - [Tag sm bordered · display] Awaiting UPI Payment (F16.S01) (data Order.paymentStatus) `S07.n37`
- [Link plain · navigation] View all orders → S10 (F16.S01) `S07.n38`
- [container · column gap 4 padding 4 align center justify center] empty orders message box (F16.A01) (fills; states empty) `S07.n39`
  - [media] an empty orders icon (F16.A01) (states empty) `S07.n40`
  - [text body] No new orders yet. (F16.A01) (states empty) `S07.n41`
  - [Button md rounded · navigation] View orders → S10 (F16.A01) (states empty) `S07.n42`
- [feedback body] Could not load recent orders. Check your connection and try again. (F16.S01) (fills; states error) `S07.n43`

## S08 Catalogue

/owner/pieces · app screen · shell SH1 · wide width · signed in (shopOwner)

Manage designs and see their availability.

States: empty, error. Serves: F07.S01, F08.S01, F09.S01, F07.A05, F08.A01, F09.A01. Sections: column gap 6 padding 6 align stretch.
Box S08.b1: column gap 6, fills.

### S08.sec1 Pieces (page-header, row gap 4 align center justify between, in S08.b1)

Shows the Pieces heading with an Add piece button that opens the create dialog.

- [Truncate] Pieces (fills) `S08.n01`
- [Button md rounded · primary-action] Add piece → S13 (F07.S01, F07.A05) `S08.n02`

### S08.sec2 Catalogue pieces grid (cards, column gap 4 align stretch, in S08.b1)

Shows pieces as cards with photo, type tag, base price and stock summary, each linking to owner piece detail, with empty-state to add first piece.

- [container · grid 3 columns gap 4 align stretch] a grid of piece cards (fills) `S08.n03`
  - [Link plain · column gap 4 · navigation] "Open Speckled Mug" → S09 (F08.S01, F09.S01) (240 wide) `S08.n04`
    - [media] the piece photo (fills, 160 tall; data Piece.photo) `S08.n05`
    - [container · row gap 2 align center wraps] a row of type and stock tags (fills) `S08.n06`
      - [Tag sm bordered · display] Mug (data Piece.type) `S08.n07`
      - [Tag sm bordered · display] 12 in stock (data Variant.stockCount) `S08.n08`
    - [Truncate] Speckled Mug (fills; data Piece.name) `S08.n09`
    - [text body] ₹850 base price (fills; data Piece.basePrice) `S08.n10`
- [container · column gap 4 padding 6 align center justify center] the empty-state block (F08.A01, F09.A01) (fills; states empty) `S08.n11`
  - [media] an empty shelf illustration (64 wide, 64 tall; states empty) `S08.n12`
  - [text body] No pieces yet. (F08.A01, F09.A01) (states empty) `S08.n13`
  - [Button md rounded · primary-action] Add piece → S13 (F08.A01, F09.A01) (states empty) `S08.n14`
- [feedback body] Pieces did not load. Try again. (fills; states error) `S08.n15`

## S09 Owner piece detail

/owner/pieces/[pieceId] · app screen · shell SH1 · wide width · signed in (shopOwner)

View and edit a piece and its variant stock.

States: empty, error, notFound. Serves: F08.S02, F08.S03, F09.S02, F08.A02, F08.A03, F08.A04, F08.A05, F08.A06, F09.A02. Sections: column gap 6 padding 6 align stretch.
Box S09.b1: column gap 6, fills.
Frame: adds SH1.S09.n01; leaves out nothing.

### S09.sec1 Owner piece header (page-header, row gap 4 align center, in S09.b1)

Shows back link to catalogue, piece name heading and Delete action for the piece.

- [Link plain · navigation] Back to catalogue → S08 (F08.S02, F09.S02, F08.A02, F09.A02) (states default, empty, error, notFound) `S09.n01`
- [Truncate] Speckled Stoneware Mug (F08.S02, F09.S02) (fills; data Piece.name; states default, empty, error) `S09.n02`
- [Button md rounded · destructive-action] Delete → S15 `S09.n03`
- [text body] This piece is gone. (F08.A02, F09.A02) (fills; states notFound) `S09.n04`

### S09.sec2 Piece edit form (form, column gap 4 align stretch, in S09.b1)

Provides editable fields for name, type, price, description and photos with Save and Cancel that keep typed values on errors.

- [container · row gap 4 align stretch] a row for name and type fields (fills) `S09.n05`
  - [Input outline · input] Speckled Chai Mug (F08.S03) (fills; field FD06; data Piece.name) `S09.n06`
  - [Select outline · input] Mug (F08.S03) (fills; field FD07; data Piece.type) `S09.n07`
- [NumberInput outline · input] 650 (F08.S03) (fills; field FD08; data Piece.basePrice) `S09.n08`
- [Input outline · input] https://example.in/photos/speckled-mug-1.jpg (F08.S03) (fills; field FD10; data Piece.photo) `S09.n09`
- [Textarea outline · input] Wheel-thrown stoneware mug with speckled glaze, 300ml (F08.S03) (fills; field FD09; data Piece.description) `S09.n10`
- [container · row gap 4 align stretch] a row for glaze and size variant fields (fills) `S09.n11`
  - [Input outline · input] Speckled White (F08.S03) (fills; field FD11; data Variant.glaze) `S09.n12`
  - [Input outline · input] Large (F08.S03) (fills; field FD12; data Variant.size) `S09.n13`
- [container · row gap 4 align stretch] a row for stock and price adjustment fields (fills) `S09.n14`
  - [NumberInput outline · input] 12 (F08.S03) (fills; field FD13; data Variant.stock) `S09.n15`
  - [NumberInput outline · input] 0 (F08.S03) (fills; field FD14; data Variant.priceAdjustment) `S09.n16`
- [container · row gap 2 align center] a row for save and cancel actions (fills) `S09.n17`
  - [Button md rounded · primary-action] Save (F08.S03, F08.A03, F08.A04) `S09.n18`
  - [Button md rounded · secondary-action] Cancel (F08.A05) `S09.n19`

### S09.sec3 Piece variants table (table, column gap 6 align stretch, in S09.b1)

Lists glaze, size, stock and price adjustment rows with an Add variant action and empty-state inviting to add variants.

- [container · column gap 4 align stretch] piece details fields group (F08.S03) (fills; states default, error) `S09.n20`
  - [Input outline · input] Piece name (F08.S03, F08.A03) (fills; field FD06; states default, error) `S09.n21`
  - [Select outline · input] Piece type (F08.S03, F08.A03) (fills; field FD07; states default, error) `S09.n22`
  - [NumberInput outline · input] Base price (F08.S03, F08.A03) (fills; field FD08; states default, error) `S09.n23`
  - [Textarea outline · input] Description (F08.S03, F08.A03) (fills; field FD09; states default, error) `S09.n24`
  - [Input outline · input] Photo link (F08.S03, F08.A03) (fills; field FD10; states default, error) `S09.n25`
- [Table · column gap 4 align stretch · display] Speckled White · Large · 12 · +₹50 (F08.S02, F08.S03) (fills; data Variant.glazeName, Variant.sizeName, Variant.stockCount, Variant.priceAdjustment; states default, error) `S09.n26`
  - [Input outline · input] Glaze (F08.S03, F08.A03) (fills; field FD11; data Variant.glazeName; states default, error) `S09.n27`
  - [Input outline · input] Size (F08.S03, F08.A03) (fills; field FD12; data Variant.sizeName; states default, error) `S09.n28`
  - [NumberInput outline · input] Stock (F08.S03, F08.A03) (fills; field FD13; data Variant.stockCount; states default, error) `S09.n29`
  - [NumberInput outline · input] Price extra (F08.S03) (fills; field FD14; data Variant.priceAdjustment; states default, error) `S09.n30`
  - [Truncate] Speckled White · Large (F08.S02) (fills; data Variant.glazeName, Variant.sizeName) `S09.n31`
- [container · row gap 2 align center wraps] variant actions row (fills; states default, empty, error) `S09.n32`
  - [Button md rounded · primary-action] Add variant → S14 (F08.S03, F08.A04, F08.A06) (states default, empty, error) `S09.n33`
  - [Button md rounded · secondary-action] Cancel (F08.A05) (states default, error) `S09.n34`
- [container · column gap 4 align center] empty variants centred block (F08.A06) (fills; states empty) `S09.n35`
  - [media] empty variants illustration (F08.A06) (states empty) `S09.n36`
  - [text body] No variants yet. (F08.A06) (states empty) `S09.n37`
  - [Button md rounded · secondary-action] Add variant → S14 (F08.S03, F08.A06) (states empty) `S09.n38`
- [feedback body] Could not save changes. Check the marked fields and try again. (F08.A03, F08.A04) (fills; states error) `S09.n39`

## S10 Orders list

/owner/orders · app screen · shell SH1 · wide width · signed in (shopOwner)

See new orders and track who has paid.

States: empty, error. Serves: F12.S01, F12.S02, F13.S01, F14.S01, F15.S01, F12.A01, F12.A02, F13.A01, F14.A01, F15.A01. Sections: column gap 6 padding 6 align stretch.
Box S10.b1: column gap 6, fills.

### S10.sec1 Orders (table, column gap 4 align stretch, in S10.b1)

Provides order-status and payment-status filters above a newest-first table with buyer, fulfilment, totals and status tags, pagination and clear-filters empty-state.

- [h1 title] Orders (fills) `S10.n01`
- [container · row gap 2 align center wraps] row of order filters (fills; states default, empty) `S10.n02`
  - [Dropdown · input] Order status (F12.S02) (180 wide; data Order.status; states default, empty) `S10.n03`
  - [Dropdown · input] Payment status (F12.S02) (180 wide; data Order.paymentStatus; states default, empty) `S10.n04`
- [Table · column gap 4 align stretch · display] newest-first orders table (F12.S01, F12.S02, F13.S01, F14.S01, F15.S01) (fills; data Order.buyerName, Order.phone, Order.fulfilment, Order.finalTotal, Order.status, Order.paymentStatus) `S10.n05`
  - [Truncate] Asha Rao · 98200 12345 · Courier · ₹1,850 (F12.S01, F12.S02, F13.S01, F14.S01, F15.S01) (fills; data Order.buyerName, Order.phone, Order.fulfilment, Order.finalTotal) `S10.n06`
  - [Tag sm bordered · display] New (F12.S01, F12.S02, F13.S01, F14.S01, F15.S01) (70 wide; data Order.status) `S10.n07`
  - [Tag sm bordered · display] Awaiting UPI Payment (F12.S01, F12.S02, F13.S01, F14.S01, F15.S01) (150 wide; data Order.paymentStatus) `S10.n08`
- [Pagination · navigation] "Orders pages" (F12.S01, F12.S02, F13.S01, F14.S01, F15.S01) (fills) `S10.n09`
- [container · column gap 4 padding 6 align center justify center] centred empty-state box (F12.A01, F12.A02, F13.A01, F14.A01, F15.A01) (fills; states empty) `S10.n10`
  - [media] empty box illustration (F12.A01, F12.A02, F13.A01, F14.A01, F15.A01) (48 wide, 48 tall; states empty) `S10.n11`
  - [text body] No orders to show yet, new orders will appear here. (F12.A01, F12.A02, F13.A01, F14.A01, F15.A01) (states empty) `S10.n12`
  - [Button md rounded · secondary-action] Clear filters (F12.A02) (states empty) `S10.n13`
- [feedback body] Orders didn't load. Try again. (F12.S01, F13.S01, F14.S01, F15.S01) (fills; states error) `S10.n14`

## S11 Order detail

/owner/orders/[orderId] · app screen · shell SH1 · medium width · signed in (shopOwner)

Work through payment, packing, handover or cancellation for one order.

States: empty, error, notFound, denied. Serves: F12.S03, F13.S02, F13.S03, F14.S02, F14.S03, F15.S02, F15.S03, F12.A03, F12.A04, F13.A02, F13.A03, F13.A04, F14.A02, F14.A03, F14.A04, F15.A02, F15.A03. Sections: column gap 6 padding 6 align stretch.
Box S11.b1: column gap 6, fills.
Frame: adds SH1.S11.n01; leaves out nothing.

### S11.sec1 Order detail (detail, column gap 4 padding 4 align stretch, in S11.b1)

Shows buyer, phone, placed date and time with status tags, fulfilment block, items with glaze size quantity price and totals, with only allowed next-status plus Mark Paid and Cancel actions.

- [h1 title] Order details (fills; states default, empty, denied, error) `S11.n01`
- [container · row gap 4 justify between wraps] a header row with buyer and status (fills; states default, empty, denied, error) `S11.n02`
  - [text body] Asha Rao · 98200 12345 · Placed 28 Oct, 10:30 AM (F12.S03) (fills; data Order.buyerName, Order.phone, Order.placedAt; states default, empty, denied, error) `S11.n03`
  - [container · row gap 2 align center wraps] a row of status tags (states default, empty, denied, error) `S11.n04`
    - [Tag sm bordered · display] New (F12.S03, F13.S02) (data Order.status; states default, empty, denied, error) `S11.n05`
    - [Tag sm bordered · display] Awaiting UPI Payment (F12.S03, F14.S02) (data Order.paymentStatus; states default, empty, denied, error) `S11.n06`
- [text body] Courier to 14 Rose Lane, Kochi 682001. (F12.S03) (fills; data Order.fulfilment, Order.deliveryAddress; states default, empty, denied, error) `S11.n07`
- [Table · display] Speckled Mug · Oatmeal glaze · 300ml · 2 x Rs 550 (F12.S03, F15.S02) (fills; data OrderItem.quantity, OrderItem.price; states default, empty, denied, error) `S11.n08`
- [container · column gap 1 align end] order totals (fills; states default, empty, denied, error) `S11.n09`
  - [text body] Piece total Rs 1,100 (F12.S03, F14.S02) (data Order.pieceTotal; states default, empty, denied, error) `S11.n10`
  - [text body] Discount Rs 100 (F12.S03, F14.S02) (data Order.discountAmount; states default, empty, denied, error) `S11.n11`
  - [text body] Shipping Rs 80 (F12.S03, F14.S02) (data Order.shippingCharge; states default, empty, denied, error) `S11.n12`
  - [text body] Final total Rs 1,080. Collect on UPI. (F12.S03, F14.S02) (data Order.finalTotal; states default, empty, denied, error) `S11.n13`
- [container · row gap 2 align center wraps] a row of order actions (fills; states default, empty, denied, error) `S11.n14`
  - [Button md rounded · primary-action] Move to next (F13.S02, F13.S03, F13.A03, F13.A04) (states default, empty, denied, error) `S11.n15`
  - [Button md rounded · secondary-action] Mark Paid (F14.S02, F14.S03, F14.A03, F14.A04) (states default, empty, denied, error) `S11.n16`
  - [Button md rounded · destructive-action] Cancel order → S17 (F15.S02, F15.S03, F15.A03) (states default, empty, denied, error) `S11.n17`
- [feedback body] No items yet. Return to the order list. (F12.A04) (fills; states empty) `S11.n18`
- [Link plain · navigation] Back to orders → S10 (F12.A04) (states empty) `S11.n19`
- [feedback body] This order is gone. Open the order list. (F12.A03, F13.A02, F14.A02, F15.A02) (fills; states notFound) `S11.n20`
- [Link plain · navigation] Back to orders → S10 (F12.S03, F12.A03, F13.A02, F14.A02, F15.A02) (states notFound) `S11.n21`
- [feedback body] That change is not allowed. Only New to Packed, then Packed to Shipped or Collected. Only New or Packed can be cancelled. This order is already Paid. (F13.A03, F14.A03, F15.A03) (fills; states denied) `S11.n22`
- [feedback body] Could not save. The order is unchanged. Try again. (F13.A04, F14.A04) (fills; states error) `S11.n23`

## S12 Discount codes list

/owner/discounts · app screen · shell SH1 · wide width · signed in (shopOwner)

Control time-limited promotions buyers enter at checkout.

States: empty, error. Serves: F10.S01, F11.S01, F11.A01. Sections: column gap 6 padding 6 align stretch.
Box S12.b1: column gap 6, fills.

### S12.sec1 Discount codes (page-header, row gap 4 align center justify between, in S12.b1)

Shows the Discount codes heading with a New code button that opens the discount dialog.

- [h1 title] Discount codes (fills) `S12.n01`
- [Button md rounded · primary-action] New code → S16 (F10.S01) `S12.n02`

### S12.sec2 Discount codes table (table, column gap 4 align stretch, in S12.b1)

Lists codes with code word, kind and value, start and end dates and active state, each row with an Edit action, plus empty-state to create first code.

- [Table · row gap 4 · display] discount codes table (F11.S01) (fills; data DiscountCode.codeWord, DiscountCode.kind, DiscountCode.value, DiscountCode.startDate, DiscountCode.endDate, DiscountCode.isActive) `S12.n03`
  - [Truncate] DIWALI20 (F11.S01) (fills; data DiscountCode.codeWord) `S12.n04`
  - [container · row gap 2 align center wraps] a row of value and status tags (F11.S01) `S12.n05`
    - [Tag sm bordered · display] 20% off (F11.S01) (data DiscountCode.kind, DiscountCode.value) `S12.n06`
    - [Tag sm bordered · display] Active (F11.S01) (data DiscountCode.isActive) `S12.n07`
  - [display body] 12 Oct 2026 - 14 Oct 2026 (F11.S01) (data DiscountCode.startDate, DiscountCode.endDate) `S12.n08`
  - [Button md rounded · secondary-action] Edit → S16 (F11.S01) `S12.n09`
- [container · column gap 4 padding 6 align center justify center] a centred empty-state block (F11.A01) (fills; states empty) `S12.n10`
  - [media] a tag icon (F11.A01) (32 wide, 32 tall; states empty) `S12.n11`
  - [text body] No discount codes yet. (F11.A01) (states empty) `S12.n12`
  - [Button md rounded · primary-action] Create code → S16 (F11.A01) (states empty) `S12.n13`
- [feedback body] Could not load discount codes. Try again. (F11.S01) (fills; states error) `S12.n14`

## S18 Shop settings

/owner/settings · app screen · shell SH1 · narrow width · signed in (shopOwner)

Keep shop identity and pickup details correct for buyers.

States: . Serves: F17.S01, F17.S02, F17.A01, F17.A02. Sections: column gap 6 padding 6 align stretch.
Box S18.b1: column gap 6, fills.

### S18.sec1 Shop settings (form, column gap 4 align stretch, in S18.b1)

Provides narrow fields for shop name, studio pickup address and pickup instructions with Save that keeps typed values on validation errors.

- [h1 title] Shop settings (fills) `S18.n01`
- [Input outline · input] Shop name (F17.S01, F17.S02) (fills; field FD03; data ShopSetting.shopName) `S18.n02`
- [Textarea outline · input] Studio pickup address (F17.S01, F17.S02) (fills; field FD04; data ShopSetting.pickupAddress) `S18.n03`
- [Textarea outline · input] Pickup instructions (F17.S01, F17.S02) (fills; field FD05; data ShopSetting.pickupInstructions) `S18.n04`
- [Button md rounded · primary-action] Save (F17.S02, F17.A01, F17.A02) `S18.n05`

### S18.sec2 Shop preview (detail, column gap 4 padding 4 align stretch, in S18.b1)

Shows live preview of exactly how buyers will see shop name, pickup address and instructions.

- [container · column gap 2 align stretch] buyer view of shop details (fills) `S18.n06`
  - [text body] Jaipur Studio Ceramics (F17.S01, F17.S02) (fills; data ShopSetting.shopName) `S18.n07`
  - [text body] 14 Potter Lane, Amer Road, Jaipur 302002 (F17.S01, F17.S02) (fills; data ShopSetting.pickupAddress) `S18.n08`
  - [text label] Pickup Tue to Sat 11am to 6pm, call on arrival (F17.S01, F17.S02) (fills; data ShopSetting.pickupInstructions) `S18.n09`
- [Input outline · input] Shop name (F17.S02) (fills; field FD03) `S18.n10`
- [Textarea outline · input] Studio pickup address (F17.S02) (fills; field FD04) `S18.n11`
- [Textarea outline · input] Pickup instructions (F17.S02) (fills; field FD05) `S18.n12`

## S13 Add piece

dialog of S08 · app screen · medium width · signed in (shopOwner)

Create a new piece with photos.

States: . Serves: F07.S02, F07.A01, F07.A02. Sections: column gap 5 align stretch.
Box S13.b1: column gap 5, fills.

### S13.sec1 Add piece form (form, column gap 4 align stretch, in S13.b1)

Provides name, type, base price, description and photo uploader with validation and preview kept for session, with Save and Add-variants-next plus Cancel actions.

- [h2 heading] Add piece (fills) `S13.n01`
- [text subheading] Add name, price, details and photos. Photos stay for this session. (fills) `S13.n02`
- [Input outline · input] Piece name (F07.S02) (fills; field FD06; data Piece.name) `S13.n03`
- [Select outline · input] Piece type (F07.S02) (fills; field FD07; data Piece.type) `S13.n04`
- [NumberInput outline · input] Piece base price (F07.S02) (fills; field FD08; data Piece.basePrice) `S13.n05`
- [Textarea outline · input] Piece description (F07.S02) (fills; field FD09; data Piece.description) `S13.n06`
- [new PhotoUploader · input] speckled-mug-1.jpg preview kept for this session (F07.S02) (fills; field FD10; data Piece.photo) `S13.n07`
- [container · row gap 2 align center justify end] a row of form actions (fills) `S13.n08`
  - [Button md rounded · primary-action] Save → S09 (F07.S02, F07.A01, F07.A02) `S13.n09`
  - [Button md rounded · secondary-action] Cancel `S13.n10`

## S14 Variant editor

dialog of S09 · app screen · narrow width · signed in (shopOwner)

Add glaze and size variants with stock to a piece.

States: . Serves: F07.S03, F07.A03, F07.A04. Sections: column gap 5 align stretch.
Box S14.b1: column gap 5, fills.

### S14.sec1 Variant form (form, column gap 4 align stretch, in S14.b1)

Provides compact fields for glaze name, size name, stock count and optional price adjustment with Save and Add-another plus Close actions keeping typed values on errors.

- [h2 heading] Add variant (fills) `S14.n01`
- [text subheading] Add stock for each glaze and size. Stock shows in the shop. (fills) `S14.n02`
- [Input outline · input] Glaze name (F07.S03) (fills; field FD11; data Variant.glazeName) `S14.n03`
- [Input outline · input] Size name (F07.S03) (fills; field FD12; data Variant.sizeName) `S14.n04`
- [NumberInput outline · input] Stock count (F07.S03) (fills; field FD13; data Variant.stockCount) `S14.n05`
- [NumberInput outline · input] Price adjustment (F07.S03) (fills; field FD14; data Variant.priceAdjustment) `S14.n06`
- [container · row gap 2 align center wraps] a row of form actions (fills) `S14.n07`
  - [Button md rounded · primary-action] Save (F07.S03, F07.A03, F07.A04) `S14.n08`
  - [Button md rounded · secondary-action] Add another (F07.S03) `S14.n09`
  - [Button md rounded · secondary-action] Close `S14.n10`

## S15 Delete piece confirm

dialog of S09 · app screen · narrow width · signed in (shopOwner)

Confirm removal of a piece and its variants.

States: . Serves: F09.S03, STD01.S01, STD01.A01, STD01.A02, F09.A03, F09.A04. Sections: column gap 5 align stretch.
Box S15.b1: column gap 5, fills.

### S15.sec1 Delete piece confirm (custom, column gap 4 align stretch, in S15.b1)

Asks to confirm removal naming the piece and saying variants leave the shop while past orders stay, with Confirm deletion and Keep actions.

- [h2 heading] Delete “Speckled Mug”? (STD01.S01) (fills; data Piece.name) `S15.n01`
- [text subheading] “Speckled Mug” and its variants will leave the shop, while past orders stay unchanged. (STD01.S01) (fills; data Piece.name) `S15.n02`
- [container · row gap 2 align center justify end] a row of dialog actions (fills) `S15.n03`
  - [Button md rounded · destructive-action] Confirm deletion (F09.S03, STD01.A01, F09.A03) `S15.n04`
  - [Button md rounded · secondary-action] Keep (STD01.A02, F09.A04) `S15.n05`

## S16 Discount code editor

dialog of S12 · app screen · medium width · signed in (shopOwner)

Create or update a discount code and its active state.

States: notFound. Serves: F10.S02, F11.S02, F11.S03, F10.A01, F10.A02, F10.A03, F11.A02, F11.A03, F11.A04, F11.A05. Sections: column gap 5 align stretch.
Box S16.b1: column gap 5, fills.

### S16.sec1 Discount code form (form, column gap 4 align stretch, in S16.b1)

Provides code word, kind selector for percentage or fixed rupees, value, start and end dates and active switch when editing, with Save and Cancel actions.

- [h2 heading] Discount code (fills) `S16.n01`
- [text subheading] Share this word on Instagram. Buyers type it at checkout. (fills) `S16.n02`
- [container · row gap 4 wraps] a row of code and kind fields (fills) `S16.n03`
  - [Input outline · input] Discount code word (F10.S02, F11.S02, F11.S03) (fills; field FD23; data DiscountCode.codeWord) `S16.n04`
  - [RadioGroup · row gap 2 wraps · input] Discount kind (F10.S02, F11.S02, F11.S03) (fills; field FD24; data DiscountCode.kind) `S16.n05`
    - [Radio md · input] Percentage off `S16.n06`
    - [Radio md · input] Fixed rupees off `S16.n07`
- [container · row gap 4 wraps] a row of value and date fields (fills) `S16.n08`
  - [NumberInput outline · input] Discount value (F10.S02, F11.S02, F11.S03) (fills; field FD25; data DiscountCode.value) `S16.n09`
  - [container · row gap 4 wraps] a row of start and end date fields (fills) `S16.n10`
    - [Input outline · input] Discount start date (F10.S02, F11.S02, F11.S03) (fills; field FD26; data DiscountCode.startDate) `S16.n11`
    - [Input outline · input] Discount end date (F10.S02, F11.S02, F11.S03) (fills; field FD27; data DiscountCode.endDate) `S16.n12`
- [Switch md · input] Discount active (F11.S02, F11.S03) (fills; field FD28; data DiscountCode.isActive) `S16.n13`
- [container · row gap 2 align center wraps] a row of save and cancel actions (fills) `S16.n14`
  - [Button md rounded · primary-action] Save (F10.S02, F11.S03, F10.A01, F10.A02, F11.A03, F11.A04) `S16.n15`
  - [Button md rounded · secondary-action] Cancel (F10.A03, F11.A05) `S16.n16`
- [container · column gap 4 align center] a centred gone message group (F11.A02) (fills; states notFound) `S16.n17`
  - [text body] This code is gone. Nothing was changed. (F11.A02) (fills; states notFound) `S16.n18`
  - [Button md rounded · navigation] Back to codes → S12 (F11.A02) (states notFound) `S16.n19`

## S17 Cancel order confirm

dialog of S11 · app screen · narrow width · signed in (shopOwner)

Confirm cancellation and stock return.

States: error. Serves: F15.S04, F15.A04, F15.A05. Sections: column gap 5 align stretch.
Box S17.b1: column gap 5, fills.

### S17.sec1 Cancel order confirm (custom, column gap 4 align stretch, in S17.b1)

Asks to confirm cancellation saying quantities return to variant stock, with Confirm cancellation and Keep order actions.

- [h2 heading] Cancel this order? (fills) `S17.n01`
- [text subheading] Cancelling returns the items to stock and marks the order as Cancelled. (fills; data Order.status, Variant.stockCount) `S17.n02`
- [container · row gap 2 align center justify end wraps] a row of dialog actions (fills) `S17.n03`
  - [Button md rounded · destructive-action] Confirm cancellation (F15.S04, F15.A05) `S17.n04`
  - [Button md rounded · secondary-action] Keep order (F15.A04) `S17.n05`
- [feedback body] Could not cancel. Please try again. (fills; states error) `S17.n06`

## New components

### PieceGallery

Show a piece's photos so buyers can judge it without messaging the maker.

- Closest existing: Card, ScrollArea. Why not: Card shows one container and ScrollArea scrolls, neither gives a large preview with thumbnail switching for multiple photos.
- Look: A warm gallery showing one large photo with a row of small thumbnails beneath it. It is for judging handmade shape and glaze without messaging the maker. It sits quietly on the page in soft radius with comfortable spacing, using the muted earth palette. Like the photo carousel of a craft marketplace product page.
- Width: 320 to fill. Box: fill, content, padding 0, gap 4; column gap 4 align stretch.
  - [media] large preview photo of the piece `PieceGallery.n01`
  - [container] row of small thumbnails `PieceGallery.n02`
  - [media] selected thumbnail photo of the piece `PieceGallery.n03`
  - [media] thumbnail photo of the piece `PieceGallery.n04`
  - [media] thumbnail photo of the piece `PieceGallery.n05`
  - [media] thumbnail photo of the piece `PieceGallery.n06`
- Used on: S02.

### VariantPicker

Let buyers choose one in-stock glaze and size variant with honest stock.

- Closest existing: Select, RadioGroup, ChipGroup. Why not: Select, RadioGroup and ChipGroup handle single-dimension choices but cannot bind glaze plus size plus stock count plus price adjustment plus disabled sold-out in one control.
- Look: A picker listing each glaze and size combination as a selectable row showing its price including adjustment and how many are left. It is for choosing an orderable variant honestly. Sold-out rows are disabled with a clear sold-out tag, nearly-gone rows carry a warm warning tag, all in soft radius and Lato. Like an airline seat picker that disables taken seats.
- Width: 240 to fill. Box: fill, content, padding 0, gap 2; column gap 4 align stretch.
  - [text] the group label: Choose glaze and size `VariantPicker.n01`
  - [CardGroup] single-choice group of variant rows `VariantPicker.n02`
  - [Card] selectable in-stock variant row `VariantPicker.n03`
  - [Card] selectable nearly-gone variant row with warning `VariantPicker.n04`
  - [Card] disabled sold-out variant row `VariantPicker.n05`
  - [container] variant name and price column `VariantPicker.n06`
  - [text] the variant glaze and size `VariantPicker.n08`
  - [text] price with stock count `VariantPicker.n09`
  - [container] variant name and price column `VariantPicker.n10`
  - [Tag] warm low-stock warning tag `VariantPicker.n11`
  - [text] the variant glaze and size `VariantPicker.n12`
  - [text] price with stock count `VariantPicker.n13`
  - [container] variant name and price column `VariantPicker.n14`
  - [Tag] clear sold-out tag: Sold out `VariantPicker.n15`
  - [text] the variant glaze and size `VariantPicker.n16`
  - [text] price with stock count `VariantPicker.n17`
- Used on: S02.

### PhotoUploader

Let the owner add piece photos with validation and preview kept for the session.

- Closest existing: Input, FormControl. Why not: Input handles text and url and FormControl wraps labels, neither validates files nor shows image previews.
- Look: A calm upload box with drag and browse affordance, file validation messages, and a row of previews that persist for the session. It is for adding piece photos during creation. It uses soft radius, muted borders and comfortable density. Like the avatar uploader of a profile settings page but for multiple product photos.
- Width: 240 to fill. Box: fill, content, padding 0, gap 4; column gap 6 align stretch.
  - [container] a label group with title and hint `PhotoUploader.n01`
  - [text] the uploader label: Piece photos `PhotoUploader.n02`
  - [text] the file hint: JPG or PNG, up to 5 MB each. `PhotoUploader.n03`
  - [container] a dashed upload dropzone box `PhotoUploader.n04`
  - [media] an upload icon `PhotoUploader.n05`
  - [text] the drag instruction: Drag photos here or browse files. `PhotoUploader.n06`
  - [Button] a browse files button: Browse files `PhotoUploader.n07`
  - [feedback] a file validation message: “mug-glaze.tiff” did not upload. Use JPG or PNG under 5 MB. `PhotoUploader.n08`
  - [container] a row of photo previews `PhotoUploader.n09`
  - [container] a first photo preview with remove control `PhotoUploader.n10`
  - [media] a square preview photo of a speckled mug `PhotoUploader.n11`
  - [IconButton] a remove first photo button `PhotoUploader.n12`
  - [container] a second photo preview with remove control `PhotoUploader.n13`
  - [media] a square preview photo of a glazed bowl `PhotoUploader.n14`
  - [IconButton] a remove second photo button `PhotoUploader.n15`
  - [text] the session persistence note: Photos stay for this session. `PhotoUploader.n16`
- Used on: S13.

## Questions

- Q01 Can a guest order contain several different pieces or variants at once, or one glaze-size line per order? Default: One order contains one variant line only: one piece with one chosen glaze, one size and a quantity. Totals, discount and shipping are calculated for that line.
- Q02 What limits apply to discount values for percentage-off versus fixed-rupees-off codes? Default: Percent is 1 to 90 percent and fixed is 1 to 5000 rupees, never reducing the piece total below zero; shipping free logic uses the total after discount.
