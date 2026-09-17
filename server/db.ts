import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  businessSettings,
  categories,
  customers,
  InsertUser,
  orderItems,
  orderPayments,
  orders,
  orderStatusHistory,
  productImages,
  products,
  users,
  type Category,
  type Product,
  type ProductImage,
} from "../drizzle/schema";
import { CAFE_BUSINESS, CAFE_CATEGORIES, CAFE_PRODUCTS } from "./cafeSeed";
import { ENV } from "./_core/env";

export const PRODUCT_IMAGE_MAP: Record<string, string> = {
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
  "classic-cookies": "coffeemistry-classic-cookies_f8a2d54a_e9c839b8.jpg",
};

let _db: ReturnType<typeof drizzle> | null = null;
const PUBLIC_MENU_CACHE_TTL_MS = 60_000;
export type PublicMenuProduct = Product & { imageAlt: string; imageCaption: string | null; images: ProductImage[]; categorySlug: string; categoryName: string };
export type PublicMenu = Array<Category & { products: PublicMenuProduct[] }>;
let publicMenuCache: { value: PublicMenu; expiresAt: number } | null = null;

// Standalone in-memory fallback store when DATABASE_URL is not configured
interface MemoryOrder {
  id: number;
  orderNumber: string;
  customerId: number;
  customerName: string;
  phone: string;
  whatsapp: string | null;
  orderType: "pickup" | "delivery";
  deliveryAddress: string | null;
  area: string | null;
  deliveryInstructions: string | null;
  notes: string | null;
  subtotalPkr: number;
  deliveryFeePkr: number | null;
  totalPkr: number | null;
  paymentMethodLabel: string;
  paymentStatus: string;
  status: "new" | "confirmed" | "preparing" | "ready" | "out_for_delivery" | "completed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    id: number;
    orderId: number;
    productId: number;
    productName: string;
    productDescription: string;
    productSize: string | null;
    unitPricePkr: number;
    quantity: number;
    customizationsJson: string | null;
  }>;
}

const memoryOrders: MemoryOrder[] = [];
let nextMemoryOrderId = 1;

function buildStaticFallbackMenu(): PublicMenu {
  const categorySlugMap = new Map(CAFE_CATEGORIES.map((c, i) => [c.slug, { id: i + 1, name: c.name, slug: c.slug, sortOrder: c.sortOrder, isEnabled: true, createdAt: new Date(), updatedAt: new Date() }]));

  let prodId = 1;
  const productsByCategory = new Map<string, PublicMenuProduct[]>();
  for (const cat of CAFE_CATEGORIES) {
    productsByCategory.set(cat.slug, []);
  }

  for (const p of CAFE_PRODUCTS) {
    const cat = categorySlugMap.get(p.categorySlug)!;
    const filename = PRODUCT_IMAGE_MAP[p.slug] || `${p.slug}.jpg`;
    const url = `/manus-storage/${filename}`;
    const altText = `${p.name} at Coffeemistry, F-8/1, Islamabad`;
    const imageRecord: ProductImage = {
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
      byteSize: 100000,
      processingStatus: "ready",
      imageType: "owner_product_photo",
      source: "owner_upload",
      replacementAllowed: true,
      isPrimary: true,
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const productRecord: PublicMenuProduct = {
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
      createdAt: new Date(),
      updatedAt: new Date(),
      images: [imageRecord],
      categorySlug: cat.slug,
      categoryName: cat.name,
    };

    productsByCategory.get(p.categorySlug)?.push(productRecord);
    prodId++;
  }

  return CAFE_CATEGORIES.map(c => ({
    ...categorySlugMap.get(c.slug)!,
    products: productsByCategory.get(c.slug) ?? [],
  }));
}

export function invalidatePublicMenuCache() {
  publicMenuCache = null;
}

export async function getDb() {
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

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: values.lastSignedIn };
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  values.role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
  updateSet.role = values.role;
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function ensureCafeSeed() {
  const db = await getDb();
  if (!db) return; // In-memory fallback handles seed automatically
  const existing = await db.select({ id: categories.id }).from(categories).limit(1);
  if (!existing.length) {
    await db.insert(categories).values([...CAFE_CATEGORIES]);
    const persistedCategories = await db.select().from(categories);
    const categoryIds = new Map(persistedCategories.map(category => [category.slug, category.id]));
    await db.insert(products).values(
      CAFE_PRODUCTS.map(product => ({
        slug: product.slug,
        name: product.name,
        categoryId: categoryIds.get(product.categorySlug)!,
        description: product.description,
        size: product.size,
        pricePkr: product.pricePkr,
        imageUrl: `/manus-storage/${PRODUCT_IMAGE_MAP[product.slug] || `${product.slug}.jpg`}`,
      })),
    );
    await db.insert(businessSettings).values(CAFE_BUSINESS);

    // Also populate productImages for full consistency
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
          byteSize: 100000,
          processingStatus: "ready",
          isPrimary: true,
          sortOrder: 0,
        });
      }
    }
  }
}

