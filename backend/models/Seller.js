const mongoose = require('mongoose');

const contactInformationSchema = new mongoose.Schema(
  {
    phone: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    whatsapp: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const sellerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller must be linked to a user account'],
      unique: true,
    },
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
      maxlength: [150, 'Business name cannot exceed 150 characters'],
    },
    businessDescription: {
      type: String,
      trim: true,
      maxlength: [2000, 'Business description cannot exceed 2000 characters'],
      default: '',
    },
    businessLocation: {
      type: String,
      trim: true,
      default: '',
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'deactivated'],
      default: 'pending',
    },
    contactInformation: {
      type: contactInformationSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

sellerSchema.index({ verificationStatus: 1 });
sellerSchema.index({ businessName: 'text' });

module.exports = mongoose.model('Seller', sellerSchema);
