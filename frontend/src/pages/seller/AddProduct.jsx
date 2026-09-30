import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import categoryService from '../../services/categoryService';
import productService from '../../services/productService';

const AddProduct = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stockQuantity: '1',
    categoryId: '',
    location: '',
    status: 'active',
  });

  useEffect(() => {
    categoryService
      .getCategories()
      .then((res) => setCategories(res.data.categories || []))
      .catch(() => setError('Unable to load categories. Ask admin to seed categories.'));
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await productService.createProduct(form, Array.from(files));
      navigate('/seller/products');
    } catch (err) {
      const apiError = err.response?.data;
      const details = Array.isArray(apiError?.error)
        ? apiError.error.join(', ')
        : apiError?.message;
      setError(details || 'Unable to create product.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page container">
      <p className="breadcrumb">
        <Link to="/seller/products">Products</Link> / Add
      </p>
      <h1>Add product</h1>
      <p>List a South Sudanese product for customers in Kenya.</p>

      {error && (
        <p className="form-alert" role="alert">
          {error}
        </p>
      )}

      <form className="auth-form product-form" onSubmit={handleSubmit}>
        <label>
          Product name
          <input name="name" value={form.name} onChange={handleChange} required />
        </label>
        <label>
          Description
          <textarea
            name="description"
            rows={5}
            value={form.description}
            onChange={handleChange}
            required
          />
        </label>
        <div className="form-row">
          <label>
            Price (KES)
            <input
              type="number"
              name="price"
              min="0"
              step="1"
              value={form.price}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Stock quantity
            <input
              type="number"
              name="stockQuantity"
              min="0"
              step="1"
              value={form.stockQuantity}
              onChange={handleChange}
              required
            />
          </label>
        </div>
        <label>
          Category
          <select name="categoryId" value={form.categoryId} onChange={handleChange} required>
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Location
          <input name="location" value={form.location} onChange={handleChange} />
        </label>
        <label>
          Status
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="out_of_stock">Out of stock</option>
          </select>
        </label>
        <label>
          Product images
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => setFiles(event.target.files || [])}
          />
        </label>
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Saving...' : 'Create product'}
        </button>
      </form>
    </div>
  );
};

export default AddProduct;
