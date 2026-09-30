import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';
import notificationService from '../../services/notificationService';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await notificationService.getNotifications({ limit: 40 });
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      loadNotifications();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update notification.');
    }
  };

  const handleMarkAll = async () => {
    try {
      await notificationService.markAllAsRead();
      loadNotifications();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update notifications.');
    }
  };

  if (loading) {
    return (
      <div className="page container">
        <LoadingSpinner label="Loading notifications..." />
      </div>
    );
  }

  return (
    <div className="page container">
      <div className="page-toolbar">
        <div>
          <h1>Notifications</h1>
          <p>{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <button type="button" className="btn btn--ghost" onClick={handleMarkAll}>
            Mark all as read
          </button>
        )}
      </div>

      {error && (
        <p className="form-alert" role="alert">
          {error}
        </p>
      )}

      {notifications.length === 0 ? (
        <p>No notifications yet.</p>
      ) : (
        <ul className="notification-list">
          {notifications.map((item) => (
            <li
              key={item._id}
              className={`notification-item ${item.readStatus ? '' : 'notification-item--unread'}`}
            >
              <div>
                <strong>{item.title}</strong>
                <p>{item.message}</p>
                <p className="hint-text">{new Date(item.createdAt).toLocaleString()}</p>
                {item.relatedId && item.type === 'order' && (
                  <Link to={`/orders/${item.relatedId}`}>View order</Link>
                )}
                {item.relatedId && item.type === 'payment' && (
                  <Link to={`/orders/${item.relatedId}`}>View order</Link>
                )}
                {item.relatedId && item.type === 'delivery' && (
                  <Link to={`/orders/${item.relatedId}`}>Track order</Link>
                )}
              </div>
              {!item.readStatus && (
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => handleMarkRead(item._id)}
                >
                  Mark read
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Notifications;
