import { Link } from "wouter";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowRight, Coffee, Laptop, MapPin, Quote, Sparkles, Star } from "lucide-react";
import { CafeLayout } from "@/components/CafeLayout";
import { ProductArt } from "@/components/ProductArt";
import { Reveal, SteamLayer } from "@/components/motion/CinematicMotion";
import { overallRating, reviewTopics, suppliedReviews, totalReviews, type SuppliedReview } from "@/data/reviews";

type EditorialKind = "about" | "experience" | "reviews" | "privacy" | "terms";

const content: Record<EditorialKind, { eyebrow: string; title: string; intro: string }> = {
  about: { eyebrow: "About Coffeemistry", title: "Crafted for the in-between moments.", intro: "Coffeemistry is a specialty coffee cafe in F-8/1, Islamabad. We focus on coffee, comfort, and good moments — creating room for conversations, solo breaks, and an unhurried cup." },
  experience: { eyebrow: "The experience", title: "Your next productive hour deserves better coffee.", intro: "Settle into a cozy atmosphere with free Wi-Fi, seating, coffee, and a laptop-friendly environment. Coffeemistry is a cafe, not a coworking space — simply a warm setting for your day." },
  reviews: { eyebrow: "Customer reviews", title: "Customer reviews", intro: "Real experiences from Coffeemistry." },
  privacy: { eyebrow: "Privacy policy", title: "A policy awaiting owner confirmation.", intro: "Coffeemistry’s official privacy policy has not yet been supplied. This page is an editable placeholder and should be replaced with owner-approved policy text before public launch." },
  terms: { eyebrow: "Terms & conditions", title: "Terms awaiting owner confirmation.", intro: "Coffeemistry’s official terms, cancellation, and refund policies have not yet been supplied. This page is an editable placeholder and should be replaced with owner-approved policy text before public launch." },
};

