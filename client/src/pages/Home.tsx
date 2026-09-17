import { Armchair, ArrowRight, Check, Coffee, MapPin, ParkingCircle, Plus, Sparkles, Star, Wifi } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "wouter";
import { useState, type ReactNode } from "react";
import { CafeLayout } from "@/components/CafeLayout";
import { ProductImage } from "@/components/ProductImage";
import { Magnetic, Parallax, Reveal, SteamLayer, cinematicEase } from "@/components/motion/CinematicMotion";
import { trpc } from "@/lib/trpc";
import { formatPkr, useCafe, type CafeProduct } from "@/contexts/CafeContext";

const heroImage = "/manus-storage/coffeemistry-hero_a0f2021e_bc6c3382.jpg";

const CATEGORY_SHOWCASE = [
  {
    slug: "espresso-based",
    tag: "Espresso Bar",
    title: "Espresso Based",
    subtitle: "Classic & signature espresso crafts — velvety flat whites, concentrated cortados, and smooth lattes.",
    startingPrice: "From PKR 450",
    image: "/manus-storage/coffeemistry-cappuccino-source_5fec7cc8_f3bc18b4.jpg",
    alt: "Handcrafted artisan cappuccino with delicate latte art at Coffeemistry",
    pills: ["Cortado", "Cappuccino", "Spanish Latte", "Flat White"],
  },
  {
    slug: "slow-bar",
    tag: "Manual Brews",
    title: "Slow Bar",
    subtitle: "Single-origin specialty coffees extracted via precision V60 pour-over and pressurized Aeropress.",
    startingPrice: "From PKR 630",
    image: "/manus-storage/coffeemistry-signature-v60-source_53349e0f_bd8ec240.jpg",
    alt: "Signature V60 manual pour-over specialty coffee brewing at Coffeemistry",
    pills: ["Signature V60", "Iced V60", "Aeropress", "Iced Aeropress"],
  },
  {
    slug: "desserts",
    tag: "Artisan Bakery",
    title: "Desserts",
    subtitle: "Fudgy rich brownies, golden baked spiced apple pie, and refreshing glazed lemon cakes.",
    startingPrice: "From PKR 240",
    image: "/manus-storage/coffeemistry-brownie_50f718cd_8d1032d2.jpg",
    alt: "Fudgy artisanal chocolate brownie dessert at Coffeemistry",
    pills: ["Brownie", "Apple Pie", "Lemon Cake", "Cookies"],
  },
] as const;

