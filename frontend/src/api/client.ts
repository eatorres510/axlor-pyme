import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://2.25.108.44:5000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

export const apiClient = api;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || "Error de comunicación con el servidor";
    return Promise.reject(new Error(message));
  }
);
