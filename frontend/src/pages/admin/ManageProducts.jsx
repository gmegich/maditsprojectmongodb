import { useEffect, useState } from 'react';
import productService, { resolveImageUrl } from '../../services/productService';

const ManageProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { limit: 50, admin: true };
      if (statusFilter) params.status = statusFilter;
      const response = await productService.getProducts(params);
      setProducts(response.data.products || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleStatusChange = async (id, status) => {
    setMessage('');
    setError('');
    try {
      await productService.updateProduct(id, { status });
      setMessage('Product status updated.');
      loadProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update product.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this product from the catalogue?')) return;
    try {
      await productService.deleteProduct(id);
      setMessage('Product removed.');
      loadProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete product.');
    }
  };

  return (
    <div className="page container">
      <div className="page-toolbar">
        <div>
          <h1>Manage products</h1>
          <p>Monitor and moderate the marketplace catalogue.</p>
        </div>
        <label className="inline-filter">
          Status
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Active / in catalogue</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="out_of_stock">Out of stock</option>
            <option value="removed">Removed</option>
            <option value="pending_review">Pending review</option>
          </select>
        </label>
      </div>

      {message && <p className="form-success">{message}</p>}
      {error && (
        <p className="form-alert" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p>Loading products...</p>
      ) : products.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Seller</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id}>
                  <td>
                    <div className="table-product">
                      {product.images?.[0] ? (
                        <img src={resolveImageUrl(product.images[0])} alt="" />
                      ) : (
                        <div className="table-product__fallback" />
                      )}
                      <span>{product.name}</span>
                    </div>
                  </td>
                  <td>{product.sellerId?.businessName || '—'}</td>
                  <td>KES {Number(product.price).toLocaleString()}</td>
                  <td>{product.stockQuantity}</td>
                  <td>
                    <select
                      value={product.status}
                      onChange={(e) => handleStatusChange(product._id, e.target.value)}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="out_of_stock">Out of stock</option>
                      <option value="pending_review">Pending review</option>
                      <option value="removed">Removed</option>
                    </select>
                  </td>
                  <td className="table-actions">
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={() => handleDelete(product._id)}
                    >
                      Remove
                    </button>
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

export default ManageProducts;
