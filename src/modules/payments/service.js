const prisma = require('../../data/prisma');
const ApiError = require('../../utils/ApiError');
const orderService = require('../orders/service');
const razorpay = require('../../utils/razorpay');

const SUPPORTED_METHODS = ['upi', 'card', 'net_banking', 'wallet', 'cod'];

// PRD 13: "Customer payments are processed through the platform."
async function initiatePayment(customerId, { orderId, method }) {
  if (!SUPPORTED_METHODS.includes(method)) {
    throw new ApiError(400, 'Unsupported payment method', { supported: SUPPORTED_METHODS });
  }
  const order = await orderService.getById(orderId);
  if (order.customerId !== customerId) throw new ApiError(403, 'Not your order');

  let razorpayOrderId = null;

  // For online methods, create a Razorpay order
  if (method !== 'cod') {
    const rzpOrder = await razorpay.createOrder({
      amount: order.pricing.total,
      currency: 'INR',
      receipt: orderId,
      notes: { orderId, customerId, method },
    });
    razorpayOrderId = rzpOrder.id;
  }

  const payment = await prisma.payment.create({
    data: {
      orderId,
      customerId,
      amount: order.pricing.total,
      method,
      status: method === 'cod' ? 'pending_on_delivery' : 'pending',
      razorpayOrderId,
    },
  });

  return {
    ...payment,
    // Return Razorpay order details so frontend can open the Razorpay checkout
    razorpayOrderId,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || null,
  };
}

/**
 * Called after the frontend successfully processes an online payment.
 * Verifies the Razorpay signature and marks the payment as captured.
 */
async function captureOnlinePayment(paymentId, { razorpayPaymentId, razorpayOrderId, razorpaySignature }) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw new ApiError(404, 'Payment not found');
  if (payment.method === 'cod') throw new ApiError(400, 'Use confirm-cod for COD payments');

  const valid = razorpay.verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature });
  if (!valid) throw new ApiError(400, 'Invalid payment signature');

  return prisma.payment.update({
    where: { id: paymentId },
    data: { status: 'captured', razorpayPaymentId, razorpaySignature },
  });
}

// Confirms a COD payment once the delivery partner collects cash.
async function confirmCodPayment(paymentId) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw new ApiError(404, 'Payment not found');
  if (payment.method !== 'cod') throw new ApiError(400, 'Not a COD payment');
  return prisma.payment.update({
    where: { id: paymentId },
    data: { status: 'captured', confirmedAt: new Date() },
  });
}

async function listForCustomer(customerId) {
  return prisma.payment.findMany({ where: { customerId }, orderBy: { createdAt: 'desc' } });
}

async function listAll() {
  return prisma.payment.findMany({ orderBy: { createdAt: 'desc' } });
}

module.exports = { SUPPORTED_METHODS, initiatePayment, captureOnlinePayment, confirmCodPayment, listForCustomer, listAll };
