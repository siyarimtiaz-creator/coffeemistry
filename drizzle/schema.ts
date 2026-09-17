import {
  boolean,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  sortOrder: int("sortOrder").notNull(),
  isEnabled: boolean("isEnabled").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const products = mysqlTable(
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
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("products_category_idx").on(table.categoryId)],
);

export const productImages = mysqlTable(
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
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("product_images_product_idx").on(table.productId, table.sortOrder)],
);

export const productOptionGroups = mysqlTable("productOptionGroups", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull().references(() => products.id),
  label: varchar("label", { length: 100 }).notNull(),
  choiceType: mysqlEnum("choiceType", ["single", "multiple"]).default("single").notNull(),
  isRequired: boolean("isRequired").default(false).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
});

export const productOptions = mysqlTable("productOptions", {
  id: int("id").autoincrement().primaryKey(),
  optionGroupId: int("optionGroupId").notNull().references(() => productOptionGroups.id),
  label: varchar("label", { length: 100 }).notNull(),
  pricePkrDelta: int("pricePkrDelta").default(0).notNull(),
  isAvailable: boolean("isAvailable").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
});

export const businessSettings = mysqlTable("businessSettings", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const paymentMethods = mysqlTable("paymentMethods", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  name: varchar("name", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 40 }).notNull(),
  whatsapp: varchar("whatsapp", { length: 40 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const customerAddresses = mysqlTable("customerAddresses", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull().references(() => customers.id),
  address: text("address").notNull(),
  area: varchar("area", { length: 100 }),
  instructions: text("instructions"),
  isDefault: boolean("isDefault").default(false).notNull(),
});

export const orders = mysqlTable(
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
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("orders_status_created_idx").on(table.status, table.createdAt)],
);

export const orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull().references(() => orders.id),
  productId: int("productId").references(() => products.id),
  productName: varchar("productName", { length: 160 }).notNull(),
  productDescription: text("productDescription").notNull(),
  productSize: varchar("productSize", { length: 80 }),
  unitPricePkr: int("unitPricePkr").notNull(),
  quantity: int("quantity").notNull(),
  customizationsJson: text("customizationsJson"),
});

export const orderPayments = mysqlTable(
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
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("order_payments_status_idx").on(table.status, table.createdAt)],
);

export const orderStatusHistory = mysqlTable("orderStatusHistory", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull().references(() => orders.id),
  status: mysqlEnum("status", ["new", "confirmed", "preparing", "ready", "out_for_delivery", "completed", "cancelled"]).notNull(),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const favorites = mysqlTable(
  "favorites",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id),
    productId: int("productId").notNull().references(() => products.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("favorites_user_product_idx").on(table.userId, table.productId)],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Product = typeof products.$inferSelect;
export type ProductImage = typeof productImages.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderPayment = typeof orderPayments.$inferSelect;
