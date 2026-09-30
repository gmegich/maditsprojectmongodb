const Payment = require('../models/Payment');
const Order = require('../models/Order');
const {
  isMockMode,
  initiateStkPush,
  buildMockSuccessCallback,
  normalizePhone,
} = require('../services/mpesaService');
const {
  createNotification,
  notifyOrderStatusChange,
} = require('../services/notificationService');

const getCallbackItem = (items = [], name) => {
  const found = items.find((item) => item.Name === name);
  return found ? found.Value : undefined;
};

const markOrderPaid = async (order, payment) => {
  const previousStatus = order.orderStatus;
  order.paymentStatus = 'paid';
  if (order.orderStatus === 'Pending') {
    order.orderStatus = 'Confirmed';
  }
  order.paymentMethod = payment.paymentMethod === 'mock' ? 'mpesa' : order.paymentMethod;

  order.statusHistory = order.statusHistory || [];
  order.statusHistory.push({
    status: order.orderStatus,
    deliveryStatus: order.deliveryStatus || 'not_shipped',
    note: `Payment completed${
      payment.mpesaReceiptNumber ? ` (receipt ${payment.mpesaReceiptNumber})` : ''
    }`,
    at: new Date(),
  });

  await order.save();

  await createNotification({
    userId: order.buyerId,
    title: `Payment received for ${order.orderNumber}`,
    message: `Your payment of KES ${payment.amount} was successful.`,
    type: 'payment',
    relatedId: order._id,
  });

  if (previousStatus !== order.orderStatus) {
    await notifyOrderStatusChange(order, previousStatus, order.orderStatus);
  }
};

/**
 * POST /api/payments/mpesa
 * Initiate STK Push for an unpaid order.
 */
