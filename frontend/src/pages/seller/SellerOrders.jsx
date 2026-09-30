import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';
import orderService from '../../services/orderService';

const SELLER_STATUSES = [
  'Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Out for Delivery',
  'Delivered',
];

const SellerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState('');

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await orderService.getOrders({ limit: 50 });
      setOrders(response.data.orders || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load seller orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleStatusChange = async (orderId, orderStatus) => {
    setBusyId(orderId);
    setMessage('');
    setError('');
    try {
      await orderService.updateOrderStatus(orderId, { orderStatus });
      setMessage('Order status updated.');
      await loadOrders();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update order.');
    } finally {
      setBusyId('');
    }
  };

  if (loading) {
    return (
      <div className="page container">
        <LoadingSpinner label="Loading orders..." />
      </div>
    );
  }

  return (
    <div className="page container">
      <h1>Seller orders</h1>
      <p>Orders that include your products. Update fulfilment status as you process them.</p>

      {message && <p className="form-success">{message}</p>}
      {error && (
        <p className="form-alert" role="alert">
          {error}
        </p>
      )}

      {orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Buyer</th>
                <th>Your items</th>
                <th>Your subtotal</th>
                <th>Payment</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td>
                    <Link to={`/seller/orders/${order._id}`}>{order.orderNumber}</Link>
                  </td>
                  <td>{order.buyerId?.name || '—'}</td>
                  <td>
                    {order.items?.map((item) => (
                      <div key={`${order._id}-${item.productId}`}>
                        {item.name} × {item.quantity}
                      </div>
                    ))}
                  </td>
                  <td>
                    KES{' '}
                    {Number(order.sellerSubtotal ?? order.totalAmount).toLocaleString()}
                  </td>
                  <td>{order.paymentStatus}</td>
                  <td>
                    <select
                      value={order.orderStatus}
                      disabled={busyId === order._id || order.orderStatus === 'Cancelled'}
                      onChange={(event) => handleStatusChange(order._id, event.target.value)}
                    >
                      {SELLER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                      {order.orderStatus === 'Cancelled' && (
                        <option value="Cancelled">Cancelled</option>
                      )}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SellerOrders;
