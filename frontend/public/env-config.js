// Runtime configuration injected via this file.
// For local development, this file provides defaults.
// For container/runtime, the entrypoint will overwrite the file in the built
// image with a runtime-generated version that contains values passed via
// environment variables (e.g. BACKEND_URL).

// Runtime configuration that builds endpoint URLs from a single BACKEND_URL.
// Local default BACKEND_URL is http://localhost:3002. Container runtime can
// overwrite this file entirely to change BACKEND_URL and thus all endpoints.
(function () {
  var BACKEND_URL = "http://localhost:3002";

  // Expose a consistent object at window.__RUNTIME_CONFIG__
  window.__RUNTIME_CONFIG__ = {
    PORT: 3005,

    BACKEND_URL: BACKEND_URL,

    GET_ALL_ORDERS: BACKEND_URL + "/purchase-orders/",
    POST_ALL_ORDERS: BACKEND_URL + "/purchase-orders/",
    DELETE_ORDER: BACKEND_URL + "/purchase-orders/",

    GET_ALL_TASKS: BACKEND_URL + "/tasks/?purchase_order_id=",
    POST_ALL_TASKS: BACKEND_URL + "/tasks/",
    PATCH_ALL_TASKS: BACKEND_URL + "/tasks/",
    DELETE_TASK: BACKEND_URL + "/tasks/",

    TASK_DETAILS: BACKEND_URL + "/tasks/task-details/",
    INCOMING_CHART_UPLOAD: BACKEND_URL + "/tasks/incoming-chart-upload/",
    OUTGOING_CHART_UPLOAD: BACKEND_URL + "/tasks/outgoing-chart-upload/",

    GET_DROPDOWN_OPTIONS: BACKEND_URL + "/purchase-orders/metadata",

    INVENTORY: BACKEND_URL + "/inventory/"
  };
})();
