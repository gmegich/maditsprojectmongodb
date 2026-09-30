import { Link } from 'react-router-dom';
import { resolveImageUrl } from '../services/productService';

const CartItem = ({ item, onUpdateQuantity, onRemove, busy = false }) => (
  <div className={`cart-item ${item.available === false ? 'cart-item--warning' : ''}`}>
    <div className="cart-item__main">
      <div className="cart-item__media">
        {item.image ? (
          <img src={resolveImageUrl(item.image)} alt={item.name} />
        ) : (
          <div className="table-product__fallback" />
        )}
      </div>
      <div>
        <h4>
          <Link to={`/products/${item.productId}`}>{item.name}</Link>
        </h4>
        <p>KES {Number(item.price).toLocaleString()} each</p>
        <p className="hint-text">
          Stock: {item.stockQuantity}
          {item.available === false ? ' · Adjust quantity or remove' : ''}
        </p>
      </div>
    </div>

    <div className="cart-item__actions">
      <button
        type="button"
        disabled={busy}
        onClick={() => onUpdateQuantity?.(item._id, item.quantity - 1)}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span>{item.quantity}</span>
      <button
        type="button"
        disabled={busy || item.quantity >= item.stockQuantity}
        onClick={() => onUpdateQuantity?.(item._id, item.quantity + 1)}
        aria-label="Increase quantity"
      >
        +
      </button>
      <p className="cart-item__line-total">KES {Number(item.subtotal).toLocaleString()}</p>
      <button
        type="button"
        className="btn btn--ghost"
        disabled={busy}
        onClick={() => onRemove?.(item._id)}
      >
        Remove
      </button>
    </div>
  </div>
);

export default CartItem;
