# Jaipur Studio Ceramics Shop: contract

The records the app keeps, the operations its widgets call, and what covers each widget. Every record also has id, createdAt, updatedAt. Sign up, sign in and sign out are built in.

## Entities

### Piece

Implements Piece.

| Field | Kind | Required |
| ----- | ---- | -------- |
| name | string | yes |
| type | enum PieceType | yes |
| basePrice | money | yes |
| description | text | yes |
| photo | url list | yes |

### Variant

Implements Variant.

| Field | Kind | Required |
| ----- | ---- | -------- |
| glazeName | string | yes |
| sizeName | string | yes |
| stockCount | int | yes |
| priceAdjustment | money | no |
| piece | ref Piece | yes |

### Order

Implements Order.

| Field | Kind | Required |
| ----- | ---- | -------- |
| buyerName | string | yes |
| phone | phone | yes |
| fulfilment | enum Fulfilment | yes |
| deliveryAddress | text | no |
| discountCode | string | no |
| pieceTotal | money | yes |
| discountAmount | money | yes |
| shippingCharge | money | yes |
| finalTotal | money | yes |
| status | enum OrderStatus | yes |
| paymentStatus | enum PaymentStatus | yes |
| placedAt | datetime | yes |

### OrderItem

Implements OrderItem.

| Field | Kind | Required |
| ----- | ---- | -------- |
| order | ref Order | yes |
| piece | ref Piece | no |
| variant | ref Variant | no |
| pieceName | string | no |
| glazeName | string | yes |
| sizeName | string | yes |
| quantity | int | yes |
| price | money | yes |

### DiscountCode

Implements DiscountCode.

| Field | Kind | Required |
| ----- | ---- | -------- |
| codeWord | string | yes |
| kind | enum DiscountKind | yes |
| value | decimal | yes |
| startDate | date | yes |
| endDate | date | yes |
| isActive | boolean | yes |

### ShopSetting

Implements ShopSetting.

| Field | Kind | Required |
| ----- | ---- | -------- |
| shopName | string | yes |
| pickupAddress | text | yes |
| pickupInstructions | text | yes |

## Enums

- PieceType: Mug (`mug`), Bowl (`bowl`), Planter (`planter`), Vase (`vase`)
- Fulfilment: Studio Pickup (`studio_pickup`), Courier (`courier`)
- OrderStatus: New (`new`), Packed (`packed`), Shipped (`shipped`), Collected (`collected`), Cancelled (`cancelled`)
- PaymentStatus: Awaiting UPI Payment (`awaiting_upi_payment`), Paid (`paid`)
- DiscountKind: Percentage off (`percentage_off`), Fixed rupees off (`fixed_rupees_off`)

## Operations

| Operation | Kind | Entity | Summary | Inputs | Serves |
| --------- | ---- | ------ | ------- | ------ | ------ |
| listPieces | list | Piece | List pieces for shop front, browse and owner catalogue | none | F01.S01, F01.S02, F02.S01, F02.S02, F05.S02, F08.S01, F09.S01 |
| getPiece | get | Piece | Read one piece detail | none | F02.S03, F03.S01, F08.S02, F09.S02 |
| createPiece | create | Piece | Create a piece | FD06 Piece name as name, FD07 Piece type as type, FD08 Piece base price as basePrice, FD09 Piece description as description, FD10 Piece photo as photo | F07.S02 |
| updatePiece | update | Piece | Update piece details | FD06 Piece name as name, FD07 Piece type as type, FD08 Piece base price as basePrice, FD09 Piece description as description, FD10 Piece photo as photo | F08.S03 |
| deletePiece | delete | Piece | Delete a piece | none | F09.S03 |
| listVariants | list | Variant | List variants with stock for a piece and for low-stock overview | none | F02.S03, F03.S01, F08.S02, F16.S01 |
| getVariant | get | Variant | Read chosen variant for stock check | none | F03.S02 |
| createVariant | create | Variant | Create glaze and size variants | FD11 Glaze name as glazeName, FD12 Size name as sizeName, FD13 Variant stock count as stockCount, FD14 Variant price adjustment as priceAdjustment | F07.S03 |
| updateVariant | update | Variant | Update variant stock on order, edit and cancellation | FD11 Glaze name as glazeName, FD12 Size name as sizeName, FD13 Variant stock count as stockCount, FD14 Variant price adjustment as priceAdjustment | F03.S03, F08.S03, F15.S04 |
| deleteVariant | delete | Variant | Delete variants with their piece | none | F09.S03 |
| listOrders | list | Order | List orders newest first for owner | none | F05.S02, F12.S01, F12.S02, F13.S01, F14.S01, F15.S01, F16.S01 |
| getOrder | get | Order | Read one order detail | none | F12.S03, F13.S02, F14.S02, F15.S02 |
| createOrder | create | Order | Create guest order | FD18 Buyer name as buyerName, FD19 Buyer phone as phone, FD20 Fulfilment choice as fulfilment, FD21 Delivery address as deliveryAddress, FD22 Discount code entered as discountCode | F03.S03 |
| updateOrder | update | Order | Advance fulfilment, mark Paid or cancel order | none | F13.S03, F14.S03, F15.S04 |
| listOrderItems | list | OrderItem | List items of an order | none | F12.S03 |
| createOrderItem | create | OrderItem | Create order line for chosen variant | FD15 Chosen glaze as glazeName, FD16 Chosen size as sizeName, FD17 Quantity as quantity | F03.S03 |
| listDiscountCodes | list | DiscountCode | List discount codes | none | F11.S01 |
| getDiscountCode | get | DiscountCode | Read discount code for validation and detail | none | F03.S02, F11.S02 |
| createDiscountCode | create | DiscountCode | Create discount code | FD23 Discount code word as codeWord, FD24 Discount kind as kind, FD25 Discount value as value, FD26 Discount start date as startDate, FD27 Discount end date as endDate, FD28 Discount active as isActive | F10.S02 |
| updateDiscountCode | update | DiscountCode | Update or deactivate discount code | FD23 Discount code word as codeWord, FD24 Discount kind as kind, FD25 Discount value as value, FD26 Discount start date as startDate, FD27 Discount end date as endDate, FD28 Discount active as isActive | F11.S03 |
| getShopSetting | get | ShopSetting | Read shop settings | none | F01.S01, F17.S01 |
| updateShopSetting | update | ShopSetting | Update shop settings | FD03 Shop name as shopName, FD04 Studio pickup address as pickupAddress, FD05 Pickup instructions as pickupInstructions | F17.S02 |

