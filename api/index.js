// server/vercelApi.ts
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";
var OAUTH_STATE_COOKIE = "__Host-oauth_state";
var decodeOAuthState = (state) => {
  let decoded;
  try {
    decoded = atob(state);
  } catch {
    return { redirectUri: "" };
  }
  try {
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed.redirectUri === "string") return parsed;
  } catch {
  }
  return { redirectUri: decoded };
};

// server/_core/oauth.ts
import { parse as parseCookieHeader2 } from "cookie";

// server/db.ts
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";

// drizzle/schema.ts
import {
  boolean,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar
} from "drizzle-orm/mysql-core";
var users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  sortOrder: int("sortOrder").notNull(),
  isEnabled: boolean("isEnabled").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var products = mysqlTable(
  "products",
  {
    id: int("id").autoincrement().primaryKey(),
    categoryId: int("categoryId").notNull().references(() => categories.id),
    slug: varchar("slug", { length: 120 }).notNull().unique(),
    name: varchar("name", { length: 160 }).notNull(),
    description: text("description").notNull(),
    size: varchar("size", { length: 80 }),
    pricePkr: int("pricePkr").notNull(),
    imageUrl: text("imageUrl"),
    isAvailable: boolean("isAvailable").default(true).notNull(),
    isFeatured: boolean("isFeatured").default(false).notNull(),
    customizationsEnabled: boolean("customizationsEnabled").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
  },
  (table) => [index("products_category_idx").on(table.categoryId)]
);
var productImages = mysqlTable(
  "productImages",
  {
    id: int("id").autoincrement().primaryKey(),
    productId: int("productId").notNull().references(() => products.id),
    storageKey: text("storageKey").notNull(),
    url: text("url").notNull(),
    originalFilename: varchar("originalFilename", { length: 255 }),
    thumbnailStorageKey: text("thumbnailStorageKey"),
    thumbnailUrl: text("thumbnailUrl"),
    altText: varchar("altText", { length: 260 }).notNull(),
    caption: varchar("caption", { length: 500 }),
    mimeType: varchar("mimeType", { length: 100 }).notNull(),
    width: int("width"),
    height: int("height"),
    byteSize: int("byteSize"),
    processingStatus: varchar("processingStatus", { length: 32 }).default("ready").notNull(),
    imageType: varchar("imageType", { length: 64 }).default("owner_product_photo").notNull(),
    source: varchar("source", { length: 64 }).default("owner_upload").notNull(),
    replacementAllowed: boolean("replacementAllowed").default(true).notNull(),
    isPrimary: boolean("isPrimary").default(false).notNull(),
    sortOrder: int("sortOrder").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
  },
  (table) => [index("product_images_product_idx").on(table.productId, table.sortOrder)]
);
var productOptionGroups = mysqlTable("productOptionGroups", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull().references(() => products.id),
  label: varchar("label", { length: 100 }).notNull(),
  choiceType: mysqlEnum("choiceType", ["single", "multiple"]).default("single").notNull(),
  isRequired: boolean("isRequired").default(false).notNull(),
  sortOrder: int("sortOrder").default(0).notNull()
});
var productOptions = mysqlTable("productOptions", {
  id: int("id").autoincrement().primaryKey(),
  optionGroupId: int("optionGroupId").notNull().references(() => productOptionGroups.id),
  label: varchar("label", { length: 100 }).notNull(),
  pricePkrDelta: int("pricePkrDelta").default(0).notNull(),
  isAvailable: boolean("isAvailable").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull()
});
var businessSettings = mysqlTable("businessSettings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 40 }).notNull().unique(),
  businessName: varchar("businessName", { length: 160 }).notNull(),
  shortAddress: varchar("shortAddress", { length: 200 }).notNull(),
  fullAddress: text("fullAddress").notNull(),
  phone: varchar("phone", { length: 40 }).notNull(),
  whatsapp: varchar("whatsapp", { length: 40 }).notNull(),
  openingHours: text("openingHours"),
  estimatedOrderTime: varchar("estimatedOrderTime", { length: 140 }),
  rating: varchar("rating", { length: 12 }).notNull(),
  reviewCount: int("reviewCount").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var paymentMethods = mysqlTable("paymentMethods", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 40 }).notNull().unique(),
  label: varchar("label", { length: 100 }).notNull(),
  description: varchar("description", { length: 180 }).notNull(),
  methodType: mysqlEnum("methodType", ["cash_on_delivery", "online", "other"]).notNull(),
  isEnabled: boolean("isEnabled").default(false).notNull(),
  requiresReference: boolean("requiresReference").default(false).notNull(),
  providerKey: varchar("providerKey", { length: 80 }),
  providerStatus: varchar("providerStatus", { length: 40 }).default("not_configured").notNull(),
  receivingNumber: varchar("receivingNumber", { length: 80 }),
  accountTitle: varchar("accountTitle", { length: 160 }),
  instructions: text("instructions"),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  name: varchar("name", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 40 }).notNull(),
  whatsapp: varchar("whatsapp", { length: 40 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var customerAddresses = mysqlTable("customerAddresses", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull().references(() => customers.id),
  address: text("address").notNull(),
  area: varchar("area", { length: 100 }),
  instructions: text("instructions"),
  isDefault: boolean("isDefault").default(false).notNull()
});
var orders = mysqlTable(
  "orders",
  {
    id: int("id").autoincrement().primaryKey(),
    orderNumber: varchar("orderNumber", { length: 24 }).notNull().unique(),
    customerId: int("customerId").references(() => customers.id),
    customerName: varchar("customerName", { length: 160 }).notNull(),
    phone: varchar("phone", { length: 40 }).notNull(),
    whatsapp: varchar("whatsapp", { length: 40 }),
    orderType: mysqlEnum("orderType", ["pickup", "delivery"]).notNull(),
    deliveryAddress: text("deliveryAddress"),
    area: varchar("area", { length: 100 }),
    deliveryInstructions: text("deliveryInstructions"),
    notes: text("notes"),
    subtotalPkr: int("subtotalPkr").notNull(),
    discountPkr: int("discountPkr").default(0).notNull(),
    deliveryFeePkr: int("deliveryFeePkr"),
    totalPkr: int("totalPkr"),
    paymentMethodLabel: varchar("paymentMethodLabel", { length: 100 }),
    paymentStatus: varchar("paymentStatus", { length: 40 }),
    status: mysqlEnum("status", ["new", "confirmed", "preparing", "ready", "out_for_delivery", "completed", "cancelled"]).default("new").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
  },
  (table) => [index("orders_status_created_idx").on(table.status, table.createdAt)]
);
var orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull().references(() => orders.id),
  productId: int("productId").references(() => products.id),
  productName: varchar("productName", { length: 160 }).notNull(),
  productDescription: text("productDescription").notNull(),
  productSize: varchar("productSize", { length: 80 }),
  unitPricePkr: int("unitPricePkr").notNull(),
  quantity: int("quantity").notNull(),
  customizationsJson: text("customizationsJson")
});
var orderPayments = mysqlTable(
  "orderPayments",
  {
    id: int("id").autoincrement().primaryKey(),
    orderId: int("orderId").notNull().references(() => orders.id).unique(),
    paymentMethodId: int("paymentMethodId").references(() => paymentMethods.id),
    paymentMethodCode: varchar("paymentMethodCode", { length: 40 }).notNull(),
    paymentMethodLabel: varchar("paymentMethodLabel", { length: 100 }).notNull(),
    status: varchar("status", { length: 40 }).default("unpaid").notNull(),
    transactionReference: varchar("transactionReference", { length: 160 }),
    amountPkr: int("amountPkr").notNull(),
    currency: varchar("currency", { length: 3 }).default("PKR").notNull(),
    screenshotStorageKey: text("screenshotStorageKey"),
    screenshotUrl: text("screenshotUrl"),
    receiptAccessTokenHash: varchar("receiptAccessTokenHash", { length: 128 }),
    receiptMimeType: varchar("receiptMimeType", { length: 100 }),
    receiptByteSize: int("receiptByteSize"),
    providerKey: varchar("providerKey", { length: 80 }),
    providerTransactionId: varchar("providerTransactionId", { length: 200 }),
    verifiedBy: int("verifiedBy").references(() => users.id),
    verifiedAt: timestamp("verifiedAt"),
    verificationNote: text("verificationNote"),
    rejectedBy: int("rejectedBy").references(() => users.id),
    rejectedAt: timestamp("rejectedAt"),
    rejectionReason: text("rejectionReason"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
  },
  (table) => [index("order_payments_status_idx").on(table.status, table.createdAt)]
);
var orderStatusHistory = mysqlTable("orderStatusHistory", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull().references(() => orders.id),
  status: mysqlEnum("status", ["new", "confirmed", "preparing", "ready", "out_for_delivery", "completed", "cancelled"]).notNull(),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var favorites = mysqlTable(
  "favorites",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id),
    productId: int("productId").notNull().references(() => products.id),
    createdAt: timestamp("createdAt").defaultNow().notNull()
  },
  (table) => [uniqueIndex("favorites_user_product_idx").on(table.userId, table.productId)]
);

