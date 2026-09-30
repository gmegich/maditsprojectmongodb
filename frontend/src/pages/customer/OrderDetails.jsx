import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';
import OrderTrackingTimeline from '../../components/OrderTrackingTimeline';
import { useAuth } from '../../context/AuthContext';
import orderService from '../../services/orderService';
import paymentService from '../../services/paymentService';
import { resolveImageUrl } from '../../services/productService';

const OrderDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const isSeller = user?.role === 'seller';
  const ordersPath = isSeller ? '/seller/orders' : '/orders';

  const [order, setOrder] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState(
    location.state?.justPlaced ? 'Order placed successfully.' : ''
  );
  const [busy, setBusy] = useState(false);
  const [paying, setPaying] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [activePaymentId, setActivePaymentId] = useState('');

  const loadOrder = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await orderService.getOrderById(id);
      const nextOrder = response.data.order;
      setOrder(nextOrder);
      setTracking(response.data.tracking || null);
      setPhoneNumber((prev) => prev || nextOrder.deliveryAddress?.phone || user?.phone || '');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load order.');
      setOrder(null);
      setTracking(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!activePaymentId || isSeller) return undefined;

    let attempts = 0;
    const timer = setInterval(async () => {
      attempts += 1;
      try {
        const response = await paymentService.getPayment(activePaymentId);
        const payment = response.data.payment;
        if (payment.paymentStatus === 'completed') {
          clearInterval(timer);
          setMessage(
            `Payment received${
              payment.mpesaReceiptNumber ? ` (${payment.mpesaReceiptNumber})` : ''
            }.`
          );
          setActivePaymentId('');
          await loadOrder();
        } else if (payment.paymentStatus === 'failed' || payment.paymentStatus === 'cancelled') {
          clearInterval(timer);
          setError('Payment failed or was cancelled. You can try again.');
          setActivePaymentId('');
          await loadOrder();
        } else if (attempts >= 20) {
          clearInterval(timer);
          setMessage('Still waiting for M-Pesa confirmation. Refresh this page shortly.');
          setActivePaymentId('');
        }
      } catch {
        // Keep polling briefly; network blips are common during mock completion.
      }
    }, 1500);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePaymentId, isSeller]);

  const handleCancel = async () => {
    if (!window.confirm('Cancel this order? Stock will be restored.')) return;
    setBusy(true);
    setError('');
    try {
      const response = await orderService.cancelOrder(id, 'Cancelled by customer');
      setOrder(response.data.order);
      setTracking(response.data.tracking || null);
      setMessage('Order cancelled.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to cancel order.');
    } finally {
      setBusy(false);
    }
  };

  const handlePay = async (event) => {
    event.preventDefault();
    setPaying(true);
    setError('');
    setMessage('');

    try {
      const response = await paymentService.initiateMpesa({
        orderId: order._id,
        phoneNumber,
      });

      setActivePaymentId(response.data.payment._id);
      setMessage(
        response.data.mpesa?.mock
          ? 'Mock M-Pesa prompt sent. Confirming payment...'
          : response.data.message || 'M-Pesa prompt sent. Enter your PIN on your phone.'
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to start M-Pesa payment.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="page container">
        <LoadingSpinner label="Loading order..." />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="page container">
        <p className="form-alert">{error || 'Order not found.'}</p>
        <Link to={ordersPath}>Back to orders</Link>
      </div>
    );
  }

  const canCancel =
    !isSeller &&
    ['Pending', 'Confirmed'].includes(order.orderStatus) &&
    order.paymentStatus !== 'paid';
  const canPay =
    !isSeller &&
    order.orderStatus !== 'Cancelled' &&
    order.paymentStatus !== 'paid' &&
    (order.paymentMethod === 'mpesa' || order.paymentMethod === 'card');
  const displayTotal = isSeller
    ? Number(order.sellerSubtotal ?? order.totalAmount)
    : Number(order.totalAmount);

  return (
    <div className="page container">
      <p className="breadcrumb">
        <Link to={ordersPath}>Orders</Link> / {order.orderNumber}
      </p>

      <div className="page-toolbar">
        <div>
          <h1>Order {order.orderNumber}</h1>
          <p>Placed {new Date(order.createdAt).toLocaleString()}</p>
        </div>
        {canCancel && (
          <button type="button" className="btn btn--ghost" disabled={busy} onClick={handleCancel}>
            Cancel order
          </button>
        )}
      </div>

      {message && <p className="form-success">{message}</p>}
      {error && (
        <p className="form-alert" role="alert">
          {error}
        </p>
      )}

      <OrderTrackingTimeline tracking={tracking} />

      <div className="checkout-layout">
        <section>
          <h2>{isSeller ? 'Your items in this order' : 'Items'}</h2>
          <ul className="simple-list">
            {order.items.map((item) => (
              <li key={`${item.productId}-${item.name}`}>
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
          <p className="cart-total">
            {isSeller ? 'Your subtotal' : 'Total'}: KES {displayTotal.toLocaleString()}
          </p>
        </section>

        <aside className="checkout-summary">
          <h2>Delivery</h2>
          <p>
            <strong>{order.deliveryAddress.fullName}</strong>
          </p>
          <p>{order.deliveryAddress.phone}</p>
          <p>
            {order.deliveryAddress.street}, {order.deliveryAddress.city},{' '}
            {order.deliveryAddress.county}
          </p>
          {order.deliveryAddress.landmark && <p>Landmark: {order.deliveryAddress.landmark}</p>}

          <h2>Payment</h2>
          <p>Method: {order.paymentMethod}</p>
          <p>Status: {order.paymentStatus}</p>
          <p>Order status: {order.orderStatus}</p>
          <p>Delivery status: {order.deliveryStatus}</p>

          {order.paymentStatus === 'paid' && (
            <p className="form-success">Payment completed for this order.</p>
          )}

          {canPay && (
            <form className="pay-box" onSubmit={handlePay}>
              <h3>Pay with M-Pesa</h3>
              <label>
                M-Pesa phone number
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  placeholder="07XXXXXXXX"
                  required
                />
              </label>
              <button type="submit" className="btn btn--primary" disabled={paying || Boolean(activePaymentId)}>
                {paying
                  ? 'Sending prompt...'
                  : activePaymentId
                    ? 'Waiting for confirmation...'
                    : `Pay KES ${Number(order.totalAmount).toLocaleString()}`}
              </button>
              <p className="hint-text">
                With mock mode enabled, payment confirms automatically after a short delay.
              </p>
            </form>
          )}
        </aside>
      </div>
    </div>
  );
};

export default OrderDetails;
