import axios from "axios";

const api = axios.create({
  baseURL: "https://tudlin-api.onrender.com/api", // Your LIVE backend URL
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 25000,
});
export default api;
