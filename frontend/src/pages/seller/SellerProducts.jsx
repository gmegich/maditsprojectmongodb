import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import productService, { resolveImageUrl } from '../../services/productService';

const SellerProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await productService.getMyProducts({ limit: 50 });
      setProducts(response.data.products || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this product from your catalogue?')) return;
    setMessage('');
    setError('');
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
          <h1>My products</h1>
          <p>Manage your catalogue, stock, and prices.</p>
        </div>
        <Link to="/seller/products/new" className="btn btn--primary">
          Add product
        </Link>
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
        <p>
          No products yet. <Link to="/seller/products/new">Add your first product</Link>
        </p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
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
                  <td>{product.categoryId?.name || '—'}</td>
                  <td>KES {Number(product.price).toLocaleString()}</td>
                  <td>{product.stockQuantity}</td>
                  <td>{product.status}</td>
                  <td className="table-actions">
                    <Link to={`/seller/products/${product._id}/edit`} className="btn btn--ghost">
                      Edit
                    </Link>
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={() => handleDelete(product._id)}
                    >
                      Delete
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

export default SellerProducts;
