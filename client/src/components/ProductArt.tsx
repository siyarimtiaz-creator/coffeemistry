import { CakeSlice, Coffee, Cookie, Sandwich } from "lucide-react";

export function ProductArt({ category, className = "", variant = 0 }: { category: string; className?: string; variant?: number }) {
  const Icon = category === "Desserts" ? CakeSlice : category === "Sandwiches" ? Sandwich : category === "Bakery Items" ? Cookie : Coffee;
  return (
    <div className={`product-art art-tone-${variant % 4} ${className}`} aria-hidden="true">
      <span className="absolute inset-x-7 bottom-5 h-4 rounded-full bg-[#310f08]/15 blur-xl" />
      <Icon className="relative z-10 size-12 text-[#f6ead8]" strokeWidth={1.25} />
      <span className="steam steam-one" />
      <span className="steam steam-two" />
    </div>
  );
}