export async function getPublicMenu(): Promise<PublicMenu> {
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
    db
      .select({ product: products, categorySlug: categories.slug, categoryName: categories.name })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(and(eq(categories.isEnabled, true), eq(products.isAvailable, true)))
      .orderBy(asc(products.name)),
    db.select().from(productImages).orderBy(asc(productImages.sortOrder), asc(productImages.id)),
  ]);

  const menu = categoryRows.map(category => ({
    ...category,
    products: productRows
      .filter(row => row.product.categoryId === category.id)
      .map(row => {
        const images = imageRows.filter(image => image.productId === row.product.id);
        const primaryImage = images.find(image => image.isPrimary) ?? images[0] ?? null;
        return {
          ...row.product,
          imageUrl: primaryImage?.url ?? row.product.imageUrl,
          imageAlt: primaryImage?.altText ?? `${row.product.name} at Coffeemistry, F-8/1, Islamabad`,
          imageCaption: primaryImage?.caption ?? null,
          images,
          categorySlug: row.categorySlug,
          categoryName: row.categoryName,
        };
      }),
  }));
  publicMenuCache = { value: menu, expiresAt: now + PUBLIC_MENU_CACHE_TTL_MS };
  return menu;
}

export async function getCheckoutQuote(input: { orderType: "pickup" | "delivery"; items: Array<{ productId: number; quantity: number }> }) {
  const db = await getDb();
  if (!db) {
    const menu = await getPublicMenu();
    const allProducts = menu.flatMap(c => c.products);
    const productIds = Array.from(new Set(input.items.map(item => item.productId)));
    const matchingProducts = allProducts.filter(p => productIds.includes(p.id));
    if (matchingProducts.length !== productIds.length || matchingProducts.some(p => !p.isAvailable)) {
      throw new Error("One or more items are no longer available.");
    }
    const itemsByProductId = new Map(input.items.map(item => [item.productId, item]));
    const subtotalPkr = matchingProducts.reduce((total, product) => total + product.pricePkr * (itemsByProductId.get(product.id)?.quantity ?? 0), 0);
    return { subtotalPkr, totalPkr: input.orderType === "pickup" ? subtotalPkr : null, currency: "PKR" as const };
  }

  await ensureCafeSeed();
  const productIds = Array.from(new Set(input.items.map(item => item.productId)));
  const menuProducts = await db.select().from(products).where(inArray(products.id, productIds));
  if (menuProducts.length !== productIds.length || menuProducts.some(product => !product.isAvailable)) throw new Error("One or more items are no longer available.");
  const itemsByProductId = new Map(input.items.map(item => [item.productId, item]));
  const subtotalPkr = menuProducts.reduce((total, product) => total + product.pricePkr * (itemsByProductId.get(product.id)?.quantity ?? 0), 0);
  return { subtotalPkr, totalPkr: input.orderType === "pickup" ? subtotalPkr : null, currency: "PKR" as const };
}

