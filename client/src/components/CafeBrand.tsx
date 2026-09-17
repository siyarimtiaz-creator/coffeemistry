import { FlaskConical } from "lucide-react";
import { Link } from "wouter";

export function CafeBrand({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b99155] focus-visible:ring-offset-4 ${light ? "focus-visible:ring-offset-[#1b0d08]" : "focus-visible:ring-offset-[#f6f0e5]"}`} aria-label="Coffeemistry home">
      <span className={`grid size-9 place-items-center rounded-full border ${light ? "border-[#f3e7d2]/35 bg-[#f3e7d2]/10 text-[#f3e7d2]" : "border-[#3d2117]/25 bg-[#3d2117] text-[#f3e7d2]"}`}>
        <FlaskConical size={17} strokeWidth={1.7} aria-hidden="true" />
      </span>
      <span className={`font-display text-[1.45rem] leading-none tracking-[-0.04em] ${light ? "text-[#fffaf0]" : "text-[#2a1710]"}`}>Coffeemistry</span>
    </Link>
  );
}
