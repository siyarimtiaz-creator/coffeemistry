import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, MessageCircle, Search, ShoppingBag, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { CafeBrand } from "@/components/CafeBrand";
import { useCafe } from "@/contexts/CafeContext";
import { Magnetic, Reveal, cinematicEase } from "@/components/motion/CinematicMotion";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Menu", href: "/menu" },
  { label: "About", href: "/about" },
  { label: "Experience", href: "/experience" },
  { label: "Reviews", href: "/reviews" },
  { label: "Visit us", href: "/visit" },
];

const CartDrawer = lazy(() => import("@/components/CartDrawer").then(module => ({ default: module.CartDrawer })));

export function CafeLayout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();
  const { cartCount } = useCafe();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 18);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <div className="cafe-shell min-h-screen overflow-x-clip text-[#f5eee4]">
      <header className={`glass-panel sticky top-3 z-50 mx-3 rounded-[1.45rem] transition-[box-shadow,transform] duration-500 [transition-timing-function:var(--ease-out-cinematic)] ${scrolled ? "shadow-[0_18px_50px_rgba(0,0,0,.38)]" : "shadow-[0_10px_34px_rgba(0,0,0,.22)]"}`}>
        <div className={`mx-auto flex max-w-7xl items-center justify-between px-4 transition-[height] duration-500 sm:px-6 lg:px-8 ${scrolled ? "h-[4.05rem]" : "h-[4.55rem]"}`}>
          <CafeBrand light />
          <nav className="hidden items-center gap-5 xl:flex" aria-label="Primary navigation">
            {navLinks.map(link => <Link key={link.href} href={link.href} className={`cinematic-link text-[0.64rem] font-semibold uppercase tracking-[0.15em] transition hover:text-[#e5bd7f] ${location === link.href ? "text-[#efc789]" : "text-[#f5eee4]/72"}`}>{link.label}</Link>)}
          </nav>
          <div className="flex items-center gap-1.5">
            <Link href="/menu" className="grid size-10 place-items-center rounded-full text-[#f5eee4]/82 transition hover:bg-white/8 hover:text-[#f0c98c] md:grid" aria-label="Search the menu"><Search size={18} /></Link>
            <a href="https://wa.me/923078263333" target="_blank" rel="noreferrer" className="grid size-10 place-items-center rounded-full text-[#f5eee4]/82 transition hover:bg-white/8 hover:text-[#f0c98c] md:grid" aria-label="Message Coffeemistry on WhatsApp"><MessageCircle size={18} /></a>
            <button onClick={() => setCartOpen(true)} className="relative grid size-10 place-items-center rounded-full text-[#f5eee4]/82 transition hover:bg-white/8 hover:text-[#f0c98c]" aria-label={`Open cart with ${cartCount} items`}><ShoppingBag size={18} /><AnimatePresence>{cartCount > 0 && <motion.span initial={{ scale: .4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: .4, opacity: 0 }} transition={{ type: "spring", stiffness: 420, damping: 20 }} className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-[#e3b572] text-[0.6rem] font-bold text-[#160d09]">{cartCount}</motion.span>}</AnimatePresence></button>
            <Magnetic className="hidden sm:inline-block"><Link href="/menu" className="cinematic-button h-10 items-center rounded-full bg-[#e3b572] px-4 text-[0.64rem] font-bold uppercase tracking-[0.15em] text-[#160d09] hover:bg-[#f3cf96] sm:inline-flex">Order now</Link></Magnetic>
            <button onClick={() => setMenuOpen(true)} className="grid size-10 place-items-center rounded-full text-[#f5eee4]/85 transition hover:bg-white/8 xl:hidden" aria-label="Open navigation"><Menu size={20} /></button>
          </div>
        </div>
      </header>

      <AnimatePresence>{menuOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? .01 : .25 }} className="fixed inset-0 z-[60] bg-[#0b0806]/88 px-5 py-5 text-[#fffaf0] backdrop-blur-2xl xl:hidden"><div className="glass-panel mx-auto flex min-h-full max-w-lg flex-col rounded-[2rem] p-6"><div className="flex items-center justify-between"><CafeBrand light /><button onClick={() => setMenuOpen(false)} className="grid size-11 place-items-center rounded-full border border-white/15 hover:bg-white/8" aria-label="Close navigation"><X size={20} /></button></div><nav className="mt-16 flex flex-col gap-5" aria-label="Mobile navigation">{navLinks.map((link, index) => <motion.div key={link.href} initial={{ opacity: 0, x: reducedMotion ? 0 : -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: reducedMotion ? 0 : index * .055, duration: reducedMotion ? .01 : .32, ease: cinematicEase }}><Link href={link.href} onClick={() => setMenuOpen(false)} className="font-display text-5xl tracking-tight text-[#fffaf0] transition hover:translate-x-1 hover:text-[#e5bd7f]"><span className="mr-4 font-sans text-xs font-bold text-[#d3a769]">0{index + 1}</span>{link.label}</Link></motion.div>)}</nav><a href="https://wa.me/923078263333" target="_blank" rel="noreferrer" className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-[#e5bd7f]"><MessageCircle size={17} /> WhatsApp Coffeemistry</a></div></motion.div>}</AnimatePresence>

      <main className="cinematic-page relative">{children}</main>

      <footer className="relative mx-3 mb-3 rounded-[2rem] border border-[#f6ead8]/10 bg-[#110b08]/72 px-4 pb-24 pt-16 text-[#f6ead8] shadow-[0_25px_70px_rgba(0,0,0,.25)] backdrop-blur-xl sm:px-6 lg:px-8 lg:pb-12"><div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-[1.35fr_0.7fr_1fr]"><Reveal><CafeBrand light /><p className="mt-5 max-w-xs text-sm leading-6 text-[#e8d5bc]/72">Specialty coffee and calm moments in the heart of Islamabad.</p><a className="cinematic-link mt-5 inline-flex text-sm text-[#d6b47c]" href="https://wa.me/923078263333" target="_blank" rel="noreferrer">+92 307 8263333</a></Reveal><Reveal delay={.08}><h2 className="text-xs font-bold uppercase tracking-[.16em] text-[#b99155]">Find your way</h2><div className="mt-5 flex flex-col gap-3 text-sm text-[#e8d5bc]/80">{navLinks.slice(1).map(link => <Link key={link.href} href={link.href} className="cinematic-link w-fit hover:text-white">{link.label}</Link>)}</div></Reveal><Reveal delay={.14}><h2 className="text-xs font-bold uppercase tracking-[.16em] text-[#b99155]">Visit Coffeemistry</h2><p className="mt-5 max-w-xs text-sm leading-6 text-[#e8d5bc]/80">Shop 1 & 2, Block 8 Allahwali Market, F-8/1, Islamabad, Pakistan</p><p className="mt-2 text-sm leading-6 text-[#e8d5bc]/55">Opening hours are being configured.</p></Reveal></div><div className="mx-auto mt-14 flex max-w-7xl flex-col justify-between gap-3 border-t border-white/10 pt-5 text-xs text-[#e8d5bc]/45 sm:flex-row"><p>© {new Date().getFullYear()} Coffeemistry. All rights reserved.</p><div className="flex gap-4"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div></div></footer>

      <a href="https://wa.me/923078263333" target="_blank" rel="noreferrer" className="whatsapp-float fixed bottom-5 right-5 z-40 grid size-12 place-items-center rounded-full border border-white/15 bg-[#365c43] text-white shadow-xl shadow-black/30 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e5bd7f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#110b08]" aria-label="Order through WhatsApp"><MessageCircle size={21} /><span className="whatsapp-tooltip">Order on WhatsApp</span></a>
      <div className="glass-panel fixed inset-x-3 bottom-3 z-30 flex h-14 overflow-hidden rounded-2xl p-1 shadow-xl md:hidden"><Link href="/menu" className="flex flex-1 items-center justify-center rounded-xl text-xs font-bold uppercase tracking-[0.12em] text-[#fffaf0]">Order now</Link><a href="https://wa.me/923078263333" target="_blank" rel="noreferrer" className="cinematic-button flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#e3b572] text-xs font-bold uppercase tracking-[0.1em] text-[#160d09]"><MessageCircle size={15} /> WhatsApp</a></div>
      {cartOpen && <Suspense fallback={null}><CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} /></Suspense>}
    </div>
  );
}
