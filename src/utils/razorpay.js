/**
 * Razorpay integration helper.
 * Docs: https://razorpay.com/docs/api/
 *
 * Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env to enable real payments.
 * When keys are absent the module falls back to "mock" mode so the rest of the
 * app keeps working during local development.
 */
const crypto = require('crypto');

let razorpay = null;
let isMock = false;

function getClient() {
  if (razorpay) return razorpay;

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    console.warn('[razorpay] RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set — running in mock mode');
    isMock = true;
    return null;
  }

  const Razorpay = require('razorpay');
  razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
  return razorpay;
}

/**
 * Create a Razorpay order for online payments.
 * Returns a mock order object when keys are absent.
 */
async function createOrder({ amount, currency = 'INR', receipt, notes = {} }) {
  const client = getClient();
  if (isMock || !client) {
    return {
      id: `mock_order_${Date.now()}`,
      amount: Math.round(amount * 100),
      currency,
      receipt,
      status: 'created',
      _mock: true,
    };
  }
  return client.orders.create({
    amount: Math.round(amount * 100), // Razorpay expects paise
    currency,
    receipt,
    notes,
  });
}

/**
 * Verify Razorpay payment signature (call after frontend confirms payment).
 * Returns true if the signature is valid.
 */
function verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  if (isMock) return true; // skip in mock mode
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return expected === razorpaySignature;
}

/**
 * Verify Razorpay webhook signature.
 */
function verifyWebhookSignature(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return expected === signature;
}

module.exports = { createOrder, verifyPaymentSignature, verifyWebhookSignature };
