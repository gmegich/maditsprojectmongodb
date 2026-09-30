import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import productService from '../../services/productService';

const SellerDashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    outOfStock: 0,
  });
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    productService
      .getMyProducts({ limit: 5, sort: 'newest' })
      .then((res) => {
        const products = res.data.products || [];
        setRecent(products);
        setStats({
          total: res.data.pagination?.total || products.length,
          active: products.filter((p) => p.status === 'active').length,
          outOfStock: products.filter((p) => p.status === 'out_of_stock' || p.stockQuantity === 0)
            .length,
        });
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Unable to load seller dashboard.');
      });
  }, []);

  return (
    <div className="page container">
      <div className="page-toolbar">
        <div>
          <h1>Seller dashboard</h1>
          <p>Overview of your catalogue and recent listings.</p>
        </div>
        <Link to="/seller/products/new" className="btn btn--primary">
          Add product
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
          <small>Total products</small>
        </div>
        <div className="stat-block">
          <span>{stats.active}</span>
          <small>Active (recent page)</small>
        </div>
        <div className="stat-block">
          <span>{stats.outOfStock}</span>
          <small>Low / out of stock</small>
        </div>
      </div>

      <h2>Recent products</h2>
      {recent.length === 0 ? (
        <p>
          No products yet. <Link to="/seller/products/new">Create one</Link>
        </p>
      ) : (
        <ul className="simple-list">
          {recent.map((product) => (
            <li key={product._id}>
              <Link to={`/seller/products/${product._id}/edit`}>{product.name}</Link>
              <span>
                KES {Number(product.price).toLocaleString()} · stock {product.stockQuantity}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SellerDashboard;
