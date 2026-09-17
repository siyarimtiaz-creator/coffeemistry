import { TRPCError } from "@trpc/server";
import { customAlphabet } from "nanoid";
import { z } from "zod";
import { COOKIE_NAME } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import { advanceOrderStatus, createOrder, getAdminOrders, getCheckoutQuote, getOrderForCustomer, getPublicMenu } from "./db";
import { getAdminProductsWithImages, removeProductImage, reorderProductImages, replaceProductImage, updateProductImage, uploadProductImage, validateProductImageDataUrl } from "./productMedia";

const orderNumber = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);
const orderItemInput = z.object({ productId: z.number().int().positive(), quantity: z.number().int().min(1).max(12), customizationsJson: z.string().max(2000).optional() });
const encodedImageInput = z.object({ dataUrl: z.string().min(32).max(15_000_000).regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/, "Upload a JPG, PNG, or WebP image."), width: z.number().int().positive().max(5000).optional(), height: z.number().int().positive().max(5000).optional() });
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  menu: router({ list: publicProcedure.query(async () => getPublicMenu()) }),
  order: router({
    quote: publicProcedure.input(z.object({ orderType: z.enum(["pickup", "delivery"]), items: z.array(orderItemInput).min(1).max(20) })).query(async ({ input }) => {
      const distinctItemIds = new Set(input.items.map(item => item.productId));
      if (distinctItemIds.size !== input.items.length) throw new TRPCError({ code: "BAD_REQUEST", message: "Each menu item can appear once in an order." });
      try { return await getCheckoutQuote(input); }
      catch (error) { throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Unable to calculate the order total." }); }
    }),
    create: publicProcedure
      .input(z.object({
        customerName: z.string().trim().min(2).max(160), phone: z.string().trim().min(7).max(40), whatsapp: z.string().trim().min(7).max(40).optional(), orderType: z.enum(["pickup", "delivery"]), deliveryAddress: z.string().trim().min(5).max(800).optional(), area: z.string().trim().max(100).optional(), deliveryInstructions: z.string().trim().max(800).optional(), notes: z.string().trim().max(800).optional(), items: z.array(orderItemInput).min(1).max(20),
      }))
      .mutation(async ({ input }) => {
        if (input.orderType === "delivery" && !input.deliveryAddress) throw new TRPCError({ code: "BAD_REQUEST", message: "A delivery address is required for delivery orders." });
        const distinctItemIds = new Set(input.items.map(item => item.productId));
        if (distinctItemIds.size !== input.items.length) throw new TRPCError({ code: "BAD_REQUEST", message: "Each menu item can appear once in an order." });
        try {
          const generatedOrderNumber = `CFM-${orderNumber()}`;
          return await createOrder({ ...input, orderNumber: generatedOrderNumber });
        } catch (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Unable to create order." });
        }
      }),
    track: publicProcedure.input(z.object({ orderNumber: z.string().trim().min(6).max(24), phone: z.string().trim().min(7).max(40) })).query(async ({ input }) => getOrderForCustomer(input.orderNumber, input.phone)),
  }),
  admin: router({
    orders: adminProcedure.query(async () => getAdminOrders()),
    products: adminProcedure.query(async () => getAdminProductsWithImages()),
    uploadProductImage: adminProcedure.input(z.object({ productId: z.number().int().positive(), image: encodedImageInput, thumbnail: encodedImageInput.optional(), altText: z.string().trim().max(260).optional(), caption: z.string().trim().max(500).optional(), originalFilename: z.string().trim().regex(/^[A-Za-z0-9][A-Za-z0-9._ -]{0,254}$/).optional(), setPrimary: z.boolean().optional() })).mutation(async ({ input }) => ({ id: await uploadProductImage(input) })),
    replaceProductImage: adminProcedure.input(z.object({ productId: z.number().int().positive(), imageId: z.number().int().positive(), image: encodedImageInput, thumbnail: encodedImageInput.optional(), altText: z.string().trim().max(260).optional(), caption: z.string().trim().max(500).optional(), originalFilename: z.string().trim().regex(/^[A-Za-z0-9][A-Za-z0-9._ -]{0,254}$/).optional() })).mutation(async ({ input }) => ({ id: await replaceProductImage(input) })),
    updateProductImage: adminProcedure.input(z.object({ id: z.number().int().positive(), productId: z.number().int().positive(), altText: z.string().trim().min(2).max(260), caption: z.string().trim().max(500).optional(), isPrimary: z.boolean() })).mutation(async ({ input }) => ({ id: await updateProductImage(input) })),
    reorderProductImages: adminProcedure.input(z.object({ productId: z.number().int().positive(), imageIds: z.array(z.number().int().positive()).min(1).max(20) })).mutation(async ({ input }) => { await reorderProductImages(input.productId, input.imageIds); return { success: true }; }),
    deleteProductImage: adminProcedure.input(z.object({ productId: z.number().int().positive(), imageId: z.number().int().positive() })).mutation(async ({ input }) => { await removeProductImage(input.productId, input.imageId); return { success: true }; }),
    advanceOrder: adminProcedure.input(z.object({ orderId: z.number().int().positive(), status: z.enum(["confirmed", "preparing", "ready", "out_for_delivery", "completed"]) })).mutation(async ({ input }) => {
      try { return await advanceOrderStatus(input.orderId, input.status); }
      catch (error) { throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Unable to update order." }); }
    }),
  }),
});

export type AppRouter = typeof appRouter;