export function EditorialPage({ kind }: { kind: EditorialKind }) {
  const copy = content[kind];
  const isLegal = kind === "privacy" || kind === "terms";

  return (
    <CafeLayout>
      {kind === "reviews" ? <ReviewsMetadata /> : null}
      <section className="relative overflow-hidden px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <div aria-hidden="true" className="absolute left-[13%] top-0 h-96 w-96 rounded-full bg-[#bd7239]/12 blur-[130px]" />
        <div aria-hidden="true" className="absolute right-[-10%] top-32 h-64 w-64 rounded-full bg-[#e4b878]/[.07] blur-[110px]" />
        <div className="relative mx-auto max-w-5xl">
          <Reveal blur={false}>
            <div className="glass-panel-soft inline-flex items-center gap-2 rounded-full px-4 py-2 text-[.62rem] font-bold uppercase tracking-[.2em] text-[#e4b878]">
              <Sparkles size={13} /> {copy.eyebrow}
            </div>
            <h1 className="mt-7 max-w-4xl font-display text-7xl leading-[.82] tracking-[-.06em] text-[#fff7eb] sm:text-8xl">{copy.title}</h1>
            <p className="mt-7 max-w-2xl text-sm leading-7 text-[#d3bca5] sm:text-base">{copy.intro}</p>
          </Reveal>
          {kind === "reviews" ? <RatingHeroSummary /> : null}
        </div>
      </section>
      {isLegal ? <LegalContent /> : <EditorialBody kind={kind} />}
    </CafeLayout>
  );
}

function LegalContent() {
  return (
    <section className="mx-auto max-w-5xl px-4 pb-24 sm:px-6">
      <Reveal>
        <div className="glass-panel rounded-[2rem] p-8 sm:p-10">
          <h2 className="font-display text-5xl leading-none text-[#fff4e8]">Owner-editable policy content</h2>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-[#cdb49b]">This is deliberately not a substitute for business-specific legal terms. Before activating payments or publishing formal policies, the owner should provide reviewed policy wording for this section.</p>
        </div>
      </Reveal>
    </section>
  );
}

function EditorialBody({ kind }: { kind: Exclude<EditorialKind, "privacy" | "terms"> }) {
  if (kind === "experience") return <section className="px-4 pb-24 sm:px-6 lg:px-8"><div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3"><Reveal><Panel icon={<Laptop />} title="Laptop-friendly" copy="A cozy atmosphere, free Wi-Fi, coffee, and seating make space for focused time." /></Reveal><Reveal delay={.08}><Panel icon={<Coffee />} title="Coffee & comfort" copy="A cafe experience shaped around specialty coffee, desserts, tea, and good company." /></Reveal><Reveal delay={.16}><Panel icon={<MapPin />} title="F-8/1, Islamabad." copy="An easy stop for dine-in, takeout, delivery, and curbside pickup." /></Reveal></div><Reveal className="mx-auto mt-14 max-w-7xl"><div className="glass-panel overflow-hidden rounded-[2rem] text-[#fffaf0] md:grid md:grid-cols-[.78fr_1.2fr]"><div className="relative border-b border-white/10 md:border-b-0 md:border-r"><ProductArt category="Espresso Based" className="min-h-64" /><SteamLayer /></div><div className="p-8 md:p-12"><p className="eyebrow">The coffee pause</p><h2 className="mt-5 font-display text-6xl leading-[.82] text-[#fff7eb]">Made to make a day feel lighter.</h2><Link href="/menu" className="cinematic-link mt-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-[#e4b878]">Explore the menu <ArrowRight size={15} /></Link></div></div></Reveal></section>;
  if (kind === "reviews") return <ReviewsContent />;
  return <section className="px-4 pb-24 sm:px-6 lg:px-8"><div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_.9fr] lg:items-center"><Reveal><div className="glass-panel rounded-[2rem] p-8 sm:p-10"><p className="eyebrow">What matters here</p><h2 className="mt-5 font-display text-6xl leading-[.82] tracking-[-.045em] text-[#fff5e9]">Coffee, craftsmanship, comfort, and community.</h2><p className="mt-7 max-w-xl text-sm leading-7 text-[#cdb49b]">The owner’s founding story has not yet been provided, so Coffeemistry shares only what is known: a specialty coffee-focused cafe with a calm, cozy, romantic, trendy, and upscale atmosphere.</p><Link href="/visit" className="cinematic-link mt-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-[#e4b878]">Visit Coffeemistry <ArrowRight size={15} /></Link></div></Reveal><Reveal delay={.1}><div className="relative overflow-hidden rounded-[2rem] border border-white/10"><ProductArt category="Espresso Based" className="min-h-[24rem]" /><SteamLayer /></div></Reveal></div></section>;
}

function RatingHeroSummary() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const reducedMotion = useReducedMotion();
  const displayedRating = useCountUp(overallRating, isInView);

  return (
    <motion.div ref={ref} className="mt-10 inline-flex flex-wrap items-center gap-x-5 gap-y-3 rounded-[1.35rem] border border-[#e4b878]/20 bg-[#120c09]/55 px-5 py-4 shadow-[0_18px_60px_rgba(0,0,0,.2)] backdrop-blur-xl sm:px-6" initial={{ opacity: 0, y: reducedMotion ? 0 : 12 }} animate={isInView ? { opacity: 1, y: 0 } : undefined} transition={{ duration: reducedMotion ? .01 : .55, ease: [0.23, 1, 0.32, 1] }} aria-label={`Rated ${overallRating} out of 5 from ${totalReviews} reviews`}>
      <span className="font-display text-5xl leading-none tracking-[-.06em] text-[#fff5e9]">{displayedRating.toFixed(1)}</span>
      <span className="flex items-center gap-1" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, index) => <motion.span key={index} initial={{ opacity: 0, scale: .86 }} animate={isInView ? { opacity: 1, scale: 1 } : undefined} transition={{ duration: reducedMotion ? .01 : .3, delay: reducedMotion ? 0 : .18 + index * .07, ease: [0.23, 1, 0.32, 1] }}><Star size={17} className="fill-[#e4b878] text-[#e4b878]" /></motion.span>)}
      </span>
      <span className="h-6 w-px bg-white/15" aria-hidden="true" />
      <motion.span initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : undefined} transition={{ duration: reducedMotion ? .01 : .4, delay: reducedMotion ? 0 : .54 }} className="text-[.68rem] font-bold uppercase tracking-[.18em] text-[#e8c48d]">{totalReviews} reviews</motion.span>
    </motion.div>
  );
}