// server/cafeSeed.ts
var CAFE_CATEGORIES = [
  { slug: "espresso-based", name: "Espresso Based", sortOrder: 1 },
  { slug: "slow-bar", name: "Slow Bar", sortOrder: 2 },
  { slug: "sandwiches", name: "Sandwiches", sortOrder: 3 },
  { slug: "desserts", name: "Desserts", sortOrder: 4 },
  { slug: "beverages", name: "Beverages", sortOrder: 5 },
  { slug: "bakery-items", name: "Bakery Items", sortOrder: 6 }
];
var CAFE_PRODUCTS = [
  { categorySlug: "espresso-based", slug: "espresso", name: "Espresso", size: "1.5 Oz.", description: "Liquid gold", pricePkr: 450 },
  { categorySlug: "espresso-based", slug: "piccolo", name: "Piccolo", size: "3 Oz.", description: "A baby latte", pricePkr: 530 },
  { categorySlug: "espresso-based", slug: "cortado", name: "Cortado", size: "4 Oz.", description: "A more concentrated latte", pricePkr: 630 },
  { categorySlug: "espresso-based", slug: "cappuccino", name: "Cappuccino", size: "8 Oz.", description: "The OG milk drink", pricePkr: 700 },
  { categorySlug: "espresso-based", slug: "latte", name: "Latte", size: "8 Oz.", description: "Creamy milky goodness", pricePkr: 700 },
  { categorySlug: "espresso-based", slug: "flat-white", name: "Flat White", size: "8 Oz.", description: "The greatest kiwi gift to coffee", pricePkr: 700 },
  { categorySlug: "espresso-based", slug: "mocha", name: "Mocha", size: "8 Oz.", description: "A delicious blend of chocolate & coffee", pricePkr: 750 },
  { categorySlug: "espresso-based", slug: "spanish-latte", name: "Spanish Latte", size: "8 Oz.", description: "A sweeter & creamier latte", pricePkr: 750 },
  { categorySlug: "espresso-based", slug: "iced-latte", name: "Iced Latte", size: "12 Oz.", description: "The perfect summer coffee", pricePkr: 750 },
  { categorySlug: "espresso-based", slug: "iced-spanish-latte", name: "Iced Spanish Latte", size: "12 Oz.", description: "An iced & irresistable treat", pricePkr: 830 },
  { categorySlug: "espresso-based", slug: "iced-mocha", name: "Iced Mocha", size: "12 Oz.", description: "Iced chocolaty heaven", pricePkr: 830 },
  { categorySlug: "slow-bar", slug: "iced-aeropress-coffee", name: "Iced Aeropress Coffee", size: null, description: "Cafe style pressure brewed coffee featuring a refreshing and aromatic flavor profile.", pricePkr: 630 },
  { categorySlug: "slow-bar", slug: "signature-aeropress-coffee", name: "Signature Aeropress Coffee", size: null, description: "A single origin coffee that shines in pour over methods", pricePkr: 650 },
  { categorySlug: "slow-bar", slug: "iced-v60-coffee", name: "Iced V60 Coffee", size: null, description: "V60 over ice", pricePkr: 880 },
  { categorySlug: "slow-bar", slug: "signature-v60-coffee", name: "Signature V60 Coffee", size: null, description: "A single origin coffee that shines in pour over methods", pricePkr: 880 },
  { categorySlug: "sandwiches", slug: "roasted-chicken-sandwich", name: "Roasted Chicken Sandwich", size: null, description: "Superbly seasoned chicken on sourdough", pricePkr: 850 },
  { categorySlug: "sandwiches", slug: "roasted-beef-sandwich", name: "Roasted Beef Sandwich", size: null, description: "Roast beef on Sourdough bread", pricePkr: 850 },
  { categorySlug: "desserts", slug: "brownie", name: "Brownie", size: null, description: "Rich, fudgy chocolate treat, often topped with nuts or served with ice cream.", pricePkr: 500 },
  { categorySlug: "desserts", slug: "apple-pie", name: "Apple Pie", size: null, description: "A sweet pastry filled with spiced apples, baked until golden and served warm.", pricePkr: 500 },
  { categorySlug: "desserts", slug: "lemon-cake", name: "Lemon Cake", size: null, description: "Moist, tangy cake topped with a sweet, zesty lemon glaze for a refreshing treat.", pricePkr: 240 },
  { categorySlug: "beverages", slug: "iced-chocolate", name: "Iced Chocolate", size: "12 Oz.", description: "Iced chocolaty heaven", pricePkr: 680 },
  { categorySlug: "beverages", slug: "hot-chocolate", name: "Hot Chocolate", size: "8 Oz.", description: "Creamy rich concoction of the finest chocolate & milk", pricePkr: 630 },
  { categorySlug: "bakery-items", slug: "signature-cookies", name: "Signature Cookies", size: null, description: "Nutella, Lotus and Marshmellows", pricePkr: 350 },
  { categorySlug: "bakery-items", slug: "classic-cookies", name: "Classic Cookies", size: null, description: "Goeey Cookies", pricePkr: 300 }
];
var CAFE_BUSINESS = {
  key: "primary",
  businessName: "Coffeemistry",
  shortAddress: "F-8/1, Islamabad.",
  fullAddress: "Shop 1 & 2, Block 8 Allahwali Market, F-8/1, F-8, Islamabad, 44000, Pakistan",
  phone: "+92 307 8263333",
  whatsapp: "923078263333",
  rating: "Unpublished",
  reviewCount: 0
};

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/db.ts
var PRODUCT_IMAGE_MAP = {
  "espresso": "coffeemistry-espresso-source_cc8e27e8_e31ccd42.jpg",
  "piccolo": "coffeemistry-piccolo-source_abd39424_d7ed3cc9.jpg",
  "cortado": "coffeemistry-cortado-source_70c74d69_bacbf89b.jpg",
  "cappuccino": "coffeemistry-cappuccino-source_5fec7cc8_f3bc18b4.jpg",
  "latte": "coffeemistry-latte-source_879058dd_cf19af5c.jpg",
  "flat-white": "coffeemistry-flat-white-source_75a7d03a_5483aed4.jpg",
  "mocha": "coffeemistry-mocha-corrected_466d8001_84087876.jpg",
  "spanish-latte": "coffeemistry-spanish-latte-corrected_a541348d_c28c1697.jpg",
  "iced-latte": "coffeemistry-iced-latte-source_a8bfc044_1393e43d.jpg",
  "iced-spanish-latte": "coffeemistry-iced-spanish-latte-corrected_a4a5b1b6_2fb43ff5.jpg",
  "iced-mocha": "coffeemistry-iced-mocha-source_cfd3533b_553ed842.jpg",
  "iced-aeropress-coffee": "coffeemistry-iced-aeropress-source_3015c5d1_85de22bf.jpg",
  "signature-aeropress-coffee": "coffeemistry-signature-aeropress-source_9d58be52_3af9d55a.jpg",
  "iced-v60-coffee": "coffeemistry-iced-v60-source_ea91f5e7_53f08d8e.jpg",
  "signature-v60-coffee": "coffeemistry-signature-v60-source_53349e0f_bd8ec240.jpg",
  "roasted-chicken-sandwich": "coffeemistry-roasted-chicken-sandwich-source_2de1ba82_40219782.jpg",
  "roasted-beef-sandwich": "coffeemistry-roasted-beef-sandwich_0e26bf8a_f1b3ffb1.jpg",
  "brownie": "coffeemistry-brownie_50f718cd_8d1032d2.jpg",
  "apple-pie": "coffeemistry-apple-pie_595b376b_cde28dd3.jpg",
  "lemon-cake": "coffeemistry-lemon-cake-corrected_5c7d713e_245f2591.jpg",
  "iced-chocolate": "coffeemistry-iced-chocolate_6ed75437_63b55e77.jpg",
  "hot-chocolate": "coffeemistry-hot-chocolate_7f83e6e3_ea6483a8.jpg",
  "signature-cookies": "coffeemistry-signature-cookies-corrected_9b132f1a_2bafd13f.jpg",
  "classic-cookies": "coffeemistry-classic-cookies_f8a2d54a_e9c839b8.jpg"
};
var _db = null;
var PUBLIC_MENU_CACHE_TTL_MS = 6e4;
var publicMenuCache = null;
var memoryOrders = [];
var nextMemoryOrderId = 1;
function buildStaticFallbackMenu() {
  const categorySlugMap = new Map(CAFE_CATEGORIES.map((c, i) => [c.slug, { id: i + 1, name: c.name, slug: c.slug, sortOrder: c.sortOrder, isEnabled: true, createdAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() }]));
  let prodId = 1;
  const productsByCategory = /* @__PURE__ */ new Map();
  for (const cat of CAFE_CATEGORIES) {
    productsByCategory.set(cat.slug, []);
  }
  for (const p of CAFE_PRODUCTS) {
    const cat = categorySlugMap.get(p.categorySlug);
    const filename = PRODUCT_IMAGE_MAP[p.slug] || `${p.slug}.jpg`;
    const url = `/manus-storage/${filename}`;
    const altText = `${p.name} at Coffeemistry, F-8/1, Islamabad`;
    const imageRecord = {
      id: prodId,
      productId: prodId,
      storageKey: filename,
      url,
      originalFilename: filename,
      thumbnailStorageKey: null,
      thumbnailUrl: url,
      altText,
      caption: null,
      mimeType: "image/jpeg",
      width: 800,
      height: 800,
      byteSize: 1e5,
      processingStatus: "ready",
      imageType: "owner_product_photo",
      source: "owner_upload",
      replacementAllowed: true,
      isPrimary: true,
      sortOrder: 0,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    const productRecord = {
      id: prodId,
      categoryId: cat.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      size: p.size,
      pricePkr: p.pricePkr,
      imageUrl: url,
      imageAlt: altText,
      imageCaption: null,
      isAvailable: true,
      isFeatured: p.slug === "spanish-latte",
      customizationsEnabled: false,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date(),
      images: [imageRecord],
      categorySlug: cat.slug,
      categoryName: cat.name
    };
    productsByCategory.get(p.categorySlug)?.push(productRecord);
    prodId++;
  }
  return CAFE_CATEGORIES.map((c) => ({
    ...categorySlugMap.get(c.slug),
    products: productsByCategory.get(c.slug) ?? []
  }));
}
function invalidatePublicMenuCache() {
  publicMenuCache = null;
}
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? /* @__PURE__ */ new Date() };
  const updateSet = { lastSignedIn: values.lastSignedIn };
  for (const field of ["name", "email", "loginMethod"]) {
    if (user[field] !== void 0) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  values.role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
  updateSet.role = values.role;
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}
async function ensureCafeSeed() {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select({ id: categories.id }).from(categories).limit(1);
  if (!existing.length) {
    await db.insert(categories).values([...CAFE_CATEGORIES]);
    const persistedCategories = await db.select().from(categories);
    const categoryIds = new Map(persistedCategories.map((category) => [category.slug, category.id]));
    await db.insert(products).values(
      CAFE_PRODUCTS.map((product) => ({
        slug: product.slug,
        name: product.name,
        categoryId: categoryIds.get(product.categorySlug),
        description: product.description,
        size: product.size,
        pricePkr: product.pricePkr,
        imageUrl: `/manus-storage/${PRODUCT_IMAGE_MAP[product.slug] || `${product.slug}.jpg`}`
      }))
    );
    await db.insert(businessSettings).values(CAFE_BUSINESS);
    const persistedProducts = await db.select().from(products);
    for (const p of persistedProducts) {
      const filename = PRODUCT_IMAGE_MAP[p.slug];
      if (filename) {
        const url = `/manus-storage/${filename}`;
        await db.insert(productImages).values({
          productId: p.id,
          storageKey: filename,
          url,
          originalFilename: filename,
          thumbnailStorageKey: null,
          thumbnailUrl: url,
          altText: `${p.name} at Coffeemistry, F-8/1, Islamabad`,
          caption: null,
          mimeType: "image/jpeg",
          width: 800,
          height: 800,
          byteSize: 1e5,
          processingStatus: "ready",
          isPrimary: true,
          sortOrder: 0
        });
      }
    }
  }
}
async function getPublicMenu() {
  const now = Date.now();
  if (publicMenuCache && publicMenuCache.expiresAt > now) return publicMenuCache.value;
  const db = await getDb();
  if (!db) {
    const fallbackMenu = buildStaticFallbackMenu();
    publicMenuCache = { value: fallbackMenu, expiresAt: now + PUBLIC_MENU_CACHE_TTL_MS };
    return fallbackMenu;
  }
  await ensureCafeSeed();
  const [categoryRows, productRows, imageRows] = await Promise.all([
    db.select().from(categories).where(eq(categories.isEnabled, true)).orderBy(asc(categories.sortOrder)),
    db.select({ product: products, categorySlug: categories.slug, categoryName: categories.name }).from(products).innerJoin(categories, eq(products.categoryId, categories.id)).where(and(eq(categories.isEnabled, true), eq(products.isAvailable, true))).orderBy(asc(products.name)),
    db.select().from(productImages).orderBy(asc(productImages.sortOrder), asc(productImages.id))
  ]);
  const menu = categoryRows.map((category) => ({
    ...category,
    products: productRows.filter((row) => row.product.categoryId === category.id).map((row) => {
      const images = imageRows.filter((image) => image.productId === row.product.id);
      const primaryImage = images.find((image) => image.isPrimary) ?? images[0] ?? null;
      return {
        ...row.product,
        imageUrl: primaryImage?.url ?? row.product.imageUrl,
        imageAlt: primaryImage?.altText ?? `${row.product.name} at Coffeemistry, F-8/1, Islamabad`,
        imageCaption: primaryImage?.caption ?? null,
        images,
        categorySlug: row.categorySlug,
        categoryName: row.categoryName
      };
    })
  }));
  publicMenuCache = { value: menu, expiresAt: now + PUBLIC_MENU_CACHE_TTL_MS };
  return menu;
}
async function getCheckoutQuote(input) {
  const db = await getDb();
  if (!db) {
    const menu = await getPublicMenu();
    const allProducts = menu.flatMap((c) => c.products);
    const productIds2 = Array.from(new Set(input.items.map((item) => item.productId)));
    const matchingProducts = allProducts.filter((p) => productIds2.includes(p.id));
    if (matchingProducts.length !== productIds2.length || matchingProducts.some((p) => !p.isAvailable)) {
      throw new Error("One or more items are no longer available.");
    }
    const itemsByProductId2 = new Map(input.items.map((item) => [item.productId, item]));
    const subtotalPkr2 = matchingProducts.reduce((total, product) => total + product.pricePkr * (itemsByProductId2.get(product.id)?.quantity ?? 0), 0);
    return { subtotalPkr: subtotalPkr2, totalPkr: input.orderType === "pickup" ? subtotalPkr2 : null, currency: "PKR" };
  }
  await ensureCafeSeed();
  const productIds = Array.from(new Set(input.items.map((item) => item.productId)));
  const menuProducts = await db.select().from(products).where(inArray(products.id, productIds));
  if (menuProducts.length !== productIds.length || menuProducts.some((product) => !product.isAvailable)) throw new Error("One or more items are no longer available.");
  const itemsByProductId = new Map(input.items.map((item) => [item.productId, item]));
  const subtotalPkr = menuProducts.reduce((total, product) => total + product.pricePkr * (itemsByProductId.get(product.id)?.quantity ?? 0), 0);
  return { subtotalPkr, totalPkr: input.orderType === "pickup" ? subtotalPkr : null, currency: "PKR" };
}
async function createOrder(input) {
  const db = await getDb();
  if (!db) {
    const menu = await getPublicMenu();
    const allProducts = menu.flatMap((c) => c.products);
    const productIds2 = Array.from(new Set(input.items.map((item) => item.productId)));
    const matchingProducts = allProducts.filter((p) => productIds2.includes(p.id));
    if (matchingProducts.length !== productIds2.length || matchingProducts.some((p) => !p.isAvailable)) {
      throw new Error("One or more items are no longer available.");
    }
    const itemsByProductId2 = new Map(input.items.map((item) => [item.productId, item]));
    const subtotalPkr2 = matchingProducts.reduce((total, product) => total + product.pricePkr * (itemsByProductId2.get(product.id)?.quantity ?? 0), 0);
    const totalPkr2 = input.orderType === "pickup" ? subtotalPkr2 : null;
    const orderId2 = nextMemoryOrderId++;
    const newOrder = {
      id: orderId2,
      orderNumber: input.orderNumber,
      customerId: 1,
      customerName: input.customerName,
      phone: input.phone,
      whatsapp: input.whatsapp ?? null,
      orderType: input.orderType,
      deliveryAddress: input.deliveryAddress ?? null,
      area: input.area ?? null,
      deliveryInstructions: input.deliveryInstructions ?? null,
      notes: input.notes ?? null,
      subtotalPkr: subtotalPkr2,
      deliveryFeePkr: null,
      totalPkr: totalPkr2,
      paymentMethodLabel: "WhatsApp / Pay on Confirmation",
      paymentStatus: "not_applicable",
      status: "new",
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date(),
      items: matchingProducts.map((p, idx) => {
        const item = itemsByProductId2.get(p.id);
        return {
          id: idx + 1,
          orderId: orderId2,
          productId: p.id,
          productName: p.name,
          productDescription: p.description,
          productSize: p.size,
          unitPricePkr: p.pricePkr,
          quantity: item.quantity,
          customizationsJson: item.customizationsJson ?? null
        };
      })
    };
    memoryOrders.unshift(newOrder);
    return { orderId: orderId2, orderNumber: input.orderNumber, subtotalPkr: subtotalPkr2, totalPkr: totalPkr2, status: "new" };
  }
  await ensureCafeSeed();
  const productIds = Array.from(new Set(input.items.map((item) => item.productId)));
  const menuProducts = await db.select().from(products).where(inArray(products.id, productIds));
  if (menuProducts.length !== productIds.length || menuProducts.some((product) => !product.isAvailable)) {
    throw new Error("One or more items are no longer available.");
  }
  const itemsByProductId = new Map(input.items.map((item) => [item.productId, item]));
  const subtotalPkr = menuProducts.reduce((total, product) => total + product.pricePkr * (itemsByProductId.get(product.id)?.quantity ?? 0), 0);
  const totalPkr = input.orderType === "pickup" ? subtotalPkr : null;
  const matchingCustomers = await db.select().from(customers).where(eq(customers.phone, input.phone)).limit(1);
  let customerId = matchingCustomers[0]?.id;
  if (!customerId) {
    const result = await db.insert(customers).values({ name: input.customerName, phone: input.phone, whatsapp: input.whatsapp ?? null });
    customerId = Number(result[0].insertId);
  }
  if (!customerId) throw new Error("Unable to create customer profile.");
  const orderResult = await db.insert(orders).values({
    orderNumber: input.orderNumber,
    customerId,
    customerName: input.customerName,
    phone: input.phone,
    whatsapp: input.whatsapp ?? null,
    orderType: input.orderType,
    deliveryAddress: input.deliveryAddress ?? null,
    area: input.area ?? null,
    deliveryInstructions: input.deliveryInstructions ?? null,
    notes: input.notes ?? null,
    subtotalPkr,
    deliveryFeePkr: null,
    totalPkr,
    paymentMethodLabel: "WhatsApp / Pay on Confirmation",
    paymentStatus: "not_applicable",
    status: "new"
  });
  const orderId = Number(orderResult[0].insertId);
  await db.insert(orderPayments).values({
    orderId,
    paymentMethodId: null,
    paymentMethodCode: "whatsapp_confirmation",
    paymentMethodLabel: "WhatsApp / Pay on Confirmation",
    status: "not_applicable",
    transactionReference: null,
    amountPkr: totalPkr ?? subtotalPkr,
    currency: "PKR",
    screenshotStorageKey: null,
    screenshotUrl: null,
    receiptAccessTokenHash: null,
    receiptMimeType: null,
    receiptByteSize: null,
    providerKey: null
  });
  await db.insert(orderItems).values(
    menuProducts.map((product) => {
      const item = itemsByProductId.get(product.id);
      return {
        orderId,
        productId: product.id,
        productName: product.name,
        productDescription: product.description,
        productSize: product.size,
        unitPricePkr: product.pricePkr,
        quantity: item.quantity,
        customizationsJson: item.customizationsJson ?? null
      };
    })
  );
  await db.insert(orderStatusHistory).values({ orderId, status: "new", note: "Order received via WhatsApp." });
  return { orderId, orderNumber: input.orderNumber, subtotalPkr, totalPkr, status: "new" };
}
async function getOrderForCustomer(orderNumber2, phone) {
  const db = await getDb();
  if (!db) {
    const memoryOrder = memoryOrders.find((o) => o.orderNumber === orderNumber2 && o.phone === phone);
    if (!memoryOrder) return null;
    return { order: memoryOrder, items: memoryOrder.items, estimatedOrderTime: "20-30 mins" };
  }
  const result = await db.select().from(orders).where(and(eq(orders.orderNumber, orderNumber2), eq(orders.phone, phone))).limit(1);
  const order = result[0];
  if (!order) return null;
  const [items, settings] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, order.id)),
    db.select().from(businessSettings).where(eq(businessSettings.key, "primary")).limit(1)
  ]);
  return { order, items, estimatedOrderTime: settings[0]?.estimatedOrderTime ?? null };
}
async function getAdminOrders() {
  const db = await getDb();
  if (!db) {
    return memoryOrders.map((o) => ({ ...o, payment: null }));
  }
  const rows = await db.select({ order: orders, payment: orderPayments }).from(orders).leftJoin(orderPayments, eq(orderPayments.orderId, orders.id)).orderBy(desc(orders.createdAt));
  const allItems = await db.select().from(orderItems);
  return rows.map((row) => ({ ...row.order, items: allItems.filter((item) => item.orderId === row.order.id), payment: row.payment?.id ? row.payment : null }));
}
function isAllowedStatusTransition(currentStatus, nextStatus) {
  const nextByCurrent = { new: "confirmed", confirmed: "preparing", preparing: "ready", ready: "out_for_delivery", out_for_delivery: "completed", completed: null, cancelled: null };
  return nextByCurrent[currentStatus] === nextStatus;
}
async function advanceOrderStatus(orderId, nextStatus) {
  const db = await getDb();
  if (!db) {
    const order2 = memoryOrders.find((o) => o.id === orderId);
    if (!order2) throw new Error("Order not found.");
    if (!isAllowedStatusTransition(order2.status, nextStatus)) throw new Error("This order cannot move to that status.");
    order2.status = nextStatus;
    return { ...order2, status: nextStatus };
  }
  const existing = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  const order = existing[0];
  if (!order) throw new Error("Order not found.");
  if (!isAllowedStatusTransition(order.status, nextStatus)) throw new Error("This order cannot move to that status.");
  await db.update(orders).set({ status: nextStatus }).where(eq(orders.id, orderId));
  await db.insert(orderStatusHistory).values({ orderId, status: nextStatus, note: `Order marked ${nextStatus}.` });
  return { ...order, status: nextStatus };
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    return decodeOAuthState(state).redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    let sessionToken = cookies.get(COOKIE_NAME);
    if (!sessionToken) {
      const authHeader = req.headers.authorization;
      if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        sessionToken = authHeader.slice(7);
      }
    }
    const session = await this.verifySession(sessionToken);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    if (session.openId.startsWith(CRON_OPEN_ID_PREFIX)) {
      const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
      const taskUid = userInfo.taskUid ?? null;
      if (!taskUid) {
        throw ForbiddenError("Cron session missing task_uid");
      }
      return buildCronUser(userInfo);
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var CRON_OPEN_ID_PREFIX = "cron_";
function buildCronUser(userInfo) {
  const now = /* @__PURE__ */ new Date();
  return {
    id: -1,
    openId: userInfo.openId,
    name: userInfo.name || "Manus Scheduled Task",
    email: null,
    loginMethod: null,
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    taskUid: userInfo.taskUid ?? void 0,
    isCron: true
  };
}
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app2) {
  app2.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    const { nonce } = decodeOAuthState(state);
    const expectedNonce = parseCookieHeader2(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
    if (!nonce || nonce !== expectedNonce) {
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/", secure: true, sameSite: "none" });
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/storageProxy.ts
import fs from "node:fs";
import path from "node:path";
function registerStorageProxy(app2) {
  app2.get("/manus-storage/*", async (req, res) => {
    const key = req.params[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }
    const baseName = path.basename(key);
    const candidatePaths = [
      path.resolve(process.cwd(), "client", "public", "product", baseName),
      path.resolve(process.cwd(), "client", "public", "assets", "products", baseName),
      path.resolve(process.cwd(), "client", "public", "assets", "hero", baseName),
      path.resolve(process.cwd(), "client", "public", "product", key),
      path.resolve(process.cwd(), "dist", "public", "product", baseName),
      path.resolve(process.cwd(), "dist", "public", "assets", "products", baseName),
      path.resolve(process.cwd(), "dist", "public", "assets", "hero", baseName)
    ];
    for (const candidate of candidatePaths) {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        res.set("Cache-Control", "public, max-age=31536000, immutable");
        return res.sendFile(candidate);
      }
    }
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(404).send("Asset not found");
      return;
    }
    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
      );
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` }
      });
      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }
      const { url } = await forgeResp.json();
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }
      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}

// server/routers.ts
import { TRPCError as TRPCError3 } from "@trpc/server";
import { customAlphabet } from "nanoid";
import { z as z2 } from "zod";

// server/_core/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError as TRPCError2 } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError2({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError2({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError2({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError2({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError2({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError2({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/productMedia.ts
import { and as and2, asc as asc2, eq as eq2, inArray as inArray2 } from "drizzle-orm";
import { imageSize } from "image-size";

// server/storage.ts
function getForgeConfig() {
  const forgeUrl = ENV.forgeApiUrl;
  const forgeKey = ENV.forgeApiKey;
  if (!forgeUrl || !forgeKey) {
    throw new Error(
      "Storage config missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }
  return { forgeUrl: forgeUrl.replace(/\/+$/, ""), forgeKey };
}
function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, "");
}
function appendHashSuffix(relKey) {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const { forgeUrl, forgeKey } = getForgeConfig();
  const key = appendHashSuffix(normalizeKey(relKey));
  const presignUrl = new URL("v1/storage/presign/put", forgeUrl + "/");
  presignUrl.searchParams.set("path", key);
  const presignResp = await fetch(presignUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` }
  });
  if (!presignResp.ok) {
    const msg = await presignResp.text().catch(() => presignResp.statusText);
    throw new Error(`Storage presign failed (${presignResp.status}): ${msg}`);
  }
  const { url: s3Url } = await presignResp.json();
  if (!s3Url) throw new Error("Forge returned empty presign URL");
  const blob = typeof data === "string" ? new Blob([data], { type: contentType }) : new Blob([data], { type: contentType });
  const uploadResp = await fetch(s3Url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob
  });
  if (!uploadResp.ok) {
    throw new Error(`Storage upload to S3 failed (${uploadResp.status})`);
  }
  return { key, url: `/manus-storage/${key}` };
}

