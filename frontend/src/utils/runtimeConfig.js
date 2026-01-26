// runtimeConfig.js
// Expose a single `cfg` object that components can import. Values come from:
// 1) window._env_ (set by public/env.js at runtime)
// 2) sensible defaults 

const R = (typeof window !== 'undefined' && window._env_) || {};

const BACKEND_URL = R.BACKEND_URL || 'http://localhost:3002';

export const cfg = {
  BACKEND_URL,

  // These endpoints are now constructed from BACKEND_URL
  GET_ALL_ORDERS: `${BACKEND_URL}/purchase-orders/`,
  POST_ALL_ORDERS: `${BACKEND_URL}/purchase-orders/`,
  DELETE_ORDER: `${BACKEND_URL}/purchase-orders/`,

  GET_ALL_TASKS: `${BACKEND_URL}/tasks/?purchase_order_id=`,
  POST_ALL_TASKS: `${BACKEND_URL}/tasks/`,
  PATCH_ALL_TASKS: `${BACKEND_URL}/tasks/`,
  DELETE_TASK: `${BACKEND_URL}/tasks/`,

  TASK_DETAILS: `${BACKEND_URL}/tasks/task-details/`,
  INCOMING_CHART_UPLOAD: `${BACKEND_URL}/tasks/incoming-chart-upload/`,
  OUTGOING_CHART_UPLOAD: `${BACKEND_URL}/tasks/outgoing-chart-upload/`,

  GET_DROPDOWN_OPTIONS: `${BACKEND_URL}/purchase-orders/metadata`,
  INVENTORY: `${BACKEND_URL}/inventory/`,

  // Add any other endpoints used in the app as needed
};

// Helper function to safely get order ID from order objects
// Backend returns 'purchase_order_id' but frontend may use 'order_id' or 'id'
export const getOrderId = (order) => {
  if (!order) return null;
  return order.purchase_order_id || order.order_id || order.id;
};

export default cfg;