function ReviewsContent() {
  const featuredReview = suppliedReviews[0];
  return (
    <section className="relative px-4 pb-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Reveal blur={false}>
          <article className="glass-panel relative overflow-hidden rounded-[2rem] p-7 sm:p-10 lg:grid lg:grid-cols-[1.05fr_.95fr] lg:gap-12 lg:p-12">
            <div aria-hidden="true" className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#e4b878]/10 blur-[95px]" />
            <div className="relative">
              <p className="eyebrow">Featured customer excerpt</p>
              <Quote className="mt-8 text-[#e4b878]/80" size={40} strokeWidth={1.4} aria-hidden="true" />
              <blockquote className="mt-5 max-w-2xl font-display text-4xl leading-[.95] tracking-[-.035em] text-[#fff4e8] sm:text-5xl">“{featuredReview.text}”</blockquote>
            </div>
            <div className="relative mt-10 flex flex-col justify-end lg:mt-0">
              <ReviewIdentity review={featuredReview} prominent />
              <p className="mt-7 max-w-md text-sm leading-7 text-[#cdb49b]">This excerpt is published as supplied. No review photos or videos have been added.</p>
            </div>
          </article>
        </Reveal>

        <div className="mt-16 grid gap-9 lg:grid-cols-[.77fr_1.23fr] lg:gap-14">
          <Reveal blur={false}>
            <aside className="glass-panel-soft rounded-[1.75rem] p-7 sm:p-8 lg:sticky lg:top-28">
              <p className="eyebrow">What guests mention</p>
              <h2 className="mt-5 max-w-full font-display text-4xl leading-[.86] tracking-[-.045em] text-[#fff4e8] sm:text-5xl">A few recurring notes.</h2>
              <p className="mt-5 text-sm leading-7 text-[#cdb49b]">These are aggregate topic counts. They are not assigned to any individual review.</p>
              <div className="mt-7 -mr-2 flex gap-2 overflow-x-auto pb-2 pr-2 lg:flex-wrap" aria-label="Aggregate review topics">
                {reviewTopics.map((topic, index) => <motion.span key={topic.label} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .3 }} transition={{ duration: .38, delay: index * .035, ease: [0.23, 1, 0.32, 1] }} className="shrink-0 rounded-full border border-[#e4b878]/18 bg-[#291b14]/70 px-3 py-2 text-[.64rem] font-bold uppercase tracking-[.12em] text-[#f0d4a4]">{topic.label} <span className="ml-1 text-[#b98a52]">{topic.count}</span></motion.span>)}
              </div>
            </aside>
          </Reveal>

          <div>
            <Reveal blur={false}><div className="flex items-end justify-between gap-6"><div><p className="eyebrow">Guest excerpts</p><h2 className="mt-4 font-display text-5xl leading-[.84] tracking-[-.045em] text-[#fff4e8]">In their own words.</h2></div><span className="hidden rounded-full border border-white/10 px-3 py-2 text-[.62rem] font-bold uppercase tracking-[.16em] text-[#cdb49b] sm:inline-flex">{suppliedReviews.length} supplied excerpts</span></div></Reveal>
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {suppliedReviews.map((review, index) => <Reveal key={review.name} delay={index * .065} blur={false}><ReviewCard review={review} /></Reveal>)}
            </div>
          </div>
        </div>

        <Reveal className="mt-16" blur={false}>
          <section className="rounded-[1.8rem] border border-[#e4b878]/18 bg-[#1c120e]/72 px-7 py-8 text-center shadow-[0_20px_70px_rgba(0,0,0,.16)] sm:px-12">
            <p className="eyebrow">Coffeemistry, through guests’ eyes</p>
            <h2 className="mt-4 font-display text-4xl leading-none text-[#fff4e8] sm:text-5xl">Real experiences. Real customers.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#cdb49b]">The excerpts above represent customer experiences at Coffeemistry and are displayed only from the supplied review material.</p>
            <Link href="/menu" className="cinematic-link mt-7 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-[#e4b878]">Explore the menu <ArrowRight size={15} /></Link>
          </section>
        </Reveal>
      </div>
    </section>
  );
}