## Widgets

### W01 Shop front hero (hero)

- Shows ShopSetting (ShopSetting.shopName, ShopSetting.pickupAddress, ShopSetting.pickupInstructions), loaded by getShopSetting.
- At F01.S01, reads ShopSetting and lists Piece: listPieces, getShopSetting.

### W02 Shop pieces grid (cards)

- Shows a list of Piece (Piece.name, Piece.type, Piece.basePrice), loaded by listPieces.
- Shows Variant (Variant.stockCount), loaded by listVariants.
- At F01.S02, lists Piece: listPieces.
- At F02.S01, lists Piece: listPieces.
- At F02.S02, lists Piece: listPieces.

### W03 Shop footer (footer)

- Shows ShopSetting (ShopSetting.pickupAddress, ShopSetting.pickupInstructions), loaded by getShopSetting.

### W04 Piece purchase detail (detail)

- Shows Piece (Piece.name, Piece.type, Piece.basePrice, Piece.description, Piece.photo), loaded by getPiece.
- Shows Variant (Variant.glazeName, Variant.sizeName, Variant.stockCount, Variant.priceAdjustment), loaded by listVariants.
- At F02.S03, reads Piece and lists Variant: getPiece, listVariants.
- At F03.S01, reads Piece and lists Variant: getPiece, listVariants.

### W05 Checkout form (form)

- Shows Variant (Variant.glazeName, Variant.sizeName, Variant.stockCount), loaded by getVariant.
- Shows Order (Order.buyerName, Order.phone, Order.fulfilment, Order.deliveryAddress, Order.pieceTotal, Order.discountAmount, Order.shippingCharge, Order.finalTotal), typed in by the user and saved by createOrder.
- Shows DiscountCode (DiscountCode.codeWord), loaded by getDiscountCode.
- Asks for FD15 Chosen glaze, which goes to createOrderItem.
- Asks for FD16 Chosen size, which goes to createOrderItem.
- Asks for FD17 Quantity, which goes to createOrderItem.
- Asks for FD18 Buyer name, which goes to createOrder.
- Asks for FD19 Buyer phone, which goes to createOrder.
- Asks for FD20 Fulfilment choice, which goes to createOrder.
- Asks for FD21 Delivery address, which goes to createOrder.
- Asks for FD22 Discount code entered, which goes to createOrder.
- At F03.S02, reads Variant and reads DiscountCode: getVariant, getDiscountCode.

### W06 Order review receipt (detail)

