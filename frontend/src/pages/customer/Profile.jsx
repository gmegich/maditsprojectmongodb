import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    city: '',
    county: '',
    address: { street: '', building: '', landmark: '' },
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        phone: user.phone || '',
        city: user.city || '',
        county: user.county || '',
        address: {
          street: user.address?.street || '',
          building: user.address?.building || '',
          landmark: user.address?.landmark || '',
        },
      });
    }
  }, [user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name.startsWith('address.')) {
      const key = name.split('.')[1];
      setForm((prev) => ({
        ...prev,
        address: { ...prev.address, [key]: value },
      }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setSaving(true);

    try {
      await authService.updateProfile(form);
      await refreshUser();
      setMessage('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setSaving(true);

    try {
      await authService.changePassword(passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '' });
      setMessage('Password changed successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to change password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page container">
      <h1>My profile</h1>
      <p>
        Signed in as <strong>{user?.email}</strong> ({user?.role})
      </p>

      {message && <p className="form-success">{message}</p>}
      {error && (
        <p className="form-alert" role="alert">
          {error}
        </p>
      )}

      <form className="auth-form" onSubmit={handleProfileSubmit}>
        <label>
          Full name
          <input name="name" value={form.name} onChange={handleChange} required />
        </label>
        <label>
          Phone
          <input name="phone" value={form.phone} onChange={handleChange} required />
        </label>
        <label>
          City
          <input name="city" value={form.city} onChange={handleChange} />
        </label>
        <label>
          County
          <input name="county" value={form.county} onChange={handleChange} />
        </label>
        <label>
          Street
          <input name="address.street" value={form.address.street} onChange={handleChange} />
        </label>
        <label>
          Building
          <input
            name="address.building"
            value={form.address.building}
            onChange={handleChange}
          />
        </label>
        <label>
          Landmark
          <input
            name="address.landmark"
            value={form.address.landmark}
            onChange={handleChange}
          />
        </label>
        <button type="submit" className="btn btn--primary" disabled={saving}>
          Save profile
        </button>
      </form>

      <h2>Change password</h2>
      <form className="auth-form" onSubmit={handlePasswordSubmit}>
        <label>
          Current password
          <input
            type="password"
            name="currentPassword"
            value={passwordForm.currentPassword}
            onChange={(e) =>
              setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))
            }
            required
          />
        </label>
        <label>
          New password
          <input
            type="password"
            name="newPassword"
            value={passwordForm.newPassword}
            onChange={(e) =>
              setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
            }
            minLength={6}
            required
          />
        </label>
        <button type="submit" className="btn btn--primary" disabled={saving}>
          Update password
        </button>
      </form>
    </div>
  );
};

export default Profile;