const FEATURED_PRODUCTS_FALLBACK: CafeProduct[] = [
  {
    id: 8,
    slug: "spanish-latte",
    name: "Spanish Latte",
    categorySlug: "espresso-based",
    categoryName: "Espresso Based",
    size: "8 Oz.",
    description: "A sweeter & creamier latte crafted with rich espresso and silky textured milk.",
    pricePkr: 750,
    imageUrl: "/manus-storage/coffeemistry-spanish-latte-corrected_a541348d_c28c1697.jpg",
    imageAlt: "Artisan Spanish Latte with silky textured milk at Coffeemistry",
    customizationsEnabled: false,
    images: [{
      id: 108,
      url: "/manus-storage/coffeemistry-spanish-latte-corrected_a541348d_c28c1697.jpg",
      thumbnailUrl: "/manus-storage/coffeemistry-spanish-latte-corrected_a541348d_c28c1697.jpg",
      altText: "Artisan Spanish Latte with silky textured milk at Coffeemistry",
      caption: null,
      isPrimary: true,
      sortOrder: 0,
    }],
  },
  {
    id: 3,
    slug: "cortado",
    name: "Cortado",
    categorySlug: "espresso-based",
    categoryName: "Espresso Based",
    size: "4 Oz.",
    description: "A more concentrated latte with equal parts espresso and velvety steamed milk.",
    pricePkr: 630,
    imageUrl: "/manus-storage/coffeemistry-cortado-source_70c74d69_bacbf89b.jpg",
    imageAlt: "Smooth handcrafted Cortado espresso in a glass at Coffeemistry",
    customizationsEnabled: false,
    images: [{
      id: 103,
      url: "/manus-storage/coffeemistry-cortado-source_70c74d69_bacbf89b.jpg",
      thumbnailUrl: "/manus-storage/coffeemistry-cortado-source_70c74d69_bacbf89b.jpg",
      altText: "Smooth handcrafted Cortado espresso in a glass at Coffeemistry",
      caption: null,
      isPrimary: true,
      sortOrder: 0,
    }],
  },
  {
    id: 15,
    slug: "signature-v60-coffee",
    name: "Signature V60 Coffee",
    categorySlug: "slow-bar",
    categoryName: "Slow Bar",
    size: "Slow Bar",
    description: "Single-origin specialty coffee extracted via precision manual pour-over.",
    pricePkr: 880,
    imageUrl: "/manus-storage/coffeemistry-signature-v60-source_53349e0f_bd8ec240.jpg",
    imageAlt: "Signature V60 manual pour-over specialty coffee brewing at Coffeemistry",
    customizationsEnabled: false,
    images: [{
      id: 115,
      url: "/manus-storage/coffeemistry-signature-v60-source_53349e0f_bd8ec240.jpg",
      thumbnailUrl: "/manus-storage/coffeemistry-signature-v60-source_53349e0f_bd8ec240.jpg",
      altText: "Signature V60 manual pour-over specialty coffee brewing at Coffeemistry",
      caption: null,
      isPrimary: true,
      sortOrder: 0,
    }],
  },
  {
    id: 18,
    slug: "brownie",
    name: "Brownie",
    categorySlug: "desserts",
    categoryName: "Desserts",
    size: "Artisan Bakery",
    description: "Rich, fudgy chocolate treat baked to perfection daily.",
    pricePkr: 500,
    imageUrl: "/manus-storage/coffeemistry-brownie_50f718cd_8d1032d2.jpg",
    imageAlt: "Rich fudgy chocolate brownie dessert at Coffeemistry",
    customizationsEnabled: false,
    images: [{
      id: 118,
      url: "/manus-storage/coffeemistry-brownie_50f718cd_8d1032d2.jpg",
      thumbnailUrl: "/manus-storage/coffeemistry-brownie_50f718cd_8d1032d2.jpg",
      altText: "Rich fudgy chocolate brownie dessert at Coffeemistry",
      caption: null,
      isPrimary: true,
      sortOrder: 0,
    }],
  },
];

