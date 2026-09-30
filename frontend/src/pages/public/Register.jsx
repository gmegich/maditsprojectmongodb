import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  const { register, isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'customer',
    city: '',
    county: '',
    businessName: '',
    businessDescription: '',
    businessLocation: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && isAuthenticated) {
    const home = user?.role === 'seller' ? '/seller' : '/customer';
    return <Navigate to={home} replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: form.role,
        city: form.city,
        county: form.county,
      };

      if (form.role === 'seller') {
        payload.businessName = form.businessName;
        payload.businessDescription = form.businessDescription;
        payload.businessLocation = form.businessLocation || form.city;
      }

      const response = await register(payload);
      navigate(response.data.user.role === 'seller' ? '/seller' : '/customer', {
        replace: true,
      });
    } catch (err) {
      const apiError = err.response?.data;
      const details = Array.isArray(apiError?.error)
        ? apiError.error.join(', ')
        : apiError?.message;
      setError(details || 'Unable to register. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page container auth-page">
      <h1>Create an account</h1>
      <p>Join as a customer or register as a South Sudanese supplier.</p>

      {error && (
        <p className="form-alert" role="alert">
          {error}
        </p>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Full name
          <input
            type="text"
            name="name"
            autoComplete="name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Email
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Phone
          <input
            type="tel"
            name="phone"
            autoComplete="tel"
            value={form.phone}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Role
          <select name="role" value={form.role} onChange={handleChange}>
            <option value="customer">Customer</option>
            <option value="seller">Seller</option>
          </select>
        </label>
        <label>
          City
          <input type="text" name="city" value={form.city} onChange={handleChange} />
        </label>
        <label>
          County
          <input type="text" name="county" value={form.county} onChange={handleChange} />
        </label>

        {form.role === 'seller' && (
          <>
            <label>
              Business name
              <input
                type="text"
                name="businessName"
                value={form.businessName}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Business location
              <input
                type="text"
                name="businessLocation"
                value={form.businessLocation}
                onChange={handleChange}
              />
            </label>
            <label>
              Business description
              <input
                type="text"
                name="businessDescription"
                value={form.businessDescription}
                onChange={handleChange}
              />
            </label>
          </>
        )}

        <label>
          Password
          <input
            type="password"
            name="password"
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
            minLength={6}
            required
          />
        </label>

        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Register'}
        </button>
      </form>

      <p>
        Already registered? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};

export default Register;
