import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import orderService from '../../services/orderService';

const CustomerDashboard = () => {
  const [stats, setStats] = useState({ total: 0, pending: 0, delivered: 0 });
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    orderService
      .getOrders({ limit: 5 })
      .then((res) => {
        const orders = res.data.orders || [];
        const total = res.data.pagination?.total || orders.length;
        setRecent(orders);
        setStats({
          total,
          pending: orders.filter((order) =>
            ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery'].includes(
              order.orderStatus
            )
          ).length,
          delivered: orders.filter((order) => order.orderStatus === 'Delivered').length,
        });
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Unable to load dashboard.');
      });
  }, []);

  return (
    <div className="page container">
      <div className="page-toolbar">
        <div>
          <h1>Customer dashboard</h1>
          <p>Quick view of your recent marketplace activity.</p>
        </div>
        <Link to="/orders" className="btn btn--primary">
          View all orders
        </Link>
      </div>

      {error && (
        <p className="form-alert" role="alert">
          {error}
        </p>
      )}

      <div className="stat-row">
        <div className="stat-block">
          <span>{stats.total}</span>
          <small>Total orders</small>
        </div>
        <div className="stat-block">
          <span>{stats.pending}</span>
          <small>In progress (recent)</small>
        </div>
        <div className="stat-block">
          <span>{stats.delivered}</span>
          <small>Delivered (recent)</small>
        </div>
      </div>

      <h2>Recent orders</h2>
      {recent.length === 0 ? (
        <p>
          No orders yet. <Link to="/products">Start shopping</Link>
        </p>
      ) : (
        <ul className="simple-list">
          {recent.map((order) => (
            <li key={order._id}>
              <Link to={`/orders/${order._id}`}>{order.orderNumber}</Link>
              <span>
                {order.orderStatus} · KES {Number(order.totalAmount).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomerDashboard;