const initiateMpesaPayment = async (req, res, next) => {
  try {
    const { orderId, phoneNumber } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    if (order.buyerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('You can only pay for your own orders.');
    }

    if (order.orderStatus === 'Cancelled') {
      res.status(400);
      throw new Error('Cancelled orders cannot be paid.');
    }

    if (order.paymentStatus === 'paid') {
      res.status(400);
      throw new Error('This order is already paid.');
    }

    const phone = phoneNumber || order.deliveryAddress?.phone || req.user.phone;
    const stk = await initiateStkPush({
      amount: order.totalAmount,
      phoneNumber: phone,
      accountReference: order.orderNumber,
      transactionDesc: 'SS Marketplace',
    });

    if (stk.ResponseCode && String(stk.ResponseCode) !== '0') {
      res.status(502);
      throw new Error(stk.ResponseDescription || 'M-Pesa request failed');
    }

    const payment = await Payment.create({
      orderId: order._id,
      userId: req.user._id,
      amount: order.totalAmount,
      paymentMethod: stk.mock ? 'mock' : 'mpesa',
      transactionId: stk.CheckoutRequestID || '',
      paymentStatus: 'processing',
      phoneNumber: stk.phoneNumber,
    });

    order.paymentStatus = 'pending';
    order.paymentMethod = 'mpesa';
    await order.save();

    // In mock mode, simulate a successful Daraja callback shortly after STK push.
    if (stk.mock) {
      setTimeout(async () => {
        try {
          const mockBody = buildMockSuccessCallback({
            checkoutRequestID: stk.CheckoutRequestID,
            merchantRequestID: stk.MerchantRequestID,
            amount: stk.amount,
            phoneNumber: stk.phoneNumber,
          });
          await processStkCallbackPayload(mockBody);
        } catch (error) {
          console.error('Mock M-Pesa callback failed:', error.message);
        }
      }, 1500);
    }

    res.status(200).json({
      success: true,
      message: stk.mock
        ? 'Mock M-Pesa prompt initiated. Payment will complete automatically in a moment.'
        : 'M-Pesa prompt sent. Enter your PIN on your phone.',
      data: {
        payment,
        mpesa: {
          checkoutRequestID: stk.CheckoutRequestID,
          merchantRequestID: stk.MerchantRequestID,
          customerMessage: stk.CustomerMessage,
          mock: Boolean(stk.mock),
        },
      },
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

/**
 * Shared callback processor for real and mock Daraja payloads.
 */
const processStkCallbackPayload = async (body) => {
  const callback = body?.Body?.stkCallback;
  if (!callback) {
    throw new Error('Invalid M-Pesa callback payload');
  }

  const checkoutRequestID = callback.CheckoutRequestID;
  const payment = await Payment.findOne({ transactionId: checkoutRequestID }).select(
    '+rawCallback'
  );

  if (!payment) {
    return { handled: false, message: 'Payment not found for CheckoutRequestID' };
  }

  if (payment.paymentStatus === 'completed') {
    return { handled: true, message: 'Payment already completed', payment };
  }

  payment.rawCallback = body;

  if (callback.ResultCode === 0) {
    const items = callback.CallbackMetadata?.Item || [];
    payment.paymentStatus = 'completed';
    payment.mpesaReceiptNumber = String(getCallbackItem(items, 'MpesaReceiptNumber') || '');
    payment.amount = Number(getCallbackItem(items, 'Amount') || payment.amount);
    payment.phoneNumber = String(
      getCallbackItem(items, 'PhoneNumber') || payment.phoneNumber
    );
    const txDate = getCallbackItem(items, 'TransactionDate');
    payment.transactionDate = txDate ? new Date() : new Date();
    await payment.save();

    const order = await Order.findById(payment.orderId);
    if (order) {
      await markOrderPaid(order, payment);
    }

    return { handled: true, message: 'Payment completed', payment };
  }

  payment.paymentStatus = 'failed';
  await payment.save();

  const order = await Order.findById(payment.orderId);
  if (order && order.paymentStatus !== 'paid') {
    order.paymentStatus = 'failed';
    await order.save();
  }

  return {
    handled: true,
    message: callback.ResultDesc || 'Payment failed',
    payment,
  };
};

/**
 * POST /api/payments/mpesa/callback
 * Public Daraja callback endpoint (no JWT).
 */
const mpesaCallback = async (req, res, next) => {
  try {
    const result = await processStkCallbackPayload(req.body);
    // Always acknowledge Safaricom quickly
    res.status(200).json({
      ResultCode: 0,
      ResultDesc: result.message || 'Accepted',
    });
  } catch (error) {
    console.error('M-Pesa callback error:', error.message);
    res.status(200).json({
      ResultCode: 0,
      ResultDesc: 'Accepted with errors logged',
    });
  }
};

/**
 * GET /api/payments/:id
 */
const getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id).populate(
      'orderId',
      'orderNumber totalAmount paymentStatus orderStatus'
    );

    if (!payment) {
      res.status(404);
      throw new Error('Payment not found');
    }

    if (
      payment.userId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      res.status(403);
      throw new Error('Not authorized to view this payment');
    }

    res.status(200).json({
      success: true,
      message: 'Payment retrieved',
      data: { payment, mockMode: isMockMode() },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/payments/order/:orderId
 */
const getPaymentsByOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    if (order.buyerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized');
    }

    const payments = await Payment.find({ orderId: order._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Payments retrieved',
      data: { payments, mockMode: isMockMode() },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/payments/mpesa/mock-complete
 * Manually complete a mock payment (useful if auto-complete was missed).
 */
const mockCompletePayment = async (req, res, next) => {
  try {
    if (!isMockMode()) {
      res.status(400);
      throw new Error('Mock completion is only available when MPESA_MOCK_MODE is enabled.');
    }

    const { paymentId, checkoutRequestID } = req.body;
    const payment = paymentId
      ? await Payment.findById(paymentId)
      : await Payment.findOne({ transactionId: checkoutRequestID });

    if (!payment) {
      res.status(404);
      throw new Error('Payment not found');
    }

    if (
      payment.userId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      res.status(403);
      throw new Error('Not authorized');
    }

    const mockBody = buildMockSuccessCallback({
      checkoutRequestID: payment.transactionId,
      merchantRequestID: `MOCK-MRC-${Date.now()}`,
      amount: payment.amount,
      phoneNumber: payment.phoneNumber || normalizePhone(req.user.phone),
    });

    const result = await processStkCallbackPayload(mockBody);

    res.status(200).json({
      success: true,
      message: 'Mock payment completed',
      data: { payment: result.payment },
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

module.exports = {
  initiateMpesaPayment,
  mpesaCallback,
  getPaymentById,
  getPaymentsByOrder,
  mockCompletePayment,
};
