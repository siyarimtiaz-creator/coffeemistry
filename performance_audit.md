# Coffeemistry Performance and Technical SEO Audit

## Initial live-rendering observation — 2026-08-20

The public home page at `https://coffeemenu-juytsaxg.manus.space/` completed client rendering after its initial loading state. Its browser-visible content confirms the existing public navigation, menu links, WhatsApp contact path, hero image alternative text, local address display, internal links, and ordering CTA remain available.

The initial browser response exposes only the SPA shell content before JavaScript completes. This is a material SEO limitation for non-JavaScript crawlers and should be evaluated against a narrowly scoped server-rendering approach for public routes only. No visual or order-flow change has been made during this audit observation.

## Implemented technical improvements

The public app remains client-rendered. Converting this interactive, data-driven ordering application to SSR would add database work to the HTML response path and is not a safe route to the requested low TTFB target on autoscaling hosting. Instead, the release applies short shared-cache revalidation to the public SPA shell, keeps build assets immutable, and preserves noindex behavior for private checkout, order-tracking, and admin routes.

The public menu has a short server-side cache, invalidated immediately by every owner product-media update. The cart drawer is deferred until a customer opens it, public product images now include decoding and display-size hints, and the hero image is explicitly prioritized for LCP.

Technical SEO now includes an absolute canonical URL, Open Graph and Twitter image metadata, corrected Coffeemistry LocalBusiness/Restaurant JSON-LD, absolute robots and sitemap references, and a real noindex 404 response for unknown paths. Production-mode verification confirmed the absence of the Express `X-Powered-By` header, five-minute shared shell revalidation, immutable fingerprinted assets, noindex private routes, and 404 unknown routes.

## Public-flow verification

The optimized preview was checked at desktop and mobile breakpoints for the home page, menu, and empty checkout state. An Espresso Based menu view rendered product cards with their assigned image alternatives and opened the Cappuccino product detail correctly. The detail’s WhatsApp action retained the expected `wa.me/923078263333` destination and encoded order line plus subtotal. No order was submitted during this verification.
