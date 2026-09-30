import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CategoryCard from '../../components/CategoryCard';
import ProductGrid from '../../components/ProductGrid';
import SearchBar from '../../components/SearchBar';
import { checkApiHealth } from '../../services/authService';
import categoryService from '../../services/categoryService';
import productService from '../../services/productService';

const Home = () => {
  const navigate = useNavigate();
  const [apiStatus, setApiStatus] = useState('Checking API...');
  const [categories, setCategories] = useState([]);
  const [latestProducts, setLatestProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);

  useEffect(() => {
    checkApiHealth()
      .then((data) => setApiStatus(data.message || 'API connected'))
      .catch(() => setApiStatus('API offline — start the backend on port 5000'));

    categoryService
      .getCategories()
      .then((res) => setCategories((res.data.categories || []).slice(0, 4)))
      .catch(() => {});

    productService
      .getProducts({ limit: 6, sort: 'newest', availability: 'in_stock' })
      .then((res) => setLatestProducts(res.data.products || []))
      .catch(() => {});

    productService
      .getProducts({ limit: 6, sort: 'rating' })
      .then((res) => setFeaturedProducts(res.data.products || []))
      .catch(() => {});
  }, []);

  return (
    <div className="home">
      <section className="hero">
        <div className="container hero__content">
          <p className="hero__brand">South Sudan Marketplace</p>
          <h1>Homeland products for the diaspora in Kenya</h1>
          <p className="hero__lead">
            Discover traditional foods, clothing, cosmetics, and handmade goods from
            South Sudanese suppliers — delivered to you in Kenya.
          </p>
          <div className="hero__actions">
            <Link to="/products" className="btn btn--primary">
              Browse products
            </Link>
            <Link to="/register" className="btn btn--ghost">
              Sell with us
            </Link>
          </div>
          <p className="hero__status" role="status">
            {apiStatus}
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SearchBar
            onSearch={(query) => {
              navigate(query ? `/products?search=${encodeURIComponent(query)}` : '/products');
            }}
          />
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section__header">
            <h2>Categories</h2>
            <p>Traditional foods, clothing, cosmetics, cultural and handmade products.</p>
          </div>
          <div className="category-row">
            {categories.length
              ? categories.map((category) => (
                  <CategoryCard key={category._id} category={category} />
                ))
              : [1, 2, 3, 4].map((item) => <CategoryCard key={item} />)}
          </div>
        </div>
      </section>

      <section className="section section--tint">
        <div className="container">
          <div className="section__header">
            <h2>Featured products</h2>
            <p>Top-rated items across the marketplace.</p>
          </div>
          <ProductGrid
            products={featuredProducts}
            emptyMessage="Featured products will appear once ratings and listings are available."
          />
          <div className="section-cta">
            <Link to="/products?sort=rating" className="btn btn--ghost">
              View highest rated
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section__header">
            <h2>Latest products</h2>
            <p>Fresh in-stock listings from South Sudanese suppliers.</p>
          </div>
          <ProductGrid
            products={latestProducts}
            emptyMessage="No products yet. Sellers can start listing from their dashboard."
          />
          <div className="section-cta">
            <Link to="/products?sort=newest" className="btn btn--primary">
              Browse all products
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container cta-band">
          <h2>Are you a South Sudanese supplier?</h2>
          <p>List your products and reach customers across Kenya.</p>
          <Link to="/register" className="btn btn--primary">
            Register as a seller
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
