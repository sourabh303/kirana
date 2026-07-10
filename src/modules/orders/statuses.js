/**
 * PRD Section 6 — Order Workflow:
 * 1. Customer selects a shop
 * 2. Customer places an order
 * 3. Shopkeeper reviews the order
 * 4. Shopkeeper marks unavailable items
 * 5. Customer reviews the updated order
 * 6. Customer confirms
 * 7. Shopkeeper packs the order
 * 8. Delivery partner is assigned
 * 9. Order is delivered
 * 10. Customer confirms receipt
 */

const STATUS = Object.freeze({
  PLACED: 'placed',
  UNDER_REVIEW: 'under_review',
  REVISED: 'revised', // shopkeeper marked some items unavailable, awaiting customer
  CONFIRMED: 'confirmed', // customer accepted the (possibly revised) order
  PACKED: 'packed',
  DELIVERY_ASSIGNED: 'delivery_assigned',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered', // delivery partner marked delivered
  COMPLETED: 'completed', // customer confirmed receipt
  CANCELLED: 'cancelled',
});

// Adjacency list of legal forward transitions.
const TRANSITIONS = {
  [STATUS.PLACED]: [STATUS.UNDER_REVIEW, STATUS.CANCELLED],
  [STATUS.UNDER_REVIEW]: [STATUS.REVISED, STATUS.CONFIRMED, STATUS.CANCELLED],
  [STATUS.REVISED]: [STATUS.CONFIRMED, STATUS.CANCELLED],
  [STATUS.CONFIRMED]: [STATUS.PACKED, STATUS.CANCELLED],
  [STATUS.PACKED]: [STATUS.DELIVERY_ASSIGNED, STATUS.CANCELLED],
  [STATUS.DELIVERY_ASSIGNED]: [STATUS.OUT_FOR_DELIVERY, STATUS.CANCELLED],
  [STATUS.OUT_FOR_DELIVERY]: [STATUS.DELIVERED],
  [STATUS.DELIVERED]: [STATUS.COMPLETED],
  [STATUS.COMPLETED]: [],
  [STATUS.CANCELLED]: [],
};

function canTransition(from, to) {
  return (TRANSITIONS[from] || []).includes(to);
}

module.exports = { STATUS, TRANSITIONS, canTransition };
