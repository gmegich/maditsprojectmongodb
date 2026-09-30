import ProductCard from './ProductCard';

const ProductGrid = ({
  products = [],
  emptyMessage = 'No products found.',
  showPlaceholders = false,
}) => {
  if (!products.length) {
    return (
      <div className="product-grid product-grid--empty">
        <p>{emptyMessage}</p>
        {showPlaceholders && (
          <div className="product-grid__placeholders">
            <ProductCard />
            <ProductCard />
            <ProductCard />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
};

export default ProductGrid;
