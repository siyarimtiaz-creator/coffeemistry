import { and, asc, eq, inArray } from "drizzle-orm";
import { imageSize } from "image-size";
import { productImages, products } from "../drizzle/schema";
import { getDb, invalidatePublicMenuCache } from "./db";
import { storagePut } from "./storage";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const imageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

type EncodedImage = { dataUrl: string; width?: number; height?: number };
function safeOriginalFilename(filename?: string) {
  if (!filename) return null;
  const normalized = filename.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._ -]{0,254}$/.test(normalized)) throw new Error("Image filename contains unsupported characters.");
  return normalized;
}

export function validateProductImageDataUrl({ dataUrl }: EncodedImage) {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match || !imageMimeTypes.has(match[1])) throw new Error("Upload a JPG, PNG, or WebP image.");
  const bytes = Buffer.from(match[2], "base64");
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) throw new Error("Image must be between 1 byte and 10 MB after optimization.");
  let metadata: ReturnType<typeof imageSize>;
  try { metadata = imageSize(bytes); } catch { throw new Error("The uploaded file is not a valid image matching its declared format."); }
  const detectedMime = metadata.type === "jpg" ? "image/jpeg" : metadata.type === "png" ? "image/png" : metadata.type === "webp" ? "image/webp" : null;
  if (!detectedMime || detectedMime !== match[1] || !metadata.width || !metadata.height) throw new Error("The uploaded file is not a valid image matching its declared format.");
  if (metadata.width > 5000 || metadata.height > 5000) throw new Error("Image dimensions must not exceed 5000 pixels.");
  return { bytes, mimeType: detectedMime, width: metadata.width, height: metadata.height };
}

function extensionFor(mimeType: string) { return mimeType === "image/png" ? "png" : mimeType === "image/jpeg" ? "jpg" : "webp"; }

export function defaultProductAlt(name: string) { return `${name} at Coffeemistry in Islamabad`; }
export function isSupportedProductImageMime(mimeType: string) { return imageMimeTypes.has(mimeType); }
export function choosePrimaryImageFallback<T extends { sortOrder: number; id: number }>(images: T[]) { return [...images].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)[0] ?? null; }

export async function getAdminProductsWithImages() {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  const [productRows, imageRows] = await Promise.all([
    db.select({ product: products }).from(products).orderBy(asc(products.name)),
    db.select().from(productImages).orderBy(asc(productImages.sortOrder), asc(productImages.id)),
  ]);
  return productRows.map(row => ({ ...row.product, images: imageRows.filter(image => image.productId === row.product.id) }));
}

export async function uploadProductImage(input: { productId: number; image: EncodedImage; thumbnail?: EncodedImage; altText?: string; caption?: string; originalFilename?: string; setPrimary?: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  const product = (await db.select().from(products).where(eq(products.id, input.productId)).limit(1))[0];
  if (!product) throw new Error("Product not found.");
  const image = validateProductImageDataUrl(input.image);
  const thumbnail = input.thumbnail ? validateProductImageDataUrl(input.thumbnail) : undefined;
  const productPath = `products/${product.slug}`;
  const full = await storagePut(`${productPath}/display.${extensionFor(image.mimeType)}`, image.bytes, image.mimeType);
  const thumb = thumbnail ? await storagePut(`${productPath}/thumbnail.${extensionFor(thumbnail.mimeType)}`, thumbnail.bytes, thumbnail.mimeType) : undefined;
  const existing = await db.select().from(productImages).where(eq(productImages.productId, product.id));
  const isPrimary = input.setPrimary || existing.length === 0;
  if (isPrimary) await db.update(productImages).set({ isPrimary: false }).where(eq(productImages.productId, product.id));
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
    sortOrder: existing.length,
  });
  if (isPrimary) await db.update(products).set({ imageUrl: full.url }).where(eq(products.id, product.id));
  invalidatePublicMenuCache();
  return Number(result[0].insertId);
}

export async function updateProductImage(input: { id: number; productId: number; altText: string; caption?: string; isPrimary: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  const image = (await db.select().from(productImages).where(and(eq(productImages.id, input.id), eq(productImages.productId, input.productId))).limit(1))[0];
  if (!image) throw new Error("Product image not found.");
  if (input.isPrimary) await db.update(productImages).set({ isPrimary: false }).where(eq(productImages.productId, input.productId));
  await db.update(productImages).set({ altText: input.altText.trim(), caption: input.caption?.trim() || null, isPrimary: input.isPrimary }).where(eq(productImages.id, input.id));
  if (input.isPrimary) await db.update(products).set({ imageUrl: image.url }).where(eq(products.id, input.productId));
  invalidatePublicMenuCache();
  return input.id;
}

export async function replaceProductImage(input: { productId: number; imageId: number; image: EncodedImage; thumbnail?: EncodedImage; altText?: string; caption?: string; originalFilename?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  const existing = (await db.select().from(productImages).where(and(eq(productImages.id, input.imageId), eq(productImages.productId, input.productId))).limit(1))[0];
  if (!existing) throw new Error("Product image not found.");
  const id = await uploadProductImage({ productId: input.productId, image: input.image, thumbnail: input.thumbnail, altText: input.altText ?? existing.altText, caption: input.caption ?? existing.caption ?? undefined, originalFilename: input.originalFilename, setPrimary: existing.isPrimary });
  await removeProductImage(input.productId, input.imageId);
  return id;
}

export async function reorderProductImages(productId: number, imageIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  const owned = await db.select({ id: productImages.id }).from(productImages).where(and(eq(productImages.productId, productId), inArray(productImages.id, imageIds)));
  if (owned.length !== imageIds.length) throw new Error("One or more images do not belong to this product.");
  await Promise.all(imageIds.map((id, sortOrder) => db.update(productImages).set({ sortOrder }).where(eq(productImages.id, id))));
  invalidatePublicMenuCache();
}

export async function removeProductImage(productId: number, imageId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  const image = (await db.select().from(productImages).where(and(eq(productImages.id, imageId), eq(productImages.productId, productId))).limit(1))[0];
  if (!image) throw new Error("Product image not found.");
  await db.delete(productImages).where(eq(productImages.id, imageId));
  if (image.isPrimary) {
    const remaining = await db.select().from(productImages).where(eq(productImages.productId, productId)).orderBy(asc(productImages.sortOrder), asc(productImages.id));
    const next = choosePrimaryImageFallback(remaining);
    if (next) {
      await db.update(productImages).set({ isPrimary: true }).where(eq(productImages.id, next.id));
      await db.update(products).set({ imageUrl: next.url }).where(eq(products.id, productId));
    } else {
      await db.update(products).set({ imageUrl: null }).where(eq(products.id, productId));
    }
  }
  invalidatePublicMenuCache();
}
