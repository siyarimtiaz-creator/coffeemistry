# Coffeemistry Product Photography QA

The website contains no substituted, generated, or temporary product photography. Until the owner uploads confirmed Coffeemistry product photos, product cards, the featured Spanish Latte surface, and product detail display a branded **Product image** placeholder. Owner uploads use the first-party storage integration and supersede the placeholder automatically.

| Area | Validation outcome |
| --- | --- |
| Owner media access | The `/admin` and `/admin/orders` owner dashboard routes render the product-photography workspace beneath the live order queue. The non-admin server path is covered by tests. |
| Supported uploads | JPG, PNG, and WebP are accepted; client optimization produces responsive WebP display and menu-card variants. Oversized, malformed, and unsupported uploads are rejected before storage. |
| Image lifecycle | Primary selection, gallery ordering, atomic replacement, deletion, and deterministic primary fallback are covered by owner procedure and helper tests. |
| Public presentation | Menu cards lazy-load thumbnail variants when available; featured and detail views use the primary display image; otherwise they render the branded product-image placeholder. Meaningful alt text defaults to the product name plus Coffeemistry location. |
| Product detail | The responsive modal provides thumbnails, keyboard arrows, touch swipe handling, previous/next controls, and a fullscreen image view when a gallery exists. |
| Mobile layouts | Homepage, placeholder-led menu cards, checkout empty state, and order lookup feedback were reviewed at 375 × 812 px. The no-photo fallback remains legible and ordering remains available. |

The final automated suite passed **29 tests** across 9 files, with a successful production build. Server tests include byte-signature and dimension validation, malformed and unsupported data URLs, oversize payloads, unsafe filename rejection, owner-only access, atomic replacement, deletion, ordering, and primary-image fallback. No synthetic customer order or unapproved product photo was added to the persistent business database.

> The public mobile gallery, swipe, and fullscreen controls are implemented and covered at the component and route level. A live visual gallery interaction can occur only after the owner uploads at least two authentic Coffeemistry photographs for one product; the current real-data state correctly presents the product-image placeholder instead of inserting fabricated imagery.

> **Deferred end-to-end verification:** The final browser-based owner replacement and immediate public-update check requires both an authenticated Coffeemistry owner session and an authentic Coffeemistry product photograph. Neither was available during this cleanup. This validation was not simulated with a stock, generated, placeholder, or test image, and remains the first operational check to perform when authentic photography is supplied.
