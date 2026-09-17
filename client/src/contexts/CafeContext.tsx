import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CafeProduct = {
  id: number;
  slug: string;
  name: string;
  description: string;
  size: string | null;
  pricePkr: number;
  categorySlug: string;
  categoryName: string;
  customizationsEnabled: boolean;
  imageUrl?: string | null;
  imageAlt?: string;
  imageCaption?: string | null;
  images?: Array<{ id: number; url: string; thumbnailUrl: string | null; altText: string; caption: string | null; isPrimary: boolean; sortOrder: number }>;
};

export type CartLine = CafeProduct & { quantity: number };

type CafeContextValue = {
  cart: CartLine[];
  cartCount: number;
  subtotalPkr: number;
  favorites: number[];
  addToCart: (product: CafeProduct, quantity?: number) => void;
  changeQuantity: (productId: number, quantity: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  toggleFavorite: (productId: number) => void;
  whatsappHref: (details?: { name?: string; phone?: string; orderType?: "pickup" | "delivery"; address?: string; notes?: string }) => string;
};

const CART_KEY = "coffeemistry-cart-v1";
const FAVORITES_KEY = "coffeemistry-favorites-v1";
const CafeContext = createContext<CafeContextValue | null>(null);

function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function formatPkr(value: number) {
  return `PKR ${new Intl.NumberFormat("en-PK").format(value)}`;
}

export function CafeProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>(() => (typeof window === "undefined" ? [] : readStored<CartLine[]>(CART_KEY, [])));
  const [favorites, setFavorites] = useState<number[]>(() => (typeof window === "undefined" ? [] : readStored<number[]>(FAVORITES_KEY, [])));

  useEffect(() => {
    window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const addToCart = useCallback((product: CafeProduct, quantity = 1) => {
    setCart(current => {
      const existing = current.find(line => line.id === product.id);
      if (!existing) return [...current, { ...product, quantity }];
      return current.map(line => (line.id === product.id ? { ...line, quantity: Math.min(12, line.quantity + quantity) } : line));
    });
  }, []);

  const changeQuantity = useCallback((productId: number, quantity: number) => {
    setCart(current => current.flatMap(line => (line.id === productId ? (quantity > 0 ? [{ ...line, quantity: Math.min(12, quantity) }] : []) : [line])));
  }, []);

  const removeFromCart = useCallback((productId: number) => setCart(current => current.filter(line => line.id !== productId)), []);
  const clearCart = useCallback(() => setCart([]), []);
  const toggleFavorite = useCallback((productId: number) => {
    setFavorites(current => (current.includes(productId) ? current.filter(id => id !== productId) : [...current, productId]));
  }, []);

  const cartCount = useMemo(() => cart.reduce((count, line) => count + line.quantity, 0), [cart]);
  const subtotalPkr = useMemo(() => cart.reduce((total, line) => total + line.pricePkr * line.quantity, 0), [cart]);
  const whatsappHref = useCallback(
    (details: { name?: string; phone?: string; orderType?: "pickup" | "delivery"; address?: string; notes?: string } = {}) => {
      const lineItems = cart.length
        ? cart.map(line => `• ${line.quantity} × ${line.name} — ${formatPkr(line.pricePkr * line.quantity)}`).join("\n")
        : "• I would like to place an order.";
      const message = [
        "Hello Coffeemistry, I would like to order:",
        lineItems,
        "",
        `Subtotal: ${formatPkr(subtotalPkr)}`,
        details.orderType ? `Order type: ${details.orderType === "delivery" ? "Delivery" : "Pickup"}` : "",
        details.name ? `Name: ${details.name}` : "",
        details.phone ? `Phone: ${details.phone}` : "",
        details.address ? `Address: ${details.address}` : null,
        details.notes ? `Notes: ${details.notes}` : "",
      ]
        .filter(Boolean)
        .join("\n");
      return `https://wa.me/923078263333?text=${encodeURIComponent(message)}`;
    },
    [cart, subtotalPkr],
  );

  return (
    <CafeContext.Provider value={{ cart, cartCount, subtotalPkr, favorites, addToCart, changeQuantity, removeFromCart, clearCart, toggleFavorite, whatsappHref }}>
      {children}
    </CafeContext.Provider>
  );
}

export function useCafe() {
  const value = useContext(CafeContext);
  if (!value) throw new Error("useCafe must be used within a CafeProvider");
  return value;
}
