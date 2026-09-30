const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order is required'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    paymentMethod: {
      type: String,
      enum: ['mpesa', 'card', 'cash_on_delivery', 'mock'],
      default: 'mpesa',
    },
    transactionId: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
      default: 'pending',
    },
    mpesaReceiptNumber: {
      type: String,
      trim: true,
      default: '',
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: '',
    },
    transactionDate: {
      type: Date,
    },
    rawCallback: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ orderId: 1, paymentStatus: 1 });
paymentSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