function ReviewCard({ review }: { review: SuppliedReview }) {
  const [expanded, setExpanded] = useState(false);
  const reducedMotion = useReducedMotion();
  const canExpand = review.text.length > 150;

  return (
    <motion.article className="glass-panel cinematic-card flex h-full flex-col rounded-[1.55rem] border border-white/10 p-6 transition-[border-color,box-shadow] duration-200 hover:border-[#e4b878]/45 hover:shadow-[0_18px_50px_rgba(73,37,16,.25)]" whileHover={reducedMotion ? undefined : { y: -4 }} transition={{ duration: .18, ease: [0.23, 1, 0.32, 1] }}>
      <ReviewIdentity review={review} />
      <p className={`mt-6 text-sm leading-7 text-[#d7c1aa] ${canExpand && !expanded ? "line-clamp-4" : ""}`}>{review.text}</p>
      {canExpand ? <button type="button" onClick={() => setExpanded(value => !value)} className="mt-5 w-fit text-[.65rem] font-bold uppercase tracking-[.15em] text-[#e4b878] transition-colors duration-150 hover:text-[#fff0d8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e4b878] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a0f0b]">{expanded ? "Show less" : "Read more"}</button> : null}
    </motion.article>
  );
}

function ReviewIdentity({ review, prominent = false }: { review: SuppliedReview; prominent?: boolean }) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <h3 className={`${prominent ? "text-xl" : "text-base"} font-semibold text-[#fff4e8]`}>{review.name}</h3>
        {review.isLocalGuide ? <span className="rounded-full border border-[#e4b878]/25 bg-[#e4b878]/10 px-2 py-1 text-[.56rem] font-bold uppercase tracking-[.13em] text-[#f0cf9e]">Local Guide</span> : null}
      </div>
      <p className="mt-2 text-xs text-[#bba48d]">{review.metadata}</p>
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="flex items-center gap-0.5" aria-label={`${review.rating} out of 5 stars`}>{Array.from({ length: review.rating }).map((_, index) => <Star key={index} size={13} className="fill-[#e4b878] text-[#e4b878]" aria-hidden="true" />)}</span>
        <span className="h-3 w-px bg-white/15" aria-hidden="true" />
        <time className="text-[.64rem] font-bold uppercase tracking-[.13em] text-[#cfb396]">{review.date}</time>
      </div>
    </div>
  );
}

function useCountUp(target: number, active: boolean, duration = 720) {
  const reducedMotion = useReducedMotion();
  const [value, setValue] = useState(reducedMotion ? target : 0);

  useEffect(() => {
    if (!active) return;
    if (reducedMotion) {
      setValue(target);
      return;
    }
    let frame = 0;
    const startedAt = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, duration, reducedMotion, target]);

  return value;
}

function ReviewsMetadata() {
  useEffect(() => {
    const previousTitle = document.title;
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const previousDescription = description?.content;
    const hadDescription = Boolean(description);
    const activeDescription = description ?? document.head.appendChild(document.createElement("meta"));
    activeDescription.name = "description";
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const previousCanonical = canonical?.href;
    const hadCanonical = Boolean(canonical);
    const activeCanonical = canonical ?? document.head.appendChild(document.createElement("link"));
    activeCanonical.rel = "canonical";

    document.title = "Customer Reviews | Coffeemistry";
    activeDescription.content = "Read authentic customer review excerpts for Coffeemistry in F-8/1, Islamabad. Overall rating: 4.4 from 469 reviews.";
    activeCanonical.href = new URL("/reviews", window.location.origin).toString();

    return () => {
      document.title = previousTitle;
      if (hadDescription) activeDescription.content = previousDescription ?? "";
      else activeDescription.remove();
      if (hadCanonical) activeCanonical.href = previousCanonical ?? "";
      else activeCanonical.remove();
    };
  }, []);
  return null;
}

function Panel({ icon, title, copy }: { icon: ReactNode; title: string; copy: string }) { return <div className="glass-panel cinematic-card rounded-[1.7rem] p-7"><div className="text-[#e1ad68]">{icon}</div><h2 className="mt-8 font-display text-4xl leading-none text-[#fff4e8]">{title}</h2><p className="mt-4 text-sm leading-6 text-[#cdb49b]">{copy}</p></div>; }
