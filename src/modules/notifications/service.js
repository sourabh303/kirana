const prisma = require('../../data/prisma');
const fcm = require('../../utils/fcm');

/**
 * PRD Section 12 — Notifications
 * Channels: push (FCM), SMS, email, in-app. Persists an in-app record and
 * dispatches FCM push when the user has a registered fcmToken.
 */
const EVENTS = [
  'otp',
  'order_placed',
  'order_accepted',
  'order_updated',
  'order_confirmation_required',
  'order_packed',
  'delivery_assigned',
  'out_for_delivery',
  'delivered',
  'settlement_completed',
  'refund_processed',
  'replacement_requested',
  'order_cancelled',
];

const PUSH_MESSAGES = {
  order_placed: { title: 'Order Placed', body: 'Your order has been placed successfully.' },
  order_accepted: { title: 'Order Accepted', body: 'The shopkeeper has accepted your order.' },
  order_updated: { title: 'Order Updated', body: 'Items availability has changed in your order.' },
  order_confirmation_required: { title: 'Confirm Your Order', body: 'Please review and confirm your order.' },
  order_packed: { title: 'Order Packed', body: 'Your order is packed and ready for pickup.' },
  delivery_assigned: { title: 'Delivery Assigned', body: 'A delivery partner has been assigned to your order.' },
  out_for_delivery: { title: 'Out for Delivery', body: 'Your order is on the way!' },
  delivered: { title: 'Delivered', body: 'Your order has been delivered.' },
  order_cancelled: { title: 'Order Cancelled', body: 'Your order has been cancelled.' },
  settlement_completed: { title: 'Settlement Completed', body: 'Your settlement has been processed.' },
};

async function notify(userId, event, payload = {}, channels = ['in_app']) {
  // Persist in-app notification
  const notification = await prisma.notification.create({
    data: {
      userId,
      event,
      payload: JSON.stringify(payload),
      channels: JSON.stringify(channels),
      read: false,
    },
  });

  // Dispatch FCM push if user has a token
  const pushMsg = PUSH_MESSAGES[event];
  if (pushMsg) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { fcmToken: true } });
    if (user?.fcmToken) {
      await fcm.sendToToken(user.fcmToken, { ...pushMsg, data: payload });
    }
  }

  return deserialize(notification);
}

async function listForUser(userId, { unreadOnly } = {}) {
  const notifications = await prisma.notification.findMany({
    where: { userId, ...(unreadOnly ? { read: false } : {}) },
    orderBy: { createdAt: 'desc' },
  });
  return notifications.map(deserialize);
}

async function markRead(userId, notificationId) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });
  if (!notification) return null;
  return prisma.notification
    .update({ where: { id: notificationId }, data: { read: true } })
    .then(deserialize);
}

function deserialize(n) {
  return {
    ...n,
    payload: typeof n.payload === 'string' ? JSON.parse(n.payload) : n.payload,
    channels: typeof n.channels === 'string' ? JSON.parse(n.channels) : n.channels,
  };
}

module.exports = { EVENTS, notify, listForUser, markRead };
