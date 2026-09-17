import { motion } from "framer-motion";
import { useState } from "react";
import type { CafeProduct } from "@/contexts/CafeContext";

export function ProductImage({ product, className = "", priority = false, mode = "card" }: { product: CafeProduct; className?: string; priority?: boolean; mode?: "card" | "detail" | "featured" }) {
  const imageUrl = mode === "card" ? product.images?.find(image => image.isPrimary)?.thumbnailUrl ?? product.imageUrl : product.images?.find(image => image.isPrimary)?.url ?? product.imageUrl;
  const alt = product.imageAlt || `${product.name} at Coffeemistry in Islamabad`;
  const [hasImageError, setHasImageError] = useState(false);
  if (!imageUrl || hasImageError) return <div className={`relative grid place-items-center overflow-hidden bg-[radial-gradient(circle_at_50%_35%,#9b6344_0%,#5f2d20_38%,#24110b_100%)] ${className}`} role="img" aria-label={`Product image placeholder for ${product.name}`}><span aria-hidden="true" className="absolute h-36 w-36 rounded-full border border-[#f3e7d2]/15" /><div className="relative px-5 text-center text-[#fffaf0]"><p className="text-[.65rem] font-bold uppercase tracking-[.2em] text-[#d6b47c]">Coffeemistry</p><p className="mt-2 font-display text-2xl">Product image</p><p className="mt-2 text-xs leading-5 text-[#f3e7d2]/75">Photography placeholder · {product.name}</p></div></div>;
  const sizes = mode === "card" ? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" : mode === "featured" ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 100vw, 66vw";
  return <div className={`relative overflow-hidden bg-[#eadbc4] ${className}`}><motion.img src={imageUrl} alt={alt} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" sizes={sizes} initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .45 }} onError={() => setHasImageError(true)} className="h-full w-full object-cover brightness-[.94] contrast-[1.03] saturate-[.92] sepia-[.06] transition duration-500 group-hover:scale-[1.03]" /></div>;
}
