import React, { createContext, useContext, useState, useEffect } from 'react';
import { normalizeCartItem } from '@utils/normalizeItem';

const CartContext = createContext(null);

/**
 * Hook de acceso rápido al contexto del carrito.
 * Cualquier componente puede hacer: const { addToCart } = useCart();
 */
export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return ctx;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('matsso_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persistir carrito en localStorage
  useEffect(() => {
    localStorage.setItem('matsso_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  /** Agrega un ítem al carrito, normalizando su esquema antes. */
  const addToCart = (item) => {
    const normalized = normalizeCartItem(item);
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === normalized.id);
      if (existing) {
        return prev.map((i) =>
          i.id === normalized.id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [...prev, normalized];
    });
  };

  /** Elimina completamente un ítem por su id. */
  const removeFromCart = (id) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id));
  };

  /**
   * Incrementa o decrementa la cantidad de un ítem.
   * Si la cantidad llega a 0, elimina el ítem.
   */
  const updateQty = (id, delta) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, cantidad: item.cantidad + delta } : item
        )
        .filter((item) => item.cantidad > 0)
    );
  };

  /** Vacía el carrito completamente. */
  const clearCart = () => setCartItems([]);

  const getCartTotal = () =>
    cartItems.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

  const getCartCount = () =>
    cartItems.reduce((sum, item) => sum + item.cantidad, 0);

  return (
    <CartContext.Provider
      value={{ cartItems, addToCart, removeFromCart, updateQty, clearCart, getCartTotal, getCartCount }}
    >
      {children}
    </CartContext.Provider>
  );
};
