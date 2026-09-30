import { useEffect, useState } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import orderService from '../../services/orderService';

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState('');

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await orderService.getOrders({ limit: 50 });
      setOrders(response.data.orders || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleStatusChange = async (orderId, orderStatus) => {
    setBusyId(orderId);
    setError('');
    setMessage('');
    try {
      await orderService.updateOrderStatus(orderId, { orderStatus });
      setMessage('Order updated.');
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
      <h1>Manage orders</h1>
      <p>Monitor marketplace orders and update fulfilment when needed.</p>

      {message && <p className="form-success">{message}</p>}
      {error && (
        <p className="form-alert" role="alert">
          {error}
        </p>
      )}

      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Buyer</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td>{order.orderNumber}</td>
                  <td>{order.buyerId?.name || '—'}</td>
                  <td>KES {Number(order.totalAmount).toLocaleString()}</td>
                  <td>{order.paymentStatus}</td>
                  <td>
                    <select
                      value={order.orderStatus}
                      disabled={busyId === order._id}
                      onChange={(event) => handleStatusChange(order._id, event.target.value)}
                    >
                      {[
                        'Pending',
                        'Confirmed',
                        'Processing',
                        'Shipped',
                        'Out for Delivery',
                        'Delivered',
                        'Cancelled',
                      ].map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
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

export default ManageOrders;