export default function Home() {
  const menuQuery = trpc.menu.list.useQuery();
  const { addToCart } = useCafe();
  const reducedMotion = useReducedMotion();
  const [addedSlugs, setAddedSlugs] = useState<Record<string, boolean>>({});

  const allProducts = menuQuery.data?.flatMap(category =>
    category.products.map(p => ({
      ...p,
      categorySlug: category.slug,
      categoryName: category.name,
    }))
  ) ?? [];

  const featuredProducts = FEATURED_PRODUCTS_FALLBACK.map(fallback => {
    const found = allProducts.find(p => p.slug === fallback.slug);
    if (!found) return fallback;
    return {
      ...fallback,
      ...found,
      categorySlug: found.categorySlug || fallback.categorySlug,
      categoryName: found.categoryName || fallback.categoryName,
      imageUrl: found.imageUrl || fallback.imageUrl,
      images: found.images && found.images.length > 0 ? found.images : fallback.images,
    };
  });

  const handleAddToCart = (product: CafeProduct) => {
    addToCart(product);
    setAddedSlugs(prev => ({ ...prev, [product.slug]: true }));
    window.setTimeout(() => {
      setAddedSlugs(prev => ({ ...prev, [product.slug]: false }));
    }, 1300);
  };

  return <CafeLayout>
    <section className="hero-section relative isolate -mt-[4.85rem] flex min-h-[calc(100svh+1rem)] items-end overflow-hidden px-4 pb-20 pt-36 sm:px-6 md:items-center md:pb-16 lg:px-8">
      <Parallax className="absolute inset-0" offset={10}><motion.img src={heroImage} alt="" aria-hidden="true" fetchPriority="high" loading="eager" decoding="async" className="absolute inset-0 h-full w-full origin-center object-cover object-center" initial={{ opacity: 0, scale: reducedMotion ? 1 : 1.05 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: reducedMotion ? .01 : 1.1, ease: cinematicEase }} /></Parallax>
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,6,4,.95)_0%,rgba(11,7,5,.78)_40%,rgba(11,7,5,.20)_100%)]" />
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_17%_72%,rgba(189,118,61,.18),transparent_25rem),linear-gradient(0deg,rgba(11,8,6,.88)_0%,transparent_43%)]" />
      <div aria-hidden="true" className="absolute left-[10%] top-[23%] h-px w-[18rem] bg-gradient-to-r from-[#e4b878]/80 to-transparent" />
      <SteamLayer className="hero-steam opacity-70" />
      <motion.div className="relative z-10 mx-auto w-full max-w-7xl" initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: reducedMotion ? 0 : .1, delayChildren: reducedMotion ? 0 : .08 } } }}>
        <motion.div variants={heroItem(reducedMotion, 12)} className="glass-panel-soft mb-6 inline-flex items-center gap-3 rounded-full px-4 py-2 text-[0.62rem] font-bold uppercase tracking-[.22em] text-[#e7bd80]"><Sparkles size={13} /> F-8/1, Islamabad.</motion.div>
        <motion.h1 variants={heroItem(reducedMotion, 28)} className="max-w-3xl font-display text-7xl leading-[.78] tracking-[-.06em] text-[#fff9f1] sm:text-8xl lg:text-[8.4rem]">Coffeemistry<span className="text-[#e1b16f]">.</span></motion.h1>
        <motion.p variants={heroItem(reducedMotion, 16)} className="mt-7 max-w-xl font-display text-3xl leading-[.95] text-[#f4e5d1] sm:text-4xl">Specialty Coffee. Crafted Moments.</motion.p>
        <motion.p variants={heroItem(reducedMotion, 16)} className="mt-5 max-w-md text-sm leading-7 text-[#f4e5d1]/72 sm:text-base">Coffee, comfort and good moments in the heart of F-8, Islamabad.</motion.p>
        <motion.div variants={heroItem(reducedMotion, 12)} className="mt-9 flex flex-wrap gap-3"><Magnetic><Link href="/menu" className="cinematic-button inline-flex h-12 items-center gap-2 rounded-full bg-[#e3b572] px-6 text-xs font-bold uppercase tracking-[.15em] text-[#160d09] hover:bg-[#f3cf96]">Order now <ArrowRight size={16} /></Link></Magnetic><Magnetic><a href="#menu-preview" className="glass-panel-soft cinematic-button inline-flex h-12 items-center rounded-full px-6 text-xs font-bold uppercase tracking-[.15em] text-[#fff9f1] hover:bg-white/10">Explore menu</a></Magnetic></motion.div>
        <motion.div variants={heroItem(reducedMotion, 10)} className="mt-12 flex items-center gap-4 text-[0.7rem] font-medium uppercase tracking-[.18em] text-[#f3e1ca]/66"><span>Specialty coffee</span><span className="size-1 rounded-full bg-[#dca968]" /><span>Slow bar</span><span className="size-1 rounded-full bg-[#dca968]" /><span>Desserts</span></motion.div>
      </motion.div>
      <div className="absolute bottom-0 left-0 right-0 z-10 h-32 bg-gradient-to-t from-[#0b0806] to-transparent" />
    </section>

    <section className="relative px-4 py-24 sm:px-6 lg:px-8"><div className="absolute left-1/2 top-8 h-72 w-72 -translate-x-1/2 rounded-full bg-[#b86f3a]/10 blur-[100px]" /><div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-end"><Reveal><p className="eyebrow">A moment for yourself</p><h2 className="mt-5 max-w-xl font-display text-6xl leading-[.82] tracking-[-.045em] text-[#f8efe4] sm:text-7xl">Made for slow mornings and warm evenings.</h2><p className="mt-7 max-w-md text-sm leading-7 text-[#cfbba4]">A quiet future-facing space shaped around your familiar coffee rituals.</p></Reveal><div className="grid gap-4 sm:grid-cols-2"><Reveal delay={.03}><Fact icon={<Coffee />} number="01" title="Coffee-led" copy="Great coffee, great dessert, and a thoughtful tea selection." /></Reveal><Reveal delay={.08}><Fact icon={<Wifi />} number="02" title="Stay awhile" copy="Free Wi-Fi, seating, and a calm place for laptop work." /></Reveal><Reveal delay={.13}><Fact icon={<Armchair />} number="03" title="Easy atmosphere" copy="Casual, cozy, romantic, trendy, and quietly upscale." /></Reveal><Reveal delay={.18}><Fact icon={<ParkingCircle />} number="04" title="Simple to visit" copy="Free parking, street parking, and accessible parking." /></Reveal></div></div></section>

    <section id="menu-preview" className="relative px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="luxury-rule" />
        <Reveal className="mt-12 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Crafted for your palate</p>
            <h2 className="mt-3 font-display text-6xl tracking-[-.045em] text-[#f8efe4] sm:text-7xl">
              Explore our menu.
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-[#cfbba4]">
              Signature espresso crafts, single-origin manual slow bar brews, and artisan desserts prepared fresh daily in F-8/1, Islamabad.
            </p>
          </div>
          <Link
            href="/menu"
            className="cinematic-link inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.15em] text-[#e4b878] transition hover:text-[#fff5ea]"
          >
            See full menu <ArrowRight size={16} />
          </Link>
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {CATEGORY_SHOWCASE.map((cat, index) => {
            const category = menuQuery.data?.find(item => item.slug === cat.slug);
            const count = category?.products?.length;
            const cardImage = category?.products?.find(p => p.imageUrl)?.imageUrl || cat.image;

            return (
              <Reveal key={cat.slug} delay={index * 0.08}>
                <Link
                  href={`/menu/${cat.slug}`}
                  className="cinematic-card group relative block h-[31rem] overflow-hidden rounded-[2.2rem] border border-white/10 bg-[#120b08] text-[#fffaf0] shadow-2xl transition duration-500 hover:border-[#e4b878]/50 hover:shadow-[0_22px_55px_rgba(227,181,114,0.14)]"
                >
                  {/* High-Resolution Background Product Photography */}
                  <div className="absolute inset-0 overflow-hidden">
                    <img
                      src={cardImage}
                      alt={cat.alt}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover object-center brightness-[0.70] contrast-[1.08] saturate-[0.95] transition-transform duration-700 ease-out group-hover:scale-108"
                    />
                  </div>

                  {/* Multi-layer ambient luxury gradients for contrast and readability */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-[#0e0906] via-[#0e0906]/70 to-black/25 transition-opacity duration-300 group-hover:via-[#0e0906]/55"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(227,181,114,0.18),transparent_65%)]"
                  />

                  {/* Top Bar: Category Pill & Starting Price */}
                  <div className="relative flex items-center justify-between p-6 sm:p-7">
                    <span className="glass-panel-soft inline-flex items-center gap-2 rounded-full border border-white/15 px-3.5 py-1.5 text-[0.62rem] font-bold uppercase tracking-[.18em] text-[#e7bd80] backdrop-blur-md">
                      <span className="size-1.5 rounded-full bg-[#e3b572]" />
                      {cat.tag}
                    </span>
                    <span className="glass-panel-soft rounded-full border border-white/10 px-3 py-1 text-[0.68rem] font-semibold text-[#f5ebd9] backdrop-blur-md">
                      {cat.startingPrice}
                    </span>
                  </div>

                  {/* Bottom Content Area */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-7">
                    <div className="flex items-center justify-between">
                      <p className="text-[0.64rem] font-bold uppercase tracking-[.2em] text-[#e4b878]">
                        0{index + 1} {count ? `· ${count} Selections` : ""}
                      </p>
                      <span className="grid size-8 place-items-center rounded-full border border-white/10 bg-white/5 text-[#e4b878] transition duration-300 group-hover:bg-[#e3b572] group-hover:text-[#160d09] group-hover:border-[#e3b572]">
                        <ArrowRight size={14} />
                      </span>
                    </div>

                    <h3 className="mt-2 font-display text-4xl leading-tight text-[#fff9f1] transition-colors group-hover:text-[#f8d8a2] sm:text-5xl">
                      {category?.name ?? cat.title}
                    </h3>

                    <p className="mt-3 line-clamp-2 text-xs leading-5 text-[#dfcfbe]">
                      {cat.subtitle}
                    </p>

                    {/* Popular item chips */}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {cat.pills.map(item => (
                        <span
                          key={item}
                          className="rounded-full border border-white/10 bg-black/40 px-2.5 py-0.5 text-[0.62rem] font-medium text-[#ead9c4] backdrop-blur-sm"
                        >
                          {item}
                        </span>
                      ))}
                    </div>

                    {/* Footer link line */}
                    <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                      <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-[#e4b878] transition-colors group-hover:text-[#fff9f0]">
                        Browse {cat.title}
                        <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1.5" />
                      </span>
                      <span className="text-[0.68rem] text-[#cbb39b]/70">Order in café or pickup</span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>

    {/* Featured Selections: Spanish Latte + 3 more crafts in a responsive grid */}
    <section id="featured-selections" className="relative px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="luxury-rule" />
        <Reveal className="mt-12 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Signature crafts & favorites</p>
            <h2 className="mt-3 font-display text-5xl tracking-[-.045em] text-[#f8efe4] sm:text-6xl">
              Featured selections.
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-[#cfbba4]">
              A sweeter & creamier Spanish Latte alongside our standout espresso, slow bar, and dessert favorites.
            </p>
          </div>
          <Link
            href="/menu"
            className="cinematic-link inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.15em] text-[#e4b878] transition hover:text-[#fff5ea]"
          >
            Explore all menu items <ArrowRight size={16} />
          </Link>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featuredProducts.map((product, idx) => {
            const isAdded = Boolean(addedSlugs[product.slug]);
            return (
              <Reveal key={product.slug} delay={idx * 0.05}>
                <div className="glass-panel group relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-white/10 transition-all duration-300 hover:border-[#e4b878]/40 hover:shadow-[0_16px_36px_rgba(0,0,0,0.45)]">
                  {/* Product Image Area */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#160e0a]">
                    <ProductImage
                      product={product}
                      mode="card"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      priority={idx < 2}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#100a07] via-transparent to-black/20" />
                    <SteamLayer className="opacity-30" />

                    {/* Category pill */}
                    <div className="absolute left-3.5 top-3.5">
                      <span className="glass-panel-soft inline-block rounded-full px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[.14em] text-[#e4b878] shadow-sm backdrop-blur-md">
                        {product.categoryName}
                      </span>
                    </div>

                    {/* Size pill */}
                    {product.size && (
                      <div className="absolute right-3.5 top-3.5">
                        <span className="rounded-full border border-white/15 bg-black/55 px-2.5 py-1 text-[0.62rem] font-semibold text-[#f3e7d2] backdrop-blur-md">
                          {product.size}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Product Content */}
                  <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
                    <div>
                      <h3 className="font-display text-2xl leading-tight text-[#fff9f1] transition-colors group-hover:text-[#f8d8a2] sm:text-3xl">
                        {product.name}
                      </h3>
                      <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-[#dfcfbe]">
                        {product.description}
                      </p>
                    </div>

                    {/* Price and Add to Cart Action */}
                    <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                      <div>
                        <span className="block text-[0.62rem] font-bold uppercase tracking-[.18em] text-[#e4b878]/75">
                          Price
                        </span>
                        <span className="font-display text-2xl text-[#e6b979]">
                          {formatPkr(product.pricePkr)}
                        </span>
                      </div>

                      <button
                        onClick={() => handleAddToCart(product)}
                        aria-label={`Add ${product.name} to cart`}
                        className={`cinematic-button inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-xs font-bold uppercase tracking-[.12em] transition-all duration-200 active:scale-95 ${
                          isAdded
                            ? "bg-[#61b15a] text-white"
                            : "bg-[#e3b572] text-[#160d09] hover:bg-[#f3cf96]"
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check size={14} className="stroke-[2.5]" /> Added
                          </>
                        ) : (
                          <>
                            <Plus size={14} className="stroke-[2.5]" /> Add to cart
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>

    <section id="experience" className="px-4 py-24 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl"><Reveal><div className="glass-panel-soft max-w-2xl rounded-[2rem] p-8 sm:p-10"><p className="eyebrow">More than coffee</p><h2 className="mt-4 font-display text-6xl leading-[.82] tracking-[-.045em] text-[#f8efe4] sm:text-7xl">A table for every kind of day.</h2></div></Reveal><div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{["Specialty Coffee", "Laptop Friendly", "Free Wi-Fi", "Outdoor Seating", "Free Parking", "Accessible Parking", "Kid Friendly", "Desserts"].map((item, index) => <Reveal key={item} delay={(index % 4) * .04}><div className="cinematic-card border-t border-[#e7bd80]/25 pt-5"><p className="text-[0.65rem] font-bold tracking-[.18em] text-[#d6a468]">0{index + 1}</p><p className="mt-4 font-display text-3xl text-[#f3e7d2]">{item}</p></div></Reveal>)}</div></div></section>

    <section id="reviews" className="px-4 py-12 sm:px-6 lg:px-8"><div className="glass-panel mx-auto grid max-w-7xl gap-10 rounded-[2rem] p-8 sm:p-12 lg:grid-cols-[.9fr_1.1fr] lg:items-end"><Reveal><p className="eyebrow">The Coffeemistry approach</p><h2 className="mt-5 font-display text-6xl leading-[.82] tracking-[-.05em] text-[#fff6ea] sm:text-7xl">Coffee, comfort, and good moments.</h2></Reveal><Reveal delay={.08}><p className="max-w-xl font-display text-4xl leading-[.95] text-[#f0dfca]">The menu is ready to explore, order, and enjoy in F-8/1, Islamabad.</p><p className="mt-5 text-sm leading-7 text-[#c8b19a]">Coffeemistry does not display ratings, review counts, quotations, or testimonials until verified customer feedback is supplied for publication.</p></Reveal></div></section>

    <section id="visit" className="relative px-4 py-24 sm:px-6 lg:px-8"><div aria-hidden="true" className="absolute bottom-0 right-[10%] h-72 w-72 rounded-full bg-[#be773e]/10 blur-[110px]" /><div className="glass-panel relative mx-auto flex max-w-7xl flex-col justify-between gap-10 overflow-hidden rounded-[2.2rem] p-8 sm:p-12 md:flex-row md:items-end"><div aria-hidden="true" className="absolute -right-20 -top-24 h-64 w-64 rounded-full border border-[#e4b878]/20" /><Reveal><p className="eyebrow">Visit us</p><h2 className="mt-4 font-display text-6xl tracking-[-.045em] text-[#fff7ec] sm:text-7xl">Let’s make time.</h2><p className="mt-6 text-sm leading-6 text-[#f3e7d2]/70">F-8/1, Islamabad.</p><p className="mt-1 text-sm text-[#f3e7d2]/70">+92 307 8263333</p></Reveal><Reveal delay={.1}><div className="flex flex-wrap gap-3"><Magnetic><Link href="/visit" className="cinematic-button inline-flex h-12 items-center rounded-full bg-[#e3b572] px-6 text-xs font-bold uppercase tracking-[.14em] text-[#160d09]">Visit Coffeemistry</Link></Magnetic><a href="https://www.google.com/maps/search/?api=1&query=Shop%201%20%26%202%2C%20Block%208%20Allahwali%20Market%2C%20F-8%2F1%2C%20Islamabad" target="_blank" rel="noreferrer" className="glass-panel-soft cinematic-button inline-flex h-12 items-center gap-2 rounded-full px-6 text-xs font-bold uppercase tracking-[.14em] text-[#f8efe4]"><MapPin size={15} /> Directions</a></div></Reveal></div></section>
  </CafeLayout>;
}

function heroItem(reducedMotion: boolean | null, y: number) { return { hidden: { opacity: 0, y: reducedMotion ? 0 : y, filter: reducedMotion ? "blur(0px)" : "blur(7px)" }, show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: reducedMotion ? .01 : .56, ease: cinematicEase } } }; }
function Fact({ icon, number, title, copy }: { icon: ReactNode; number: string; title: string; copy: string }) { return <div className="glass-panel-soft cinematic-card rounded-[1.6rem] p-6"><div className="flex items-center justify-between"><span className="text-[#e4b878]">{icon}</span><span className="text-[0.62rem] font-bold tracking-[.16em] text-[#c89c62]">{number}</span></div><h3 className="mt-8 font-display text-3xl leading-none text-[#f7eee2]">{title}</h3><p className="mt-3 text-sm leading-6 text-[#c8b09a]">{copy}</p></div>; }
