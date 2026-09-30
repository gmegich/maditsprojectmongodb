import { useEffect, useState } from 'react';

/**
 * Controlled search input used across Home and Products pages.
 */
const SearchBar = ({
  onSearch,
  initialValue = '',
  placeholder = 'Search South Sudanese products...',
}) => {
  const [query, setQuery] = useState(initialValue);

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSearch?.(query.trim());
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit} role="search">
      <label htmlFor="product-search" className="sr-only">
        Search products
      </label>
      <input
        id="product-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
      />
      <button type="submit" className="btn btn--primary">
        Search
      </button>
    </form>
  );
};

export default SearchBar;
