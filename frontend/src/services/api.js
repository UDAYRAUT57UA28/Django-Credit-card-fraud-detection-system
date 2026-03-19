import axios from "axios";

// In production (Vercel), set REACT_APP_API_URL to your Render backend URL.
// Locally it falls back to localhost:8000.
const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const API = axios.create({
  baseURL: `${BASE_URL}/api`,
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh token on 401
API.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      const refresh = localStorage.getItem("refresh_token");
      if (refresh) {
        try {
          const { data } = await axios.post(`${BASE_URL}/api/auth/refresh/`, { refresh });
          localStorage.setItem("access_token", data.access);
          err.config.headers.Authorization = `Bearer ${data.access}`;
          return API(err.config);
        } catch {
          localStorage.clear();
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(err);
  }
);

export const login = (credentials) => axios.post(`${BASE_URL}/api/auth/login/`, credentials);
export const register = (data) => axios.post(`${BASE_URL}/api/users/register/`, data);
export const getProfile = () => API.get("/users/profile/");

export const detectFraud = (data) => API.post("/detect/", data);
export const getTransactions = (params) => API.get("/transactions/", { params });
export const getTransactionDetail = (id) => API.get(`/transactions/${id}/`);

export const getCards = () => API.get("/cards/");
export const addCard = (data) => API.post("/cards/", data);
export const freezeCard = (id) => API.post(`/cards/${id}/freeze/`);

export const getAlerts = () => API.get("/alerts/");
export const resolveAlert = (id) => API.post(`/alerts/${id}/resolve/`);

export const getFraudStats = () => API.get("/analytics/stats/");
export const getDailyTrend = () => API.get("/analytics/daily/");
export const getHourlyData = () => API.get("/analytics/hourly/");
export const getRiskyCards = () => API.get("/analytics/risky-cards/");

export const compareModels = (data) => API.post("/compare/", data);

export const getBlacklist = () => API.get("/blacklist/");
export const addToBlacklist = (data) => API.post("/blacklist/", data);
export const removeFromBlacklist = (id) => API.delete(`/blacklist/${id}/`);

export default API;
