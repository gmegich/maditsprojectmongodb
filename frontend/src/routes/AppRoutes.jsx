import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProtectedRoute from '../components/ProtectedRoute';

import Home from '../pages/public/Home';
import Products from '../pages/public/Products';
import ProductDetails from '../pages/public/ProductDetails';
import Login from '../pages/public/Login';
import Register from '../pages/public/Register';

import CustomerLayout from '../layouts/CustomerLayout';
import CustomerDashboard from '../pages/customer/CustomerDashboard';
import Cart from '../pages/customer/Cart';
import Checkout from '../pages/customer/Checkout';
import Orders from '../pages/customer/Orders';
import OrderDetails from '../pages/customer/OrderDetails';
import Profile from '../pages/customer/Profile';
import Messages from '../pages/customer/Messages';
import TrackOrder from '../pages/customer/TrackOrder';
import Notifications from '../pages/customer/Notifications';

import SellerLayout from '../layouts/SellerLayout';
import SellerDashboard from '../pages/seller/SellerDashboard';
import SellerProducts from '../pages/seller/SellerProducts';
import AddProduct from '../pages/seller/AddProduct';
import EditProduct from '../pages/seller/EditProduct';
import SellerOrders from '../pages/seller/SellerOrders';
import SellerProfile from '../pages/seller/SellerProfile';
import SellerMessages from '../pages/seller/SellerMessages';

import AdminLayout from '../layouts/AdminLayout';
import AdminDashboard from '../pages/admin/AdminDashboard';
import ManageUsers from '../pages/admin/ManageUsers';
import ManageSellers from '../pages/admin/ManageSellers';
import ManageProducts from '../pages/admin/ManageProducts';
import ManageOrders from '../pages/admin/ManageOrders';
import ManageCategories from '../pages/admin/ManageCategories';
import Reports from '../pages/admin/Reports';

const PublicShell = ({ children }) => (
  <div className="app-shell">
    <Navbar />
    <main className="layout-main layout-main--public">{children}</main>
    <Footer />
  </div>
);

const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      <Route
        path="/"
        element={
          <PublicShell>
            <Home />
          </PublicShell>
        }
      />
      <Route
        path="/products"
        element={
          <PublicShell>
            <Products />
          </PublicShell>
        }
      />
      <Route
        path="/products/:id"
        element={
          <PublicShell>
            <ProductDetails />
          </PublicShell>
        }
      />
      <Route
        path="/login"
        element={
          <PublicShell>
            <Login />
          </PublicShell>
        }
      />
      <Route
        path="/register"
        element={
          <PublicShell>
            <Register />
          </PublicShell>
        }
      />

      {/* Customer — authenticated customers (cart/checkout require login) */}
      <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
        <Route path="/customer" element={<CustomerLayout />}>
          <Route index element={<CustomerDashboard />} />
        </Route>
        <Route path="/cart" element={<CustomerLayout />}>
          <Route index element={<Cart />} />
        </Route>
        <Route path="/checkout" element={<CustomerLayout />}>
          <Route index element={<Checkout />} />
        </Route>
        <Route path="/orders" element={<CustomerLayout />}>
          <Route index element={<Orders />} />
          <Route path=":id" element={<OrderDetails />} />
        </Route>
        <Route path="/track-order" element={<CustomerLayout />}>
          <Route index element={<TrackOrder />} />
        </Route>
        <Route path="/messages" element={<CustomerLayout />}>
          <Route index element={<Messages />} />
        </Route>
      </Route>

      {/* Shared authenticated pages */}
      <Route element={<ProtectedRoute allowedRoles={['customer', 'seller', 'admin']} />}>
        <Route path="/profile" element={<CustomerLayout />}>
          <Route index element={<Profile />} />
        </Route>
        <Route path="/notifications" element={<CustomerLayout />}>
          <Route index element={<Notifications />} />
        </Route>
      </Route>

      {/* Seller area */}
      <Route element={<ProtectedRoute allowedRoles={['seller']} />}>
        <Route path="/seller" element={<SellerLayout />}>
          <Route index element={<SellerDashboard />} />
          <Route path="products" element={<SellerProducts />} />
          <Route path="products/new" element={<AddProduct />} />
          <Route path="products/:id/edit" element={<EditProduct />} />
          <Route path="orders" element={<SellerOrders />} />
          <Route path="orders/:id" element={<OrderDetails />} />
          <Route path="profile" element={<SellerProfile />} />
          <Route path="messages" element={<SellerMessages />} />
        </Route>
      </Route>

      {/* Admin area */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="sellers" element={<ManageSellers />} />
          <Route path="products" element={<ManageProducts />} />
          <Route path="orders" element={<ManageOrders />} />
          <Route path="categories" element={<ManageCategories />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);

export default AppRoutes;
