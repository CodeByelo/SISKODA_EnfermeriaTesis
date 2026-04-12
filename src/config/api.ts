const fallbackApiUrl = import.meta.env.DEV
  ? "http://localhost:4001"
  : "https://websistemnurse-backend.onrender.com";

export const API_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || fallbackApiUrl;

export const buildApiUrl = (path: string) => `${API_URL}${path}`;
