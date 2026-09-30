import { NavLink, Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const AdminLayout = () => (
  <div className="app-shell">
    <Navbar />
    <div className="layout-with-sidebar">
      <aside className="sidebar">
        <p className="sidebar__label">Admin</p>
        <NavLink to="/admin" end>
          Dashboard
        </NavLink>
        <NavLink to="/admin/users">Users</NavLink>
        <NavLink to="/admin/sellers">Sellers</NavLink>
        <NavLink to="/admin/products">Products</NavLink>
        <NavLink to="/admin/orders">Orders</NavLink>
        <NavLink to="/admin/categories">Categories</NavLink>
        <NavLink to="/admin/reports">Reports</NavLink>
      </aside>
      <main className="layout-main">
        <Outlet />
      </main>
    </div>
    <Footer />
  </div>
);

export default AdminLayout;
