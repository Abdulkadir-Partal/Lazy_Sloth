import axios from "axios";
import { ACCESS_TOKEN} from "./constants.js";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Report API functions
export const reportApi = {
  createReport: (noteId, reason, description) =>
    api.post("/api/reports/create/", {
      note: noteId,
      reason,
      description
    }),

  getReports: () =>
    api.get("/api/reports/"),

  actionReport: (reportId, action, moderatorNote = "") =>
    api.post(`/api/reports/${reportId}/action/`, {
      action,
      moderator_note: moderatorNote
    })
};

// Product API functions
export const productApi = {
  getProducts: () =>
    api.get("/api/products/"),

  createProduct: (data) =>
    api.post("/api/products/create/", data),

  updateProduct: (id, data) =>
    api.put(`/api/products/${id}/update/`, data),

  deleteProduct: (id) =>
    api.delete(`/api/products/${id}/delete/`)
};

// Cart API functions
export const cartApi = {
  getCart: () =>
    api.get("/api/cart/"),

  addToCart: (productId, quantity) =>
    api.post("/api/cart/add/", {
      product_id: productId,
      quantity
    }),

  removeFromCart: (itemId) =>
    api.post("/api/cart/remove/", {
      item_id: itemId
    }),

  checkout: () =>
    api.post("/api/cart/checkout/")
};

export default api;