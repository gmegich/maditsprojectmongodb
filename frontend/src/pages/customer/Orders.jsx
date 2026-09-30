import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';
import orderService from '../../services/orderService';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    orderService
      .getOrders({ limit: 50 })
      .then((res) => setOrders(res.data.orders || []))
      .catch((err) => setError(err.response?.data?.message || 'Unable to load orders.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page container">
        <LoadingSpinner label="Loading orders..." />
      </div>
    );
  }

  return (
    <div className="page container">
      <div className="page-toolbar">
        <div>
          <h1>My orders</h1>
          <p>Track purchases and open order details.</p>
        </div>
        <Link to="/products" className="btn btn--ghost">
          Continue shopping
        </Link>
      </div>

      {error && (
        <p className="form-alert" role="alert">
          {error}
        </p>
      )}

      {orders.length === 0 ? (
        <p>
          No orders yet. <Link to="/products">Browse products</Link>
        </p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Date</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td>{order.orderNumber}</td>
                  <td>{new Date(order.createdAt).toLocaleString()}</td>
                  <td>KES {Number(order.totalAmount).toLocaleString()}</td>
                  <td>{order.paymentStatus}</td>
                  <td>{order.orderStatus}</td>
                  <td>
                    <Link to={`/orders/${order._id}`} className="btn btn--ghost">
                      View
                    </Link>
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

export default Orders;
