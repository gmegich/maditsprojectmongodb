import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import OrderTrackingTimeline from '../../components/OrderTrackingTimeline';
import orderService from '../../services/orderService';

const TrackOrder = () => {
  const navigate = useNavigate();
  const [orderNumber, setOrderNumber] = useState('');
  const [tracking, setTracking] = useState(null);
  const [orderId, setOrderId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setTracking(null);

    try {
      const response = await orderService.trackByOrderNumber(orderNumber.trim());
      setTracking(response.data.tracking);
      setOrderId(response.data.orderId);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to track that order.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const preset = params.get('orderNumber');
    if (preset) {
      setOrderNumber(preset);
    }
  }, []);

  return (
    <div className="page container">
      <h1>Track order</h1>
      <p>Enter your order number to see delivery progress.</p>

      <form className="auth-form product-form track-form" onSubmit={handleSubmit}>
        <label>
          Order number
          <input
            value={orderNumber}
            onChange={(event) => setOrderNumber(event.target.value.toUpperCase())}
            placeholder="SSM-YYYYMMDD-######"
            required
          />
        </label>
        <button type="submit" className="btn btn--primary" disabled={loading}>
          {loading ? 'Tracking...' : 'Track order'}
        </button>
      </form>

      {error && (
        <p className="form-alert" role="alert">
          {error}
        </p>
      )}

      {tracking && (
        <>
          <OrderTrackingTimeline tracking={tracking} />
          {orderId && (
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => navigate(`/orders/${orderId}`)}
            >
              Open full order details
            </button>
          )}
        </>
      )}

      <p className="hint-text">
        Tip: you can also open tracking from <Link to="/orders">My orders</Link>.
      </p>
    </div>
  );
};

export default TrackOrder;
