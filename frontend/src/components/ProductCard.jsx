import { Link } from 'react-router-dom';
import { resolveImageUrl } from '../services/productService';

const ProductCard = ({ product }) => {
  if (!product) {
    return (
      <article className="product-card product-card--placeholder">
        <div className="product-card__media" />
        <div className="product-card__body">
          <h3>Coming soon</h3>
          <p>Product catalogue will load once sellers list items.</p>
        </div>
      </article>
    );
  }

  const inStock = product.stockQuantity > 0;
  const rating = Number(product.averageRating || 0).toFixed(1);

  return (
    <article className="product-card">
      <Link to={`/products/${product._id}`} className="product-card__link">
        <div className="product-card__media">
          {product.images?.[0] ? (
            <img src={resolveImageUrl(product.images[0])} alt={product.name} />
          ) : (
            <div className="product-card__fallback" />
          )}
          <span className={`stock-badge ${inStock ? 'stock-badge--in' : 'stock-badge--out'}`}>
            {inStock ? 'In stock' : 'Out of stock'}
          </span>
        </div>
        <div className="product-card__body">
          <h3>{product.name}</h3>
          <p className="product-card__price">KES {Number(product.price).toLocaleString()}</p>
          <p className="product-card__meta">
            {product.categoryId?.name || 'Uncategorized'}
            {product.sellerId?.businessName ? ` · ${product.sellerId.businessName}` : ''}
          </p>
          <p className="product-card__rating">★ {rating}</p>
        </div>
      </Link>
    </article>
  );
};

export default ProductCard;
