# Product Image Regression Diagnosis

## Initial deployed-menu reproduction

The deployed `/menu` route renders all observed catalog cards with the existing text fallback: “Product image” and “Photography placeholder · [product name]”. The public page exposes no browser-console errors at the time of inspection. This indicates that the active product records reach the client, but their media collections resolve as empty or lack a renderable primary-image URL; it is not currently an observed client-side JavaScript exception.

## Source-deployment comparison

The source Coffeemistry deployment still serves real product assets successfully. Representative asset URLs are deployed-site-relative `/manus-storage/...` images and report successful natural image dimensions in the browser. The source’s rendered cards therefore have valid image URLs, whereas the independent copy’s menu returns the placeholder branch before any network image request can occur.

## Confirmed root cause

The copied project’s database began without data. Its `ensureCafeSeed` routine restores the 24 catalog products but deliberately does not restore `productImages` records or legacy product `imageUrl` values. The Reviews change only added a route-scoped reviews data module and rewrote the editorial page; it did not change the product-image component, catalog media mapping, global CSS, storage configuration, or product database query. This is a missing copied-media-data condition rather than a Reviews-page regression.

## Storage-domain validation

Requesting a known source image through the copied deployment’s `/manus-storage/` path redirects to the copied project’s storage namespace and returns `AccessDenied`. The source deployment serves the same path successfully because it belongs to the source project’s storage namespace. Existing source images must therefore be copied into this project’s approved static storage and registered against the copied catalog; simply reusing source-relative paths would continue to fail with an access error.

## Restoration verification

All 24 verified existing source photos were copied into this project’s approved static-storage namespace and registered as the primary media record for their matching catalog product. The local public-menu response now exposes a valid `/manus-storage/` URL and meaningful image alt text for every product. Browser inspection reports 24 product-image elements, 12 currently loaded, and no completed image element with zero natural width; the remaining images use intentional lazy loading and have not been requested until they approach the viewport.

After exercising the Menu page’s lazy-loading path, all 24 product-image elements completed with a positive natural image width. No image element failed, remained pending, or returned a zero-width result. This confirms the restored media URLs load successfully in the browser rather than falling back because of a 404, 403, CORS issue, or client-side rendering error.

The desktop menu visual check confirms the existing card design remains unchanged and restored source photography renders on affected cards, including Cappuccino, Cortado, Espresso, Flat White, Iced Latte, and Iced Mocha. No fallback “Photography placeholder” card is present in the rendered menu response.

The existing Cappuccino product-detail control opens successfully and renders the same restored Cappuccino asset with its expected alt text. This confirms the card and detail surfaces consume the restored primary product-media relation consistently.

The restored-image detail view remains operational. A browser-automation click on its existing “Add to cart” control did not change the visible cart count in that initial check, so the cart state will be verified directly before release. No product-image rendering failure occurred during this interaction.

Direct state verification confirms the existing Cappuccino detail flow persisted one restored-image product to the cart, updated the header count to one item, and rendered the existing cart drawer with the correct product, quantity, and PKR 700 subtotal. The unchanged “Continue to checkout” route is available from that cart state.

The unchanged checkout route receives the restored-image Cappuccino cart line and resolves the server-calculated pickup subtotal and total to PKR 700. No order was submitted and no customer data was entered during this validation.
