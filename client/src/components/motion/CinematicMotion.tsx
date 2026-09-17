import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef, type ReactNode } from "react";

export const cinematicEase = [0.23, 1, 0.32, 1] as const;

export function Reveal({
  children,
  className,
  delay = 0,
  distance = 20,
  blur = false,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
  blur?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reducedMotion ? 0 : distance, filter: reducedMotion || !blur ? "blur(0px)" : "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: reducedMotion ? 0.01 : 0.58, delay: reducedMotion ? 0 : delay, ease: cinematicEase }}
    >
      {children}
    </motion.div>
  );
}

export function Magnetic({ children, className }: { children: ReactNode; className?: string }) {
  const reducedMotion = useReducedMotion();
  if (reducedMotion) return <span className={className}>{children}</span>;
  return (
    <motion.span
      className={className}
      onPointerMove={event => {
        if (event.pointerType !== "mouse") return;
        const bounds = event.currentTarget.getBoundingClientRect();
        const x = (event.clientX - (bounds.left + bounds.width / 2)) * 0.1;
        const y = (event.clientY - (bounds.top + bounds.height / 2)) * 0.1;
        event.currentTarget.animate([{ transform: "translate(0, 0)" }, { transform: `translate(${x}px, ${y}px)` }], { duration: 180, fill: "forwards", easing: "cubic-bezier(.23,1,.32,1)" });
      }}
      onPointerLeave={event => event.currentTarget.animate([{ transform: "translate(0, 0)" }], { duration: 220, fill: "forwards", easing: "cubic-bezier(.23,1,.32,1)" })}
    >
      {children}
    </motion.span>
  );
}

export function SteamLayer({ className = "" }: { className?: string }) {
  return <div className={`steam-layer pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true"><i className="steam-wisp steam-wisp-one" /><i className="steam-wisp steam-wisp-two" /><i className="steam-wisp steam-wisp-three" /></div>;
}

export function Parallax({ children, className, offset = 14 }: { children: ReactNode; className?: string; offset?: number }) {
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reducedMotion ? [0, 0] : [offset, -offset]);
  return <motion.div ref={ref} style={{ y }} className={className}>{children}</motion.div>;
}
