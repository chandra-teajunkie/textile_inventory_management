// runtimeConfig.js
// Expose a single `cfg` object that components can import. Values come from:
// 1) window.__RUNTIME_CONFIG__ (set by public/env-config.js or overwritten at container runtime)
// 2) fall back to process.env.REACT_APP_* build-time variables
// 3) sensible defaults

const R = (typeof window !== 'undefined' && window.__RUNTIME_CONFIG__) || {};

const BACKEND_URL = R.BACKEND_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:3002';

export const cfg = {
  BACKEND_URL,
  PORT: R.PORT || process.env.REACT_APP_PORT || 3005,

  GET_ALL_ORDERS: R.GET_ALL_ORDERS || process.env.REACT_APP_GET_ALL_ORDERS || `${BACKEND_URL}/purchase-orders/`,
  POST_ALL_ORDERS: R.POST_ALL_ORDERS || process.env.REACT_APP_POST_ALL_ORDERS || `${BACKEND_URL}/purchase-orders/`,
  DELETE_ORDER: R.DELETE_ORDER || process.env.REACT_APP_DELETE_ORDER || `${BACKEND_URL}/purchase-orders/`,

  GET_ALL_TASKS: R.GET_ALL_TASKS || process.env.REACT_APP_GET_ALL_TASKS || `${BACKEND_URL}/tasks/?purchase_order_id=`,
  POST_ALL_TASKS: R.POST_ALL_TASKS || process.env.REACT_APP_POST_ALL_TASKS || `${BACKEND_URL}/tasks/`,
  PATCH_ALL_TASKS: R.PATCH_ALL_TASKS || process.env.REACT_APP_PATCH_ALL_TASKS || `${BACKEND_URL}/tasks/`,
  DELETE_TASK: R.DELETE_TASK || process.env.REACT_APP_DELETE_TASK || `${BACKEND_URL}/tasks/`,

  TASK_DETAILS: R.TASK_DETAILS || process.env.REACT_APP_TASK_DETAILS || `${BACKEND_URL}/tasks/task-details/`,
  INCOMING_CHART_UPLOAD: R.INCOMING_CHART_UPLOAD || process.env.REACT_APP_INCOMING_CHART_UPLOAD || `${BACKEND_URL}/tasks/incoming-chart-upload/`,
  OUTGOING_CHART_UPLOAD: R.OUTGOING_CHART_UPLOAD || process.env.REACT_APP_OUTGOING_CHART_UPLOAD || `${BACKEND_URL}/tasks/outgoing-chart-upload/`,

  GET_DROPDOWN_OPTIONS: R.GET_DROPDOWN_OPTIONS || process.env.REACT_APP_GET_DROPDOWN_OPTIONS || `${BACKEND_URL}/purchase-orders/metadata`,

  INVENTORY: R.INVENTORY || process.env.REACT_APP_INVENTORY || `${BACKEND_URL}/inventory/`,

  // Add any other endpoints used in the app as needed
};

export default cfg;
