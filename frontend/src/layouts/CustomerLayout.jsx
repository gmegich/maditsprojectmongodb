import { NavLink, Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const CustomerLayout = () => (
  <div className="app-shell">
    <Navbar />
    <div className="layout-with-sidebar">
      <aside className="sidebar">
        <p className="sidebar__label">Customer</p>
        <NavLink to="/customer" end>
          Dashboard
        </NavLink>
        <NavLink to="/cart">Cart</NavLink>
        <NavLink to="/orders">Orders</NavLink>
        <NavLink to="/track-order">Track order</NavLink>
        <NavLink to="/notifications">Notifications</NavLink>
        <NavLink to="/profile">Profile</NavLink>
        <NavLink to="/messages">Messages</NavLink>
      </aside>
      <main className="layout-main">
        <Outlet />
      </main>
    </div>
    <Footer />
  </div>
);

export default CustomerLayout;
