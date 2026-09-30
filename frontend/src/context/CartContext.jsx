import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import cartService from '../services/cartService';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [items, setItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [itemCount, setItemCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const applyCartData = (cart) => {
    setItems(cart?.items || []);
    setSubtotal(cart?.subtotal || 0);
    setItemCount(cart?.itemCount || 0);
  };

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated || user?.role !== 'customer') {
      applyCartData({ items: [], subtotal: 0, itemCount: 0 });
      return null;
    }

    setLoading(true);
    setError('');
    try {
      const response = await cartService.getCart();
      applyCartData(response.data.cart);
      return response.data.cart;
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load cart.');
      applyCartData({ items: [], subtotal: 0, itemCount: 0 });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    refreshCart().catch(() => {});
  }, [refreshCart]);

  const addItem = async (productId, quantity = 1) => {
    setError('');
    const response = await cartService.addToCart(productId, quantity);
    applyCartData(response.data.cart);
    return response;
  };

  const updateQuantity = async (itemId, quantity) => {
    setError('');
    if (quantity <= 0) {
      return removeItem(itemId);
    }
    const response = await cartService.updateCartItem(itemId, quantity);
    applyCartData(response.data.cart);
    return response;
  };

  const removeItem = async (itemId) => {
    setError('');
    const response = await cartService.removeCartItem(itemId);
    applyCartData(response.data.cart);
    return response;
  };

  const clearCart = async () => {
    setError('');
    const response = await cartService.clearCart();
    applyCartData(response.data.cart);
    return response;
  };

  const value = useMemo(
    () => ({
      items,
      itemCount,
      subtotal,
      loading,
      error,
      setError,
      refreshCart,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [items, itemCount, subtotal, loading, error, refreshCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