// server/productMedia.ts
var MAX_IMAGE_BYTES = 10 * 1024 * 1024;
var imageMimeTypes = /* @__PURE__ */ new Set(["image/jpeg", "image/png", "image/webp"]);
function safeOriginalFilename(filename) {
  if (!filename) return null;
  const normalized = filename.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._ -]{0,254}$/.test(normalized)) throw new Error("Image filename contains unsupported characters.");
  return normalized;
}
function validateProductImageDataUrl({ dataUrl }) {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match || !imageMimeTypes.has(match[1])) throw new Error("Upload a JPG, PNG, or WebP image.");
  const bytes = Buffer.from(match[2], "base64");
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) throw new Error("Image must be between 1 byte and 10 MB after optimization.");
  let metadata;
  try {
    metadata = imageSize(bytes);
  } catch {
    throw new Error("The uploaded file is not a valid image matching its declared format.");
  }
  const detectedMime = metadata.type === "jpg" ? "image/jpeg" : metadata.type === "png" ? "image/png" : metadata.type === "webp" ? "image/webp" : null;
  if (!detectedMime || detectedMime !== match[1] || !metadata.width || !metadata.height) throw new Error("The uploaded file is not a valid image matching its declared format.");
  if (metadata.width > 5e3 || metadata.height > 5e3) throw new Error("Image dimensions must not exceed 5000 pixels.");
  return { bytes, mimeType: detectedMime, width: metadata.width, height: metadata.height };
}
function extensionFor(mimeType) {
  return mimeType === "image/png" ? "png" : mimeType === "image/jpeg" ? "jpg" : "webp";
}
function defaultProductAlt(name) {
  return `${name} at Coffeemistry in Islamabad`;
}
function choosePrimaryImageFallback(images) {
  return [...images].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)[0] ?? null;
}
async function getAdminProductsWithImages() {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  const [productRows, imageRows] = await Promise.all([
    db.select({ product: products }).from(products).orderBy(asc2(products.name)),
    db.select().from(productImages).orderBy(asc2(productImages.sortOrder), asc2(productImages.id))
  ]);
  return productRows.map((row) => ({ ...row.product, images: imageRows.filter((image) => image.productId === row.product.id) }));
}
async function uploadProductImage(input) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  const product = (await db.select().from(products).where(eq2(products.id, input.productId)).limit(1))[0];
  if (!product) throw new Error("Product not found.");
  const image = validateProductImageDataUrl(input.image);
  const thumbnail = input.thumbnail ? validateProductImageDataUrl(input.thumbnail) : void 0;
  const productPath = `products/${product.slug}`;
  const full = await storagePut(`${productPath}/display.${extensionFor(image.mimeType)}`, image.bytes, image.mimeType);
  const thumb = thumbnail ? await storagePut(`${productPath}/thumbnail.${extensionFor(thumbnail.mimeType)}`, thumbnail.bytes, thumbnail.mimeType) : void 0;
  const existing = await db.select().from(productImages).where(eq2(productImages.productId, product.id));
  const isPrimary = input.setPrimary || existing.length === 0;
  if (isPrimary) await db.update(productImages).set({ isPrimary: false }).where(eq2(productImages.productId, product.id));
  const result = await db.insert(productImages).values({
    productId: product.id,
    storageKey: full.key,
    url: full.url,
    originalFilename: safeOriginalFilename(input.originalFilename),
    thumbnailStorageKey: thumb?.key ?? null,
    thumbnailUrl: thumb?.url ?? null,
    altText: input.altText?.trim() || defaultProductAlt(product.name),
    caption: input.caption?.trim() || null,
    mimeType: image.mimeType,
    width: image.width ?? null,
    height: image.height ?? null,
    byteSize: image.bytes.length,
    processingStatus: "ready",
    isPrimary,
    sortOrder: existing.length
  });
  if (isPrimary) await db.update(products).set({ imageUrl: full.url }).where(eq2(products.id, product.id));
  invalidatePublicMenuCache();
  return Number(result[0].insertId);
}
async function updateProductImage(input) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  const image = (await db.select().from(productImages).where(and2(eq2(productImages.id, input.id), eq2(productImages.productId, input.productId))).limit(1))[0];
  if (!image) throw new Error("Product image not found.");
  if (input.isPrimary) await db.update(productImages).set({ isPrimary: false }).where(eq2(productImages.productId, input.productId));
  await db.update(productImages).set({ altText: input.altText.trim(), caption: input.caption?.trim() || null, isPrimary: input.isPrimary }).where(eq2(productImages.id, input.id));
  if (input.isPrimary) await db.update(products).set({ imageUrl: image.url }).where(eq2(products.id, input.productId));
  invalidatePublicMenuCache();
  return input.id;
}
async function replaceProductImage(input) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  const existing = (await db.select().from(productImages).where(and2(eq2(productImages.id, input.imageId), eq2(productImages.productId, input.productId))).limit(1))[0];
  if (!existing) throw new Error("Product image not found.");
  const id = await uploadProductImage({ productId: input.productId, image: input.image, thumbnail: input.thumbnail, altText: input.altText ?? existing.altText, caption: input.caption ?? existing.caption ?? void 0, originalFilename: input.originalFilename, setPrimary: existing.isPrimary });
  await removeProductImage(input.productId, input.imageId);
  return id;
}
async function reorderProductImages(productId, imageIds) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  const owned = await db.select({ id: productImages.id }).from(productImages).where(and2(eq2(productImages.productId, productId), inArray2(productImages.id, imageIds)));
  if (owned.length !== imageIds.length) throw new Error("One or more images do not belong to this product.");
  await Promise.all(imageIds.map((id, sortOrder) => db.update(productImages).set({ sortOrder }).where(eq2(productImages.id, id))));
  invalidatePublicMenuCache();
}
async function removeProductImage(productId, imageId) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  const image = (await db.select().from(productImages).where(and2(eq2(productImages.id, imageId), eq2(productImages.productId, productId))).limit(1))[0];
  if (!image) throw new Error("Product image not found.");
  await db.delete(productImages).where(eq2(productImages.id, imageId));
  if (image.isPrimary) {
    const remaining = await db.select().from(productImages).where(eq2(productImages.productId, productId)).orderBy(asc2(productImages.sortOrder), asc2(productImages.id));
    const next = choosePrimaryImageFallback(remaining);
    if (next) {
      await db.update(productImages).set({ isPrimary: true }).where(eq2(productImages.id, next.id));
      await db.update(products).set({ imageUrl: next.url }).where(eq2(products.id, productId));
    } else {
      await db.update(products).set({ imageUrl: null }).where(eq2(products.id, productId));
    }
  }
  invalidatePublicMenuCache();
}

