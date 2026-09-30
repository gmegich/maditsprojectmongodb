import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import orderService from '../../services/orderService';
import { resolveImageUrl } from '../../services/productService';

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, subtotal, loading: cartLoading, refreshCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    county: '',
    landmark: '',
    additionalInfo: '',
    paymentMethod: 'mpesa',
    notes: '',
  });

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        fullName: user.name || '',
        phone: user.phone || '',
        street: user.address?.street || '',
        city: user.city || '',
        county: user.county || '',
        landmark: user.address?.landmark || '',
      }));
    }
  }, [user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await orderService.createOrder({
        deliveryAddress: {
          fullName: form.fullName,
          phone: form.phone,
          street: form.street,
          city: form.city,
          county: form.county,
          landmark: form.landmark,
          additionalInfo: form.additionalInfo,
        },
        paymentMethod: form.paymentMethod,
        notes: form.notes,
      });

      await refreshCart().catch(() => {});
      navigate(`/orders/${response.data.order._id}`, {
        replace: true,
        state: { justPlaced: true },
      });
    } catch (err) {
      const apiError = err.response?.data;
      const details = Array.isArray(apiError?.error)
        ? apiError.error.join(', ')
        : apiError?.message;
      setError(details || 'Unable to place order.');
    } finally {
      setSubmitting(false);
    }
  };

  if (cartLoading && items.length === 0) {
    return (
      <div className="page container">
        <LoadingSpinner label="Loading checkout..." />
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="page container">
        <h1>Checkout</h1>
        <p>
          Your cart is empty. <Link to="/products">Browse products</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="page container">
      <h1>Checkout</h1>
      <p>Review your cart, enter delivery details, and place your order.</p>

      {error && (
        <p className="form-alert" role="alert">
          {error}
        </p>
      )}

      <div className="checkout-layout">
        <form className="auth-form product-form" onSubmit={handleSubmit}>
          <h2>1. Delivery information</h2>
          <label>
            Full name
            <input name="fullName" value={form.fullName} onChange={handleChange} required />
          </label>
          <label>
            Phone
            <input name="phone" value={form.phone} onChange={handleChange} required />
          </label>
          <label>
            Street / estate
            <input name="street" value={form.street} onChange={handleChange} required />
          </label>
          <div className="form-row">
            <label>
              City
              <input name="city" value={form.city} onChange={handleChange} required />
            </label>
            <label>
              County
              <input name="county" value={form.county} onChange={handleChange} required />
            </label>
          </div>
          <label>
            Landmark
            <input name="landmark" value={form.landmark} onChange={handleChange} />
          </label>
          <label>
            Additional info
            <textarea
              name="additionalInfo"
              rows={3}
              value={form.additionalInfo}
              onChange={handleChange}
            />
          </label>

          <h2>2. Payment method</h2>
          <label>
            Method
            <select name="paymentMethod" value={form.paymentMethod} onChange={handleChange}>
              <option value="mpesa">M-Pesa</option>
              <option value="card">Card</option>
              <option value="cash_on_delivery">Cash on delivery</option>
            </select>
          </label>
          <p className="hint-text">
            After placing the order you can pay with M-Pesa on the order confirmation page.
          </p>

          <label>
            Order notes
            <textarea name="notes" rows={3} value={form.notes} onChange={handleChange} />
          </label>

          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? 'Placing order...' : 'Place order'}
          </button>
        </form>

        <aside className="checkout-summary">
          <h2>3. Order summary</h2>
          <ul className="simple-list">
            {items.map((item) => (
              <li key={item._id}>
                <div className="checkout-line">
                  {item.image ? (
                    <img src={resolveImageUrl(item.image)} alt="" />
                  ) : (
                    <div className="table-product__fallback" />
                  )}
                  <div>
                    <strong>{item.name}</strong>
                    <p>
                      {item.quantity} × KES {Number(item.price).toLocaleString()}
                    </p>
                  </div>
                </div>
                <span>KES {Number(item.subtotal).toLocaleString()}</span>
              </li>
            ))}
          </ul>
          <p className="cart-total">Total: KES {Number(subtotal).toLocaleString()}</p>
          <Link to="/cart" className="btn btn--ghost">
            Edit cart
          </Link>
        </aside>
      </div>
    </div>
  );
};

export default Checkout;
