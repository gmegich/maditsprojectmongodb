import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';
import Pagination from '../../components/Pagination';
import ProductGrid from '../../components/ProductGrid';
import SearchBar from '../../components/SearchBar';
import categoryService from '../../services/categoryService';
import productService from '../../services/productService';

const DEFAULT_FILTERS = {
  search: '',
  sellerSearch: '',
  seller: '',
  category: '',
  minPrice: '',
  maxPrice: '',
  availability: '',
  sort: 'newest',
  page: '1',
};

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 12 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const filters = useMemo(
    () => ({
      search: searchParams.get('search') || '',
      sellerSearch: searchParams.get('sellerSearch') || '',
      seller: searchParams.get('seller') || '',
      category: searchParams.get('category') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      availability: searchParams.get('availability') || '',
      sort: searchParams.get('sort') || 'newest',
      page: searchParams.get('page') || '1',
    }),
    [searchParams]
  );

  const updateParams = (updates, { resetPage = true } = {}) => {
    const next = {
      ...filters,
      ...updates,
    };

    if (resetPage && updates.page === undefined) {
      next.page = '1';
    }

    const cleaned = {};
    Object.entries(next).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        cleaned[key] = String(value);
      }
    });

    // Drop defaults to keep URLs clean
    if (cleaned.sort === DEFAULT_FILTERS.sort) delete cleaned.sort;
    if (cleaned.page === '1') delete cleaned.page;

    setSearchParams(cleaned);
  };

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await productService.getProducts({
        search: filters.search || undefined,
        sellerSearch: filters.sellerSearch || undefined,
        seller: filters.seller || undefined,
        category: filters.category || undefined,
        minPrice: filters.minPrice || undefined,
        maxPrice: filters.maxPrice || undefined,
        availability: filters.availability || undefined,
        sort: filters.sort || 'newest',
        page: Number(filters.page) || 1,
        limit: 12,
      });

      setProducts(response.data.products || []);
      setPagination(response.data.pagination || { page: 1, pages: 1, total: 0, limit: 12 });
    } catch (err) {
      setProducts([]);
      setError(err.response?.data?.message || 'Unable to load products.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    categoryService
      .getCategories()
      .then((res) => setCategories(res.data.categories || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    updateParams({ [name]: value });
  };

  const clearFilters = () => setSearchParams({});

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.sellerSearch ||
      filters.seller ||
      filters.category ||
      filters.minPrice ||
      filters.maxPrice ||
      filters.availability ||
      (filters.sort && filters.sort !== 'newest')
  );

  return (
    <div className="page container">
      <div className="section__header">
        <h1>Products</h1>
        <p>Search, filter, and sort South Sudanese products from suppliers in the marketplace.</p>
      </div>

      <div className="browse-layout">
        <aside className="browse-filters" aria-label="Product filters">
          <h2>Filters</h2>

          <SearchBar
            initialValue={filters.search}
            onSearch={(query) => updateParams({ search: query })}
            placeholder="Search by product name..."
          />

          {filters.seller && (
            <p className="hint-text">
              Showing products from one seller.{' '}
              <button type="button" className="linkish" onClick={() => updateParams({ seller: '' })}>
                Clear seller filter
              </button>
            </p>
          )}

          <label className="inline-filter">
            Seller
            <input
              type="search"
              name="sellerSearch"
              value={filters.sellerSearch}
              onChange={handleFilterChange}
              placeholder="Business name"
            />
          </label>

          <label className="inline-filter">
            Category
            <select name="category" value={filters.category} onChange={handleFilterChange}>
              <option value="">All categories</option>
              {categories.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <div className="form-row">
            <label className="inline-filter">
              Min price
              <input
                type="number"
                name="minPrice"
                min="0"
                value={filters.minPrice}
                onChange={handleFilterChange}
                placeholder="0"
              />
            </label>
            <label className="inline-filter">
              Max price
              <input
                type="number"
                name="maxPrice"
                min="0"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                placeholder="Any"
              />
            </label>
          </div>

          <label className="inline-filter">
            Availability
            <select
              name="availability"
              value={filters.availability}
              onChange={handleFilterChange}
            >
              <option value="">Any</option>
              <option value="in_stock">In stock</option>
              <option value="out_of_stock">Out of stock</option>
            </select>
          </label>

          <label className="inline-filter">
            Sort by
            <select name="sort" value={filters.sort} onChange={handleFilterChange}>
              <option value="newest">Newest</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
              <option value="rating">Highest rated</option>
            </select>
          </label>

          {hasActiveFilters && (
            <button type="button" className="btn btn--ghost" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </aside>

        <section className="browse-results">
          <div className="browse-results__meta">
            <p>
              {loading
                ? 'Searching catalogue...'
                : `${pagination.total} product${pagination.total === 1 ? '' : 's'} found`}
            </p>
          </div>

          {error && (
            <p className="form-alert" role="alert">
              {error}
            </p>
          )}

          {loading ? (
            <LoadingSpinner label="Loading products..." />
          ) : (
            <>
              <ProductGrid
                products={products}
                emptyMessage="No products match your filters. Try clearing search or price range."
              />
              <Pagination
                page={pagination.page}
                pages={pagination.pages}
                onPageChange={(page) => updateParams({ page: String(page) }, { resetPage: false })}
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default Products;