- Shows Order (Order.buyerName, Order.phone, Order.fulfilment, Order.deliveryAddress, Order.pieceTotal, Order.discountAmount, Order.shippingCharge, Order.finalTotal, Order.status, Order.paymentStatus), loaded by getOrder.
- Shows OrderItem (OrderItem.quantity, OrderItem.price), loaded by listOrderItems.
- Shows ShopSetting (ShopSetting.pickupAddress, ShopSetting.pickupInstructions), loaded by getShopSetting.
- At F03.S03, creates Order and creates OrderItem and updates Variant: updateVariant, createOrder, createOrderItem.

### W07 Owner signup form (auth-form)

- Asks for FD01 Owner email, which goes to the built-in sign up.
- Asks for FD02 Owner password, which goes to the built-in sign up.

### W08 Owner signin form (auth-form)

- Shows Order (Order.status), loaded by listOrders.
- Shows Piece (Piece.name), loaded by listPieces.
- Asks for FD01 Owner email, which goes to the built-in sign in.
- Asks for FD02 Owner password, which goes to the built-in sign in.
- At F05.S02, lists Order and lists Piece: listPieces, listOrders.

### W09 Dashboard stats (stats)

- Shows Order (Order.status, Order.paymentStatus), loaded by listOrders.
- Shows Variant (Variant.stockCount), loaded by listVariants.
- At F16.S01, lists Order and lists Variant: listVariants, listOrders.

### W10 Low-stock variants table (table)

- Shows a list of Variant (Variant.glazeName, Variant.sizeName, Variant.stockCount), loaded by listVariants.
- Shows Piece (Piece.name), loaded by listPieces.
- At F16.S01, lists Order and lists Variant: listVariants, listOrders.

### W11 Recent orders preview (list)

- Shows a list of Order (Order.buyerName, Order.status, Order.paymentStatus, Order.finalTotal), loaded by listOrders.
- At F16.S01, lists Order and lists Variant: listVariants, listOrders.

### W12 Catalogue header (page-header)

- Opens other screens or shows fixed content; it calls nothing.

### W13 Catalogue pieces grid (cards)

- Shows a list of Piece (Piece.name, Piece.type, Piece.basePrice, Piece.photo), loaded by listPieces.
- Shows Variant (Variant.stockCount), loaded by listVariants.
- At F08.S01, lists Piece: listPieces.
- At F09.S01, lists Piece: listPieces.

### W14 Owner piece header (page-header)

- Shows Piece (Piece.name), loaded by getPiece.
- At F08.S02, reads Piece and lists Variant: getPiece, listVariants.
- At F09.S02, reads Piece: getPiece.

### W15 Piece edit form (form)

- Shows Piece (Piece.name, Piece.type, Piece.basePrice, Piece.description, Piece.photo), loaded by getPiece.
- Asks for FD06 Piece name, which goes to updatePiece.
- Asks for FD07 Piece type, which goes to updatePiece.
- Asks for FD08 Piece base price, which goes to updatePiece.
- Asks for FD09 Piece description, which goes to updatePiece.
- Asks for FD10 Piece photo, which goes to updatePiece.
- Asks for FD11 Glaze name, which goes to updateVariant.
- Asks for FD12 Size name, which goes to updateVariant.
- Asks for FD13 Variant stock count, which goes to updateVariant.
- Asks for FD14 Variant price adjustment, which goes to updateVariant.
- At F08.S03, updates Piece and updates Variant: updatePiece, updateVariant.

### W16 Piece variants table (table)

- Shows a list of Variant (Variant.glazeName, Variant.sizeName, Variant.stockCount, Variant.priceAdjustment), loaded by listVariants.
- Asks for FD06 Piece name, which goes to updatePiece.
- Asks for FD07 Piece type, which goes to updatePiece.
- Asks for FD08 Piece base price, which goes to updatePiece.
- Asks for FD09 Piece description, which goes to updatePiece.
- Asks for FD10 Piece photo, which goes to updatePiece.
- Asks for FD11 Glaze name, which goes to updateVariant.
- Asks for FD12 Size name, which goes to updateVariant.
- Asks for FD13 Variant stock count, which goes to updateVariant.
- Asks for FD14 Variant price adjustment, which goes to updateVariant.
- At F08.S02, reads Piece and lists Variant: getPiece, listVariants.
- At F08.S03, updates Piece and updates Variant: updatePiece, updateVariant.

### W17 Orders table (table)

- Shows a list of Order (Order.buyerName, Order.phone, Order.fulfilment, Order.finalTotal, Order.status, Order.paymentStatus), loaded by listOrders.
- At F12.S01, lists Order: listOrders.
- At F12.S02, lists Order: listOrders.
- At F13.S01, lists Order: listOrders.
- At F14.S01, lists Order: listOrders.
- At F15.S01, lists Order: listOrders.

### W18 Order detail (detail)

