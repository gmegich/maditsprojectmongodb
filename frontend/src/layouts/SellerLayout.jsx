import { NavLink, Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const SellerLayout = () => (
  <div className="app-shell">
    <Navbar />
    <div className="layout-with-sidebar">
      <aside className="sidebar">
        <p className="sidebar__label">Seller</p>
        <NavLink to="/seller" end>
          Dashboard
        </NavLink>
        <NavLink to="/seller/products">Products</NavLink>
        <NavLink to="/seller/products/new">Add product</NavLink>
        <NavLink to="/seller/orders">Orders</NavLink>
        <NavLink to="/seller/profile">Profile</NavLink>
        <NavLink to="/seller/messages">Messages</NavLink>
      </aside>
      <main className="layout-main">
        <Outlet />
      </main>
    </div>
    <Footer />
  </div>
);

export default SellerLayout;
