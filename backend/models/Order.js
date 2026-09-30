const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    image: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const deliveryAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    county: { type: String, required: true, trim: true },
    landmark: { type: String, trim: true, default: '' },
    additionalInfo: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const ORDER_STATUSES = [
  'Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ORDER_STATUSES,
      required: true,
    },
    deliveryStatus: {
      type: String,
      enum: ['not_shipped', 'in_transit', 'out_for_delivery', 'delivered', 'returned'],
      default: 'not_shipped',
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    at: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Buyer is required'],
    },
    sellerIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seller',
      },
    ],
    items: {
      type: [orderItemSchema],
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: 'Order must contain at least one item',
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total amount cannot be negative'],
    },
    deliveryAddress: {
      type: deliveryAddressSchema,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    orderStatus: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'Pending',
    },
    deliveryStatus: {
      type: String,
      enum: ['not_shipped', 'in_transit', 'out_for_delivery', 'delivered', 'returned'],
      default: 'not_shipped',
    },
    paymentMethod: {
      type: String,
      enum: ['mpesa', 'card', 'cash_on_delivery'],
      default: 'mpesa',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: '',
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ buyerId: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ sellerIds: 1 });

orderSchema.statics.ORDER_STATUSES = ORDER_STATUSES;

module.exports = mongoose.model('Order', orderSchema);