// server/routers.ts
var orderNumber = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);
var orderItemInput = z2.object({ productId: z2.number().int().positive(), quantity: z2.number().int().min(1).max(12), customizationsJson: z2.string().max(2e3).optional() });
var encodedImageInput = z2.object({ dataUrl: z2.string().min(32).max(15e6).regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/, "Upload a JPG, PNG, or WebP image."), width: z2.number().int().positive().max(5e3).optional(), height: z2.number().int().positive().max(5e3).optional() });
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  menu: router({ list: publicProcedure.query(async () => getPublicMenu()) }),
  order: router({
    quote: publicProcedure.input(z2.object({ orderType: z2.enum(["pickup", "delivery"]), items: z2.array(orderItemInput).min(1).max(20) })).query(async ({ input }) => {
      const distinctItemIds = new Set(input.items.map((item) => item.productId));
      if (distinctItemIds.size !== input.items.length) throw new TRPCError3({ code: "BAD_REQUEST", message: "Each menu item can appear once in an order." });
      try {
        return await getCheckoutQuote(input);
      } catch (error) {
        throw new TRPCError3({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Unable to calculate the order total." });
      }
    }),
    create: publicProcedure.input(z2.object({
      customerName: z2.string().trim().min(2).max(160),
      phone: z2.string().trim().min(7).max(40),
      whatsapp: z2.string().trim().min(7).max(40).optional(),
      orderType: z2.enum(["pickup", "delivery"]),
      deliveryAddress: z2.string().trim().min(5).max(800).optional(),
      area: z2.string().trim().max(100).optional(),
      deliveryInstructions: z2.string().trim().max(800).optional(),
      notes: z2.string().trim().max(800).optional(),
      items: z2.array(orderItemInput).min(1).max(20)
    })).mutation(async ({ input }) => {
      if (input.orderType === "delivery" && !input.deliveryAddress) throw new TRPCError3({ code: "BAD_REQUEST", message: "A delivery address is required for delivery orders." });
      const distinctItemIds = new Set(input.items.map((item) => item.productId));
      if (distinctItemIds.size !== input.items.length) throw new TRPCError3({ code: "BAD_REQUEST", message: "Each menu item can appear once in an order." });
      try {
        const generatedOrderNumber = `CFM-${orderNumber()}`;
        return await createOrder({ ...input, orderNumber: generatedOrderNumber });
      } catch (error) {
        throw new TRPCError3({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Unable to create order." });
      }
    }),
    track: publicProcedure.input(z2.object({ orderNumber: z2.string().trim().min(6).max(24), phone: z2.string().trim().min(7).max(40) })).query(async ({ input }) => getOrderForCustomer(input.orderNumber, input.phone))
  }),
  admin: router({
    orders: adminProcedure.query(async () => getAdminOrders()),
    products: adminProcedure.query(async () => getAdminProductsWithImages()),
    uploadProductImage: adminProcedure.input(z2.object({ productId: z2.number().int().positive(), image: encodedImageInput, thumbnail: encodedImageInput.optional(), altText: z2.string().trim().max(260).optional(), caption: z2.string().trim().max(500).optional(), originalFilename: z2.string().trim().regex(/^[A-Za-z0-9][A-Za-z0-9._ -]{0,254}$/).optional(), setPrimary: z2.boolean().optional() })).mutation(async ({ input }) => ({ id: await uploadProductImage(input) })),
    replaceProductImage: adminProcedure.input(z2.object({ productId: z2.number().int().positive(), imageId: z2.number().int().positive(), image: encodedImageInput, thumbnail: encodedImageInput.optional(), altText: z2.string().trim().max(260).optional(), caption: z2.string().trim().max(500).optional(), originalFilename: z2.string().trim().regex(/^[A-Za-z0-9][A-Za-z0-9._ -]{0,254}$/).optional() })).mutation(async ({ input }) => ({ id: await replaceProductImage(input) })),
    updateProductImage: adminProcedure.input(z2.object({ id: z2.number().int().positive(), productId: z2.number().int().positive(), altText: z2.string().trim().min(2).max(260), caption: z2.string().trim().max(500).optional(), isPrimary: z2.boolean() })).mutation(async ({ input }) => ({ id: await updateProductImage(input) })),
    reorderProductImages: adminProcedure.input(z2.object({ productId: z2.number().int().positive(), imageIds: z2.array(z2.number().int().positive()).min(1).max(20) })).mutation(async ({ input }) => {
      await reorderProductImages(input.productId, input.imageIds);
      return { success: true };
    }),
    deleteProductImage: adminProcedure.input(z2.object({ productId: z2.number().int().positive(), imageId: z2.number().int().positive() })).mutation(async ({ input }) => {
      await removeProductImage(input.productId, input.imageId);
      return { success: true };
    }),
    advanceOrder: adminProcedure.input(z2.object({ orderId: z2.number().int().positive(), status: z2.enum(["confirmed", "preparing", "ready", "out_for_delivery", "completed"]) })).mutation(async ({ input }) => {
      try {
        return await advanceOrderStatus(input.orderId, input.status);
      } catch (error) {
        throw new TRPCError3({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Unable to update order." });
      }
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/vercelApi.ts
var app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.get(["/health", "/api/health", "/api", "/"], (_req, res) => {
  res.status(200).json({ status: "ok", service: "coffeemistry-api", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
app.get(["/api/menu", "/api/menu/list", "/api/catalog", "/menu", "/menu/list", "/catalog"], async (_req, res) => {
  try {
    const menu = await getPublicMenu();
    res.status(200).json(menu);
  } catch (error) {
    console.error("[API menu] error:", error);
    res.status(500).json({ error: "Failed to load catalog" });
  }
});
registerStorageProxy(app);
registerOAuthRoutes(app);
var trpcMiddleware = createExpressMiddleware({
  router: appRouter,
  createContext
});
app.use("/api/trpc", trpcMiddleware);
app.use("/trpc", trpcMiddleware);
var vercelApi_default = app;
export {
  vercelApi_default as default
};
