import axios from "axios";
import { API_URL } from "../config/api";
import { clearSession, getToken } from "../lib/auth";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearSession();
      window.location.href = "/";
    }

    return Promise.reject(error);
  }
);

export default api;
