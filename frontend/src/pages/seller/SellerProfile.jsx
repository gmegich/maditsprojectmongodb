import { useEffect, useState } from 'react';
import sellerService from '../../services/sellerService';

const SellerProfile = () => {
  const [form, setForm] = useState({
    businessName: '',
    businessDescription: '',
    businessLocation: '',
    contactInformation: { phone: '', email: '', whatsapp: '' },
  });
  const [verificationStatus, setVerificationStatus] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sellerService
      .getMyProfile()
      .then((res) => {
        const seller = res.data.seller;
        setVerificationStatus(seller.verificationStatus);
        setForm({
          businessName: seller.businessName || '',
          businessDescription: seller.businessDescription || '',
          businessLocation: seller.businessLocation || '',
          contactInformation: {
            phone: seller.contactInformation?.phone || '',
            email: seller.contactInformation?.email || '',
            whatsapp: seller.contactInformation?.whatsapp || '',
          },
        });
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Unable to load seller profile.');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name.startsWith('contact.')) {
      const key = name.split('.')[1];
      setForm((prev) => ({
        ...prev,
        contactInformation: { ...prev.contactInformation, [key]: value },
      }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await sellerService.updateMyProfile(form);
      setMessage('Seller profile updated.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update profile.');
    }
  };

  if (loading) {
    return (
      <div className="page container">
        <p>Loading seller profile...</p>
      </div>
    );
  }

  return (
    <div className="page container">
      <h1>Seller profile</h1>
      <p>
        Verification status: <strong>{verificationStatus || 'unknown'}</strong>
      </p>

      {message && <p className="form-success">{message}</p>}
      {error && (
        <p className="form-alert" role="alert">
          {error}
        </p>
      )}

      <form className="auth-form product-form" onSubmit={handleSubmit}>
        <label>
          Business name
          <input name="businessName" value={form.businessName} onChange={handleChange} required />
        </label>
        <label>
          Business description
          <textarea
            name="businessDescription"
            rows={4}
            value={form.businessDescription}
            onChange={handleChange}
          />
        </label>
        <label>
          Business location
          <input
            name="businessLocation"
            value={form.businessLocation}
            onChange={handleChange}
          />
        </label>
        <label>
          Contact phone
          <input
            name="contact.phone"
            value={form.contactInformation.phone}
            onChange={handleChange}
          />
        </label>
        <label>
          Contact email
          <input
            name="contact.email"
            type="email"
            value={form.contactInformation.email}
            onChange={handleChange}
          />
        </label>
        <label>
          WhatsApp
          <input
            name="contact.whatsapp"
            value={form.contactInformation.whatsapp}
            onChange={handleChange}
          />
        </label>
        <button type="submit" className="btn btn--primary">
          Save profile
        </button>
      </form>
    </div>
  );
};

export default SellerProfile;
