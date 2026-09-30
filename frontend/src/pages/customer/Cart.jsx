import { useState } from 'react';
import { Link } from 'react-router-dom';
import CartItem from '../../components/CartItem';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useCart } from '../../context/CartContext';

const Cart = () => {
  const {
    items,
    subtotal,
    itemCount,
    loading,
    error,
    setError,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const runAction = async (action) => {
    setBusy(true);
    setMessage('');
    setError('');
    try {
      await action();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update cart.');
    } finally {
      setBusy(false);
    }
  };

  if (loading && items.length === 0) {
    return (
      <div className="page container">
        <LoadingSpinner label="Loading cart..." />
      </div>
    );
  }

  return (
    <div className="page container">
      <div className="page-toolbar">
        <div>
          <h1>Shopping cart</h1>
          <p>
            {itemCount} item{itemCount === 1 ? '' : 's'} in your cart
          </p>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            className="btn btn--ghost"
            disabled={busy}
            onClick={() =>
              runAction(async () => {
                await clearCart();
                setMessage('Cart cleared.');
              })
            }
          >
            Clear cart
          </button>
        )}
      </div>

      {message && <p className="form-success">{message}</p>}
      {error && (
        <p className="form-alert" role="alert">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <p>
          Your cart is empty. <Link to="/products">Browse products</Link>
        </p>
      ) : (
        <>
          {items.map((item) => (
            <CartItem
              key={item._id}
              item={item}
              busy={busy}
              onUpdateQuantity={(itemId, quantity) =>
                runAction(() => updateQuantity(itemId, quantity))
              }
              onRemove={(itemId) => runAction(() => removeItem(itemId))}
            />
          ))}

          <div className="cart-summary">
            <p className="cart-total">Subtotal: KES {Number(subtotal).toLocaleString()}</p>
            <p className="hint-text">Shipping and payment are handled at checkout (Phase 7–8).</p>
            <div className="form-actions">
              <Link to="/products" className="btn btn--ghost">
                Continue shopping
              </Link>
              <Link to="/checkout" className="btn btn--primary">
                Proceed to checkout
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;