- Shows Order (Order.buyerName, Order.phone, Order.fulfilment, Order.deliveryAddress, Order.pieceTotal, Order.discountAmount, Order.shippingCharge, Order.finalTotal, Order.status, Order.paymentStatus, Order.placedAt), loaded by getOrder.
- Shows OrderItem (OrderItem.quantity, OrderItem.price), loaded by listOrderItems.
- At F12.S03, reads Order and lists OrderItem: getOrder, listOrderItems.
- At F13.S02, reads Order: getOrder.
- At F13.S03, updates Order: updateOrder.
- At F14.S02, reads Order: getOrder.
- At F14.S03, updates Order: updateOrder.
- At F15.S02, reads Order: getOrder.

### W19 Discount header (page-header)

- Opens other screens or shows fixed content; it calls nothing.

### W20 Discount codes table (table)

- Shows a list of DiscountCode (DiscountCode.codeWord, DiscountCode.kind, DiscountCode.value, DiscountCode.startDate, DiscountCode.endDate, DiscountCode.isActive), loaded by listDiscountCodes.
- At F11.S01, lists DiscountCode: listDiscountCodes.

### W21 Add piece form (form)

- Shows Piece (Piece.name, Piece.type, Piece.basePrice, Piece.description, Piece.photo), typed in by the user and saved by createPiece.
- Asks for FD06 Piece name, which goes to createPiece.
- Asks for FD07 Piece type, which goes to createPiece.
- Asks for FD08 Piece base price, which goes to createPiece.
- Asks for FD09 Piece description, which goes to createPiece.
- Asks for FD10 Piece photo, which goes to createPiece.
- At F07.S02, creates Piece: createPiece.

### W22 Variant form (form)

- Shows Variant (Variant.glazeName, Variant.sizeName, Variant.stockCount, Variant.priceAdjustment), typed in by the user and saved by createVariant.
- Asks for FD11 Glaze name, which goes to createVariant.
- Asks for FD12 Size name, which goes to createVariant.
- Asks for FD13 Variant stock count, which goes to createVariant.
- Asks for FD14 Variant price adjustment, which goes to createVariant.
- At F07.S03, creates Variant: createVariant.

### W23 Delete piece confirm (custom)

- Shows Piece (Piece.name), loaded by getPiece.
- At F09.S03, deletes Piece and deletes Variant: deletePiece, deleteVariant.
- Part of STD01, which runs for F09.S03 (deletePiece, deleteVariant).

### W24 Discount code form (form)

- Shows DiscountCode (DiscountCode.codeWord, DiscountCode.kind, DiscountCode.value, DiscountCode.startDate, DiscountCode.endDate, DiscountCode.isActive), loaded by getDiscountCode.
- Asks for FD23 Discount code word, which goes to updateDiscountCode.
- Asks for FD24 Discount kind, which goes to updateDiscountCode.
- Asks for FD25 Discount value, which goes to updateDiscountCode.
- Asks for FD26 Discount start date, which goes to updateDiscountCode.
- Asks for FD27 Discount end date, which goes to updateDiscountCode.
- Asks for FD28 Discount active, which goes to updateDiscountCode.
- At F10.S02, creates DiscountCode: createDiscountCode.
- At F11.S02, reads DiscountCode: getDiscountCode.
- At F11.S03, updates DiscountCode: updateDiscountCode.

### W25 Cancel order confirm (custom)

- Shows Order (Order.status), loaded by getOrder.
- Shows Variant (Variant.stockCount), loaded by getVariant.
- At F15.S04, updates Order and updates Variant: updateVariant, updateOrder.

### W26 Shop settings form (form)

- Shows ShopSetting (ShopSetting.shopName, ShopSetting.pickupAddress, ShopSetting.pickupInstructions), loaded by getShopSetting.
- Asks for FD03 Shop name, which goes to updateShopSetting.
- Asks for FD04 Studio pickup address, which goes to updateShopSetting.
- Asks for FD05 Pickup instructions, which goes to updateShopSetting.
- At F17.S01, reads ShopSetting: getShopSetting.
- At F17.S02, updates ShopSetting: updateShopSetting.

### W27 Shop preview (detail)

- Shows ShopSetting (ShopSetting.shopName, ShopSetting.pickupAddress, ShopSetting.pickupInstructions), loaded by getShopSetting.
- Asks for FD03 Shop name, which goes to updateShopSetting.
- Asks for FD04 Studio pickup address, which goes to updateShopSetting.
- Asks for FD05 Pickup instructions, which goes to updateShopSetting.
- At F17.S01, reads ShopSetting: getShopSetting.
- At F17.S02, updates ShopSetting: updateShopSetting.
