# Coffeemistry Internal Validation Report

## Data integrity

The persistent catalog contains **24 unique products** across the six confirmed categories. The seeded category distribution is preserved exactly: Espresso Based (11), Slow Bar (4), Sandwiches (2), Desserts (3), Beverages (2), and Bakery Items (2). The public catalog stores all prices as PKR integers, preserves the supplied source descriptions and supplied sizes, and guards unique category and product slugs at the database layer.

| Validation item | Result |
| --- | --- |
| Confirmed catalog count | 24 products / 24 unique slugs |
| Category count | 6 categories |
| Required address display | `F-8/1, Islamabad.` |
| Full business address | `Shop 1 & 2, Block 8 Allahwali Market, F-8/1, F-8, Islamabad, 44000, Pakistan` |
| Phone / WhatsApp source number | `+92 307 8263333` / `923078263333` |
| Rating / review count | `4.4` / `469` |
| No unsupported delivery fee | Delivery remains unconfigured and is communicated as calculated at checkout |
| No invented payment gateway | Only enabled owner-configured methods are exposed |

## Functional checks

The customer journey supports menu browse and search, category filtering, local favorites, persistent cart management, guest checkout, dynamic WhatsApp order messages, configurable payment-method selection, server-validated order creation, and customer tracking by order number plus phone number. The owner workspace is protected both visually and on the server using the `admin` role. Order state transitions are restricted to the exact sequence **pending → preparing → ready**.

| Automated or visual check | Result |
| --- | --- |
| TypeScript validation | Passed |
| Unit, procedure, persisted-menu integration, and payment visibility tests | 12 tests passed across 6 suites |
| Production build | Passed |
| Desktop review | Homepage, menu, checkout, visit, and owner route reviewed |
| Mobile review | Homepage, menu, checkout, and visit reviewed at 375 px width |
| Owner-only protection | Non-admin server access is rejected; tested |
| Delivery address validation | Missing delivery address is rejected before persistence; tested |
| Owner payment configuration | Reviewed in the owner dashboard; methods can be added, edited, enabled, or hidden; no enabled method exists until the owner configures one |
| Payment visibility guard | Automated enable → hide → enable behavior verified without persisting an assumed business payment method |

The owner-to-checkout visibility workflow was exercised in an isolated in-memory test store: an owner configured a temporary method, public checkout received it while enabled, public checkout omitted it while hidden, and received it again after re-enabling. No test payment method was written to the project database.

> The validation suite deliberately does not submit a synthetic customer order to the live project database. This preserves the owner’s real order queue. The public create and tracking procedures are exercised with controlled test doubles, while the persisted menu catalog is checked against the live database.

## Configurable fields intentionally not assumed

Opening hours, delivery zones and charges, payment methods, the canonical production domain, social links, policies, official photography, and official brand assets remain configurable because no confirmed values were supplied. The embedded map and direction action target the supplied full cafe address.