export async function createOrder(input: {
  customerName: string;
  phone: string;
  whatsapp?: string;
  orderType: "pickup" | "delivery";
  deliveryAddress?: string;
  area?: string;
  deliveryInstructions?: string;
  notes?: string;
  items: Array<{ productId: number; quantity: number; customizationsJson?: string }>;
  orderNumber: string;
}) {
  const db = await getDb();
  if (!db) {
    const menu = await getPublicMenu();
    const allProducts = menu.flatMap(c => c.products);
    const productIds = Array.from(new Set(input.items.map(item => item.productId)));
    const matchingProducts = allProducts.filter(p => productIds.includes(p.id));
    if (matchingProducts.length !== productIds.length || matchingProducts.some(p => !p.isAvailable)) {
      throw new Error("One or more items are no longer available.");
    }
    const itemsByProductId = new Map(input.items.map(item => [item.productId, item]));
    const subtotalPkr = matchingProducts.reduce((total, product) => total + product.pricePkr * (itemsByProductId.get(product.id)?.quantity ?? 0), 0);
    const totalPkr = input.orderType === "pickup" ? subtotalPkr : null;

    const orderId = nextMemoryOrderId++;
    const newOrder: MemoryOrder = {
      id: orderId,
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
      subtotalPkr,
      deliveryFeePkr: null,
      totalPkr,
      paymentMethodLabel: "WhatsApp / Pay on Confirmation",
      paymentStatus: "not_applicable",
      status: "new",
      createdAt: new Date(),
      updatedAt: new Date(),
      items: matchingProducts.map((p, idx) => {
        const item = itemsByProductId.get(p.id)!;
        return {
          id: idx + 1,
          orderId,
          productId: p.id,
          productName: p.name,
          productDescription: p.description,
          productSize: p.size,
          unitPricePkr: p.pricePkr,
          quantity: item.quantity,
          customizationsJson: item.customizationsJson ?? null,
        };
      }),
    };
    memoryOrders.unshift(newOrder);
    return { orderId, orderNumber: input.orderNumber, subtotalPkr, totalPkr, status: "new" as const };
  }

  await ensureCafeSeed();
  const productIds = Array.from(new Set(input.items.map(item => item.productId)));
  const menuProducts = await db.select().from(products).where(inArray(products.id, productIds));
  if (menuProducts.length !== productIds.length || menuProducts.some(product => !product.isAvailable)) {
    throw new Error("One or more items are no longer available.");
  }
  const itemsByProductId = new Map(input.items.map(item => [item.productId, item]));
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
    status: "new",
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
    providerKey: null,
  });
  await db.insert(orderItems).values(
    menuProducts.map(product => {
      const item = itemsByProductId.get(product.id)!;
      return {
        orderId,
        productId: product.id,
        productName: product.name,
        productDescription: product.description,
        productSize: product.size,
        unitPricePkr: product.pricePkr,
        quantity: item.quantity,
        customizationsJson: item.customizationsJson ?? null,
      };
    }),
  );
  await db.insert(orderStatusHistory).values({ orderId, status: "new", note: "Order received via WhatsApp." });
  return { orderId, orderNumber: input.orderNumber, subtotalPkr, totalPkr, status: "new" as const };
}

export async function getOrderForCustomer(orderNumber: string, phone: string) {
  const db = await getDb();
  if (!db) {
    const memoryOrder = memoryOrders.find(o => o.orderNumber === orderNumber && o.phone === phone);
    if (!memoryOrder) return null;
    return { order: memoryOrder, items: memoryOrder.items, estimatedOrderTime: "20-30 mins" };
  }

  const result = await db.select().from(orders).where(and(eq(orders.orderNumber, orderNumber), eq(orders.phone, phone))).limit(1);
  const order = result[0];
  if (!order) return null;
  const [items, settings] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, order.id)),
    db.select().from(businessSettings).where(eq(businessSettings.key, "primary")).limit(1),
  ]);
  return { order, items, estimatedOrderTime: settings[0]?.estimatedOrderTime ?? null };
}

export async function getAdminOrders() {
  const db = await getDb();
  if (!db) {
    return memoryOrders.map(o => ({ ...o, payment: null }));
  }

  const rows = await db.select({ order: orders, payment: orderPayments }).from(orders).leftJoin(orderPayments, eq(orderPayments.orderId, orders.id)).orderBy(desc(orders.createdAt));
  const allItems = await db.select().from(orderItems);
  return rows.map(row => ({ ...row.order, items: allItems.filter(item => item.orderId === row.order.id), payment: row.payment?.id ? row.payment : null }));
}

export function isAllowedStatusTransition(currentStatus: "new" | "confirmed" | "preparing" | "ready" | "out_for_delivery" | "completed" | "cancelled", nextStatus: "confirmed" | "preparing" | "ready" | "out_for_delivery" | "completed") {
  const nextByCurrent = { new: "confirmed", confirmed: "preparing", preparing: "ready", ready: "out_for_delivery", out_for_delivery: "completed", completed: null, cancelled: null } as const;
  return nextByCurrent[currentStatus] === nextStatus;
}

export async function advanceOrderStatus(orderId: number, nextStatus: "confirmed" | "preparing" | "ready" | "out_for_delivery" | "completed") {
  const db = await getDb();
  if (!db) {
    const order = memoryOrders.find(o => o.id === orderId);
    if (!order) throw new Error("Order not found.");
    if (!isAllowedStatusTransition(order.status, nextStatus)) throw new Error("This order cannot move to that status.");
    order.status = nextStatus;
    return { ...order, status: nextStatus };
  }

  const existing = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  const order = existing[0];
  if (!order) throw new Error("Order not found.");
  if (!isAllowedStatusTransition(order.status, nextStatus)) throw new Error("This order cannot move to that status.");
  await db.update(orders).set({ status: nextStatus }).where(eq(orders.id, orderId));
  await db.insert(orderStatusHistory).values({ orderId, status: nextStatus, note: `Order marked ${nextStatus}.` });
  return { ...order, status: nextStatus };
}
