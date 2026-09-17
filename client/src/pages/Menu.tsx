import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Heart, Search, ShoppingBag, X, Check, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRoute } from "wouter";
import { CafeLayout } from "@/components/CafeLayout";
import { ProductImage } from "@/components/ProductImage";
import { ProductModal } from "@/components/ProductModal";
import { Reveal, cinematicEase } from "@/components/motion/CinematicMotion";
import { CafeProduct, formatPkr, useCafe } from "@/contexts/CafeContext";
import { trpc } from "@/lib/trpc";
import { DEFAULT_MENU_CATEGORIES } from "@/data/defaultMenu";

export default function MenuPage() {
  const [, params] = useRoute("/menu/:categorySlug");
  const menuQuery = trpc.menu.list.useQuery();
  const [activeCategory, setActiveCategory] = useState(params?.categorySlug ?? "all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CafeProduct | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (params?.categorySlug) setActiveCategory(params.categorySlug);
  }, [params?.categorySlug]);

  const rawCategories = useMemo(() => {
    if (menuQuery.data && menuQuery.data.length > 0) {
      return menuQuery.data;
    }
    return DEFAULT_MENU_CATEGORIES;
  }, [menuQuery.data]);

  const categories = useMemo(() => {
    return [{ slug: "all", name: "All" }, ...rawCategories];
  }, [rawCategories]);

  const products = useMemo(() => {
    return rawCategories.flatMap(category =>
      category.products.map(product => ({
        ...product,
        categorySlug: category.slug,
        categoryName: category.name,
      }))
    );
  }, [rawCategories]);

  const matchingProducts = useMemo(() => {
    const query = search.toLowerCase().trim();
    return products.filter(product => {
      const matchesCategory = activeCategory === "all" || product.categorySlug === activeCategory;
      if (!matchesCategory) return false;
      if (!query) return true;

      const searchableText = `${product.name} ${product.description} ${product.categoryName} ${product.categorySlug} ${product.size || ""}`.toLowerCase();

      if (query === "coffee") {
        return (
          product.categorySlug === "espresso-based" ||
          product.categorySlug === "slow-bar" ||
          searchableText.includes("coffee") ||
          searchableText.includes("espresso") ||
          searchableText.includes("latte")
        );
      }
      if (query === "cake") {
        return (
          product.categorySlug === "desserts" ||
          searchableText.includes("cake") ||
          searchableText.includes("pie") ||
          searchableText.includes("brownie")
        );
      }
      if (query === "chocolate") {
        return (
          searchableText.includes("chocolate") ||
          searchableText.includes("mocha") ||
          searchableText.includes("brownie")
        );
      }
      if (query === "sandwich") {
        return (
          product.categorySlug === "sandwiches" ||
          searchableText.includes("sandwich")
        );
      }

      return searchableText.includes(query);
    });
  }, [products, activeCategory, search]);

  return <CafeLayout>
    <section className="relative overflow-hidden px-4 pb-20 pt-28 sm:px-6 lg:px-8"><div aria-hidden="true" className="absolute left-1/2 top-0 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-[#bc7138]/12 blur-[130px]" /><div className="relative mx-auto max-w-7xl"><Reveal blur={false}><div className="glass-panel-soft inline-flex items-center gap-2 rounded-full px-4 py-2 text-[0.62rem] font-bold uppercase tracking-[.2em] text-[#e4b878]"><Sparkles size={13} /> The coffee list</div><h1 className="mt-7 font-display text-7xl leading-[.78] tracking-[-.06em] text-[#fff7eb] sm:text-8xl">The menu.</h1><p className="mt-6 max-w-xl text-sm leading-7 text-[#d2bba3]">Exactly the Coffeemistry menu, made easy to explore.</p></Reveal></div></section>
    <section className="px-4 pb-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {menuQuery.isError && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-amber-400" />
              <span>Live catalog sync paused. Displaying complete local menu catalog.</span>
            </div>
            <button
              onClick={() => menuQuery.refetch()}
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/20 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-amber-100 hover:bg-amber-500/30 transition"
            >
              <RefreshCw size={12} /> Retry Sync
            </button>
          </div>
        )}
        <Reveal>
          <div className="glass-panel rounded-[1.8rem] p-4 sm:p-5">
            <motion.label layout className="relative block max-w-xl" transition={{ duration: reducedMotion ? .01 : .35, ease: cinematicEase }}>
              <Search className="absolute left-5 top-1/2 size-4 -translate-y-1/2 text-[#d4a66d]" />
              <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search coffee, cake, chocolate, sandwich…" className="h-13 w-full rounded-2xl border border-white/12 bg-[#100b08]/55 pl-12 pr-12 text-sm text-[#f5eee4] outline-none transition-[border,box-shadow,transform] duration-300 placeholder:text-[#c0a891]/55 focus:scale-[1.005] focus:border-[#d4a66d]/65 focus:ring-4 focus:ring-[#c98d52]/10" />
              {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-[#d5bda5] transition hover:bg-white/8" aria-label="Clear search"><X size={15} /></button>}
            </motion.label>
            <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
              {categories.map(category => (
                <button
                  key={category.slug}
                  onClick={() => setActiveCategory(category.slug)}
                  className={`relative shrink-0 overflow-hidden rounded-full border px-4 py-2.5 text-[.66rem] font-bold uppercase tracking-[.13em] transition ${activeCategory === category.slug ? "border-[#e4b878]/45 text-[#160d09]" : "border-white/10 bg-white/[.035] text-[#d8c0a8] hover:border-[#d8a46a]/40 hover:text-[#f5eee4]"}`}
                >
                  {activeCategory === category.slug && (
                    <motion.span layoutId="active-menu-category" className="absolute inset-0 -z-10 rounded-full bg-[#e3b572]" transition={{ duration: reducedMotion ? .01 : .32, ease: cinematicEase }} />
                  )}
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </Reveal>
        {menuQuery.isLoading && !products.length ? (
          <MenuSkeleton />
        ) : matchingProducts.length ? (
          <AnimatePresence mode="wait">
            <motion.div key={`${activeCategory}:${search}`} initial={{ opacity: 0, y: reducedMotion ? 0 : 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reducedMotion ? 0 : -8 }} transition={{ duration: reducedMotion ? .01 : .28, ease: cinematicEase }} className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {matchingProducts.map((product, index) => <MenuCard key={product.id} product={product} index={index} onOpen={() => setSelected(product)} />)}
            </motion.div>
          </AnimatePresence>
        ) : (
          <motion.div initial={{ opacity: 0, scale: .98 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel mt-10 rounded-[1.8rem] px-6 py-16 text-center">
            <p className="font-display text-4xl text-[#f7ede2]">Nothing brewed for that search.</p>
            <p className="mt-3 text-sm text-[#cbb29a]">
              {search ? `No items found matching "${search}". Try searching for coffee, cake, chocolate, or sandwich.` : "No items found in this category."}
            </p>
          </motion.div>
        )}
      </div>
    </section>
    <ProductModal product={selected} onClose={() => setSelected(null)} />
  </CafeLayout>;
}

function MenuCard({ product, index, onOpen }: { product: CafeProduct; index: number; onOpen: () => void }) {
  const { addToCart, favorites, toggleFavorite } = useCafe();
  const [wasAdded, setWasAdded] = useState(false);
  const reducedMotion = useReducedMotion();
  useEffect(() => { if (!wasAdded) return; const timer = window.setTimeout(() => setWasAdded(false), 1250); return () => window.clearTimeout(timer); }, [wasAdded]);
  const quickAdd = () => { addToCart(product); setWasAdded(true); };
  return <motion.article initial={{ opacity: 0, y: reducedMotion ? 0 : 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reducedMotion ? 0 : Math.min(index * .035, .2), duration: reducedMotion ? .01 : .42, ease: cinematicEase }} className="glass-panel cinematic-card group overflow-hidden rounded-[1.75rem]"><div className="relative border-b border-white/10"><button onClick={onOpen} className="block w-full text-left" aria-label={`View ${product.name} details`}><ProductImage product={product} className="h-52 transition duration-700 group-hover:scale-[1.02]" /></button><div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#100a07]/46 to-transparent" /><motion.button whileTap={{ scale: .88 }} onClick={() => toggleFavorite(product.id)} className="absolute right-4 top-4 grid size-9 place-items-center rounded-full border border-white/16 bg-[#130d09]/60 text-[#edd7bd] shadow-sm backdrop-blur transition hover:scale-110 hover:border-[#e4b878]/60" aria-label={`Save ${product.name}`}><Heart size={16} fill={favorites.includes(product.id) ? "currentColor" : "none"} className={favorites.includes(product.id) ? "text-[#e2a766]" : ""} /></motion.button></div><div className="p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-[0.62rem] font-bold uppercase tracking-[.18em] text-[#d3a468]">{product.categoryName}</p><h2 className="mt-3 font-display text-4xl leading-none tracking-tight text-[#fff7eb]">{product.name}</h2></div><motion.span key={`${product.id}:${product.pricePkr}`} initial={{ opacity: .45, y: 4 }} animate={{ opacity: 1, y: 0 }} className="shrink-0 text-sm font-semibold tabular-nums text-[#e8b875]">{formatPkr(product.pricePkr)}</motion.span></div><p className="mt-4 min-h-12 text-sm leading-6 text-[#cbb39b]">{product.description}</p><div className="mt-6 flex items-center justify-between">{product.size ? <span className="rounded-full border border-white/10 bg-white/[.05] px-3 py-1 text-xs font-semibold text-[#d8c1aa]">{product.size}</span> : <span /> }<button onClick={quickAdd} className={`cinematic-button inline-flex h-10 items-center gap-2 rounded-full px-4 text-xs font-bold uppercase tracking-[.1em] ${wasAdded ? "bg-[#477255] text-[#f4fff6]" : "bg-[#e3b572] text-[#160d09] hover:bg-[#f3cf96]"}`}>{wasAdded ? <><Check size={14} /> Added</> : <><ShoppingBag size={14} /> Add</>}</button></div></div></motion.article>;
}

function MenuSkeleton() { return <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-[24rem] animate-pulse rounded-[1.75rem] border border-white/8 bg-white/[.04]" />)}</div>; }
