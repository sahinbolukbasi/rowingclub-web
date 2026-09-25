import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { products, type Product } from "./products";

export type CartItem = {
  slug: string;
  name: string;
  price: number;
  image: string;
  size: string;
  color: string;
  qty: number;
};

type CartContextValue = {
  items: CartItem[];
  isOpen: boolean;
  count: number;
  total: number;
  addItem: (product: Product, size: string, color: string, qty?: number) => void;
  removeItem: (slug: string, size: string, color: string) => void;
  updateQty: (slug: string, size: string, color: string, qty: number) => void;
  clearCart: () => void;
  open: () => void;
  close: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "kurek-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: CartItem[] = JSON.parse(raw);
        const hydrated = parsed.map((item) => {
          if (!item.image) {
            const found = products.find((p) => p.slug === item.slug);
            if (found) {
              return { ...item, image: found.image || (found as any).images?.[0] || "" };
            }
          }
          return item;
        });
        setItems(hydrated);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  const addItem: CartContextValue["addItem"] = (
    product,
    size,
    color,
    qty = 1,
  ) => {
    const itemImage =
      (product as any).image ||
      (Array.isArray((product as any).images) && (product as any).images.length > 0
        ? (product as any).images[0]
        : "") ||
      (product as any).primaryImage ||
      "";

    setItems((prev) => {
      const idx = prev.findIndex(
        (i) => i.slug === product.slug && i.size === size && i.color === color,
      );
      if (idx >= 0) {
        const existing = prev[idx];
        if (existing) {
          const next = [...prev];
          next[idx] = {
            ...existing,
            qty: existing.qty + qty,
            image: existing.image || itemImage,
          };
          return next;
        }
      }
      return [
        ...prev,
        {
          slug: product.slug,
          name: product.name,
          price: product.price,
          image: itemImage,
          size,
          color,
          qty,
        },
      ];
    });
    setIsOpen(true);
  };

  const removeItem: CartContextValue["removeItem"] = (slug, size, color) => {
    setItems((prev) =>
      prev.filter(
        (i) => !(i.slug === slug && i.size === size && i.color === color),
      ),
    );
  };

  const updateQty: CartContextValue["updateQty"] = (slug, size, color, qty) => {
    setItems((prev) =>
      prev
        .map((i): CartItem =>
          i.slug === slug && i.size === size && i.color === color
            ? { ...i, qty: Math.max(1, qty) }
            : i,
        )
        .filter((i) => i.qty > 0),
    );
  };

  const count = items.reduce((sum, i) => sum + i.qty, 0);
  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  const clearCart = () => {
    setItems([]);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        count,
        total,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export { products };
