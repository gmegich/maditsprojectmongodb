import { useEffect, useState } from 'react';
import categoryService from '../../services/categoryService';

const emptyForm = {
  name: '',
  description: '',
  image: '',
  status: 'active',
};

const ManageCategories = () => {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await categoryService.getCategories({ all: true });
      setCategories(response.data.categories || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      if (editingId) {
        await categoryService.updateCategory(editingId, form);
        setMessage('Category updated.');
      } else {
        await categoryService.createCategory(form);
        setMessage('Category created.');
      }
      resetForm();
      loadCategories();
    } catch (err) {
      const apiError = err.response?.data;
      const details = Array.isArray(apiError?.error)
        ? apiError.error.join(', ')
        : apiError?.message;
      setError(details || 'Unable to save category.');
    }
  };

  const handleEdit = (category) => {
    setEditingId(category._id);
    setForm({
      name: category.name || '',
      description: category.description || '',
      image: category.image || '',
      status: category.status || 'active',
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    setError('');
    setMessage('');
    try {
      await categoryService.deleteCategory(id);
      setMessage('Category deleted.');
      loadCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete category.');
    }
  };

  return (
    <div className="page container">
      <h1>Manage categories</h1>
      <p>Create and maintain product categories for the marketplace.</p>

      {message && <p className="form-success">{message}</p>}
      {error && (
        <p className="form-alert" role="alert">
          {error}
        </p>
      )}

      <form className="auth-form product-form" onSubmit={handleSubmit}>
        <h2>{editingId ? 'Edit category' : 'Add category'}</h2>
        <label>
          Name
          <input name="name" value={form.name} onChange={handleChange} required />
        </label>
        <label>
          Description
          <textarea
            name="description"
            rows={3}
            value={form.description}
            onChange={handleChange}
          />
        </label>
        <label>
          Image URL
          <input name="image" value={form.image} onChange={handleChange} />
        </label>
        <label>
          Status
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <div className="form-actions">
          <button type="submit" className="btn btn--primary">
            {editingId ? 'Update category' : 'Create category'}
          </button>
          {editingId && (
            <button type="button" className="btn btn--ghost" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <p>Loading categories...</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category._id}>
                  <td>{category.name}</td>
                  <td>{category.description || '—'}</td>
                  <td>{category.status}</td>
                  <td className="table-actions">
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={() => handleEdit(category)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={() => handleDelete(category._id)}
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

export default ManageCategories;
