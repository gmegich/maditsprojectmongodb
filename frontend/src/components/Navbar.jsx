import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import notificationService from '../services/notificationService';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { itemCount } = useCart();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return undefined;
    }

    let active = true;
    const loadUnread = async () => {
      try {
        const response = await notificationService.getNotifications({ limit: 1 });
        if (active) setUnreadCount(response.data.unreadCount || 0);
      } catch {
        if (active) setUnreadCount(0);
      }
    };

    loadUnread();
    const timer = setInterval(loadUnread, 30000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [isAuthenticated, user?._id]);

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link to="/" className="brand">
          <span className="brand__mark">SS</span>
          <span className="brand__text">
            <strong>South Sudan</strong>
            <small>Marketplace</small>
          </span>
        </Link>

        <nav className="site-nav" aria-label="Main">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/products">Products</NavLink>
          {isAuthenticated && user?.role === 'customer' && (
            <>
              <NavLink to="/cart">Cart ({itemCount})</NavLink>
              <NavLink to="/orders">Orders</NavLink>
              <NavLink to="/track-order">Track</NavLink>
              <NavLink to="/customer">Dashboard</NavLink>
            </>
          )}
          {isAuthenticated && user?.role === 'seller' && (
            <NavLink to="/seller">Seller</NavLink>
          )}
          {isAuthenticated && user?.role === 'admin' && (
            <NavLink to="/admin">Admin</NavLink>
          )}
        </nav>

        <div className="site-header__actions">
          {isAuthenticated ? (
            <>
              <Link to="/notifications" className="notif-chip">
                Alerts{unreadCount > 0 ? ` (${unreadCount})` : ''}
              </Link>
              <Link to="/profile" className="user-chip">
                {user?.name || 'Account'}
              </Link>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={async () => {
                  await logout();
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn--ghost">
                Login
              </Link>
              <Link to="/register" className="btn btn--primary">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
