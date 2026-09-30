import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';
import ProductGrid from '../../components/ProductGrid';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import productService, { resolveImageUrl } from '../../services/productService';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [activeImage, setActiveImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError('');
    setMessage('');
    setQuantity(1);
    productService
      .getProductById(id)
      .then((res) => {
        const nextProduct = res.data.product;
        setProduct(nextProduct);
        setRelatedProducts(res.data.relatedProducts || []);
        setActiveImage(nextProduct.images?.[0] || '');
      })
      .catch((err) => {
        setProduct(null);
        setError(err.response?.data?.message || 'Product not found.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    setMessage('');
    setError('');

    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/products/${id}` } });
      return;
    }

    if (user?.role !== 'customer') {
      setError('Only customer accounts can add products to the cart.');
      return;
    }

    setAdding(true);
    try {
      await addItem(product._id, quantity);
      setMessage(`Added ${quantity} item(s) to your cart.`);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to add product to cart.');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="page container">
        <LoadingSpinner label="Loading product..." />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page container">
        <p className="form-alert">{error || 'Product not found.'}</p>
        <Link to="/products">Back to products</Link>
      </div>
    );
  }

  const inStock = product.stockQuantity > 0;
  const seller = product.sellerId;
  const maxQty = Math.max(product.stockQuantity || 0, 1);

  return (
    <div className="page container">
      <p className="breadcrumb">
        <Link to="/products">Products</Link>
        {product.categoryId?.name ? (
          <>
            {' / '}
            <Link to={`/products?category=${product.categoryId._id}`}>
              {product.categoryId.name}
            </Link>
          </>
        ) : null}
        {' / '}
        {product.name}
      </p>

      <div className="product-details">
        <div className="product-details__media">
          {activeImage ? (
            <img src={resolveImageUrl(activeImage)} alt={product.name} />
          ) : (
            <div className="product-card__fallback product-details__fallback" />
          )}

          {product.images?.length > 1 && (
            <div className="image-preview-row">
              {product.images.map((image) => (
                <button
                  key={image}
                  type="button"
                  className={`thumb-btn ${activeImage === image ? 'thumb-btn--active' : ''}`}
                  onClick={() => setActiveImage(image)}
                >
                  <img src={resolveImageUrl(image)} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product-details__info">
          <p className="product-details__eyebrow">{product.categoryId?.name || 'Marketplace'}</p>
          <h1>{product.name}</h1>
          <p className="product-card__price">KES {Number(product.price).toLocaleString()}</p>
          <p className="product-card__rating">
            ★ {Number(product.averageRating || 0).toFixed(1)} · {product.reviewCount || 0} reviews
          </p>

          <p className={`stock-pill ${inStock ? 'stock-pill--in' : 'stock-pill--out'}`}>
            {inStock ? `${product.stockQuantity} in stock` : 'Currently out of stock'}
          </p>

          <p>{product.description}</p>

          {message && <p className="form-success">{message}</p>}
          {error && (
            <p className="form-alert" role="alert">
              {error}
            </p>
          )}

          <div className="add-to-cart-box">
            <label>
              Quantity
              <input
                type="number"
                min="1"
                max={maxQty}
                value={quantity}
                disabled={!inStock}
                onChange={(event) => {
                  const value = Number(event.target.value) || 1;
                  setQuantity(Math.min(Math.max(value, 1), maxQty));
                }}
              />
            </label>
            <button
              type="button"
              className="btn btn--primary"
              disabled={!inStock || adding}
              onClick={handleAddToCart}
            >
              {adding ? 'Adding...' : inStock ? 'Add to cart' : 'Out of stock'}
            </button>
            {isAuthenticated && user?.role === 'customer' && (
              <Link to="/cart" className="btn btn--ghost">
                View cart
              </Link>
            )}
          </div>

          <div className="seller-panel">
            <h2>Seller information</h2>
            <p>
              <strong>{seller?.businessName || 'Seller'}</strong>
            </p>
            {seller?.businessLocation && <p>{seller.businessLocation}</p>}
            {seller?.userId?.city && (
              <p>
                {seller.userId.city}
                {seller.userId.county ? `, ${seller.userId.county}` : ''}
              </p>
            )}
            {seller?.businessDescription && <p>{seller.businessDescription}</p>}
            {seller?._id && (
              <Link to={`/products?seller=${seller._id}`} className="btn btn--ghost">
                More from this seller
              </Link>
            )}
          </div>

          <p className="hint-text">Location: {product.location || 'Not specified'}</p>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <section className="section">
          <div className="section__header">
            <h2>Related products</h2>
            <p>More items from the same category or seller.</p>
          </div>
          <ProductGrid products={relatedProducts} />
        </section>
      )}
    </div>
  );
};

export default ProductDetails;
