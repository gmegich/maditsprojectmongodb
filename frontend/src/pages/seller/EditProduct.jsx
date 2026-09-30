import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import categoryService from '../../services/categoryService';
import productService, { resolveImageUrl } from '../../services/productService';

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [files, setFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stockQuantity: '0',
    categoryId: '',
    location: '',
    status: 'active',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [categoryRes, productRes] = await Promise.all([
          categoryService.getCategories(),
          productService.getProductById(id),
        ]);
        setCategories(categoryRes.data.categories || []);
        const product = productRes.data.product;
        setForm({
          name: product.name || '',
          description: product.description || '',
          price: String(product.price ?? ''),
          stockQuantity: String(product.stockQuantity ?? 0),
          categoryId: product.categoryId?._id || product.categoryId || '',
          location: product.location || '',
          status: product.status || 'active',
        });
        setExistingImages(product.images || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load product.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await productService.updateProduct(id, form, Array.from(files));
      navigate('/seller/products');
    } catch (err) {
      const apiError = err.response?.data;
      const details = Array.isArray(apiError?.error)
        ? apiError.error.join(', ')
        : apiError?.message;
      setError(details || 'Unable to update product.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page container">
        <p>Loading product...</p>
      </div>
    );
  }

  return (
    <div className="page container">
      <p className="breadcrumb">
        <Link to="/seller/products">Products</Link> / Edit
      </p>
      <h1>Edit product</h1>

      {error && (
        <p className="form-alert" role="alert">
          {error}
        </p>
      )}

      {existingImages.length > 0 && (
        <div className="image-preview-row">
          {existingImages.map((image) => (
            <img key={image} src={resolveImageUrl(image)} alt="" />
          ))}
        </div>
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
          Add more images
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => setFiles(event.target.files || [])}
          />
        </label>
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save changes'}
        </button>
      </form>
    </div>
  );
};

export default EditProduct;
