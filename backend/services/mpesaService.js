const axios = require('axios');

const isMockMode = () => {
  if (process.env.MPESA_MOCK_MODE === 'true') return true;
  return !(
    process.env.MPESA_CONSUMER_KEY &&
    process.env.MPESA_CONSUMER_SECRET &&
    process.env.MPESA_PASSKEY &&
    process.env.MPESA_SHORTCODE
  );
};

const getBaseUrl = () =>
  process.env.MPESA_ENVIRONMENT === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';

/**
 * Normalize Kenyan phone numbers to 2547XXXXXXXX / 2541XXXXXXXX.
 */
const normalizePhone = (phone = '') => {
  let value = String(phone).replace(/\s+/g, '').replace(/^\+/, '');

  if (value.startsWith('0')) {
    value = `254${value.slice(1)}`;
  }

  if (!/^254(7|1)\d{8}$/.test(value)) {
    const error = new Error('Enter a valid Kenyan M-Pesa number (e.g. 07XXXXXXXX).');
    error.statusCode = 400;
    throw error;
  }

  return value;
};

const getTimestamp = () => {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd}${hh}${min}${ss}`;
};

const getPassword = (timestamp) => {
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
};

/**
 * Fetch Daraja OAuth access token.
 */
const getAccessToken = async () => {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  const response = await axios.get(
    `${getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: { Authorization: `Basic ${auth}` },
      timeout: 15000,
    }
  );

  return response.data.access_token;
};

/**
 * Initiate STK Push (Lipa Na M-Pesa Online).
 * Uses mock responses when credentials are unavailable.
 */
const initiateStkPush = async ({ amount, phoneNumber, accountReference, transactionDesc }) => {
  const phone = normalizePhone(phoneNumber);
  const roundedAmount = Math.max(1, Math.round(Number(amount)));

  if (isMockMode()) {
    const checkoutRequestID = `MOCK-CHK-${Date.now()}`;
    const merchantRequestID = `MOCK-MRC-${Date.now()}`;

    return {
      mock: true,
      phoneNumber: phone,
      amount: roundedAmount,
      MerchantRequestID: merchantRequestID,
      CheckoutRequestID: checkoutRequestID,
      ResponseCode: '0',
      ResponseDescription: 'Success. Request accepted for processing (mock)',
      CustomerMessage: 'Mock STK push sent. Complete payment in the app.',
    };
  }

  const token = await getAccessToken();
  const timestamp = getTimestamp();
  const password = getPassword(timestamp);

  const payload = {
    BusinessShortCode: process.env.MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: roundedAmount,
    PartyA: phone,
    PartyB: process.env.MPESA_SHORTCODE,
    PhoneNumber: phone,
    CallBackURL: process.env.MPESA_CALLBACK_URL,
    AccountReference: String(accountReference).slice(0, 12),
    TransactionDesc: String(transactionDesc || 'Order payment').slice(0, 13),
  };

  const response = await axios.post(
    `${getBaseUrl()}/mpesa/stkpush/v1/processrequest`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 20000,
    }
  );

  return {
    mock: false,
    phoneNumber: phone,
    amount: roundedAmount,
    ...response.data,
  };
};

/**
 * Build a successful mock Daraja callback body.
 */
const buildMockSuccessCallback = ({ checkoutRequestID, merchantRequestID, amount, phoneNumber }) => {
  const receipt = `MOCK${Date.now().toString().slice(-8)}`;
  return {
    Body: {
      stkCallback: {
        MerchantRequestID: merchantRequestID,
        CheckoutRequestID: checkoutRequestID,
        ResultCode: 0,
        ResultDesc: 'The service request is processed successfully (mock).',
        CallbackMetadata: {
          Item: [
            { Name: 'Amount', Value: amount },
            { Name: 'MpesaReceiptNumber', Value: receipt },
            { Name: 'TransactionDate', Value: Number(getTimestamp()) },
            { Name: 'PhoneNumber', Value: Number(phoneNumber) },
          ],
        },
      },
    },
  };
};

module.exports = {
  isMockMode,
  normalizePhone,
  initiateStkPush,
  buildMockSuccessCallback,
};
