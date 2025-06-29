import axios from "axios";
import { jwtDecode } from "jwt-decode";

const axiosInstance = axios.create({
  baseURL: "http://localhost:3000/api",
});

// Request interceptor for API calls
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const token = localStorage.getItem("token");
    const refreshToken = localStorage.getItem("refreshToken");
    const originalRequest = error.config;

    if (isTokenExpired(token)) {
      originalRequest._retry = true;
      try {
        const refreshData = new URLSearchParams();
        refreshData.append("refreshToken", refreshToken);

        const response = await axios.post(
          "http://localhost:3000/api/refresh-token",
          refreshData,
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        );

        const newToken = response.data.token; // Adjust if needed
        localStorage.setItem("token", newToken);
        axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
        window.location.reload();
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        handleLogout(); // Logout if refresh fails
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

function isTokenExpired(token) {
  try {
    const { exp } = jwtDecode(token); // Decode the token
    return Date.now() >= exp * 1000; // Compare current time with token expiration
  } catch (error) {
    console.error("Error decoding token:", error);
    return true;
  }
}

// Function to handle logout
function handleLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  window.location.href = "/prijava"; // Redirect to login page
}

// Export the Axios instance as the default export
export default axiosInstance;