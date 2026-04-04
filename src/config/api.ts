const fallbackApiUrl = "http://localhost:4001";

export const API_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || fallbackApiUrl;

export const buildApiUrl = (path: string) => `${API_URL}${path}`;
