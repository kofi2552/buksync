import axios from "axios";

// You can adjust this based on where you're storing the user info
import { getUserFromStorage } from "./authHelper"; // custom function to fetch user

const bookingApi = axios.create({
  baseURL: "http://localhost:8000/api",
  withCredentials: true,
  timeout: 25000,
});

// Attach the token + user info before every request
bookingApi.interceptors.request.use(
  (config) => {
    const { token, email } = getUserFromStorage() || {};
    const apiKey = token;

    if (apiKey) {
      config.headers["Authorization"] = `Bearer ${apiKey}`;
    }

    if (email) {
      config.headers["x-user-email"] = email;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default bookingApi;
