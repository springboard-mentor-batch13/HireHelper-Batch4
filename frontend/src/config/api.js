import axios from "axios";

/* =====================================================
   TOKEN HANDLER
===================================================== */

const addToken = (config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
};

/* =====================================================
   BASE API
===================================================== */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_BASE_URL.replace(/\/api$/, "");

const BASE_API = axios.create({
  baseURL: API_BASE_URL,
});

BASE_API.interceptors.request.use(addToken);

/* =====================================================
   AUTH API
===================================================== */

export const register = (data) =>
  BASE_API.post("/auth/register", data);

export const verifyOtp = (data) =>
  BASE_API.post("/auth/verify-otp", data);

export const resendOtp = (data) =>
  BASE_API.post("/auth/resend-otp", data);

export const login = (data) =>
  BASE_API.post("/auth/login", data);

export const forgotPassword = (data) =>
  BASE_API.post("/auth/forgot-password", data);

export const resetPassword = (data) =>
  BASE_API.post("/auth/reset-password", data);


/* =====================================================
   USER API
===================================================== */

export const getProfile = () =>
  BASE_API.get("/users/profile");

export const updateProfile = (data) =>
  BASE_API.put("/users/update-profile", data);

export const updateProfilePicture = (data) =>
  BASE_API.put("/users/profile-picture", data,{
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });

export const changePassword = (data) =>
  BASE_API.put("/users/change-password", data);


/* =====================================================
   TASK API
===================================================== */

export const createTask = (data) =>
  BASE_API.post("/tasks/create", data);

export const getMyTasks = () =>
  BASE_API.get("/tasks/my-tasks");

export const getFeedTasks = () =>
  BASE_API.get("/tasks/feed");

export const getAssignedTasks = () =>
  BASE_API.get("/tasks/assigned");

export const getTaskById = (id) =>
  BASE_API.get(`/tasks/${id}`);

export const updateTask = (id, data) =>
  BASE_API.put(`/tasks/edit/${id}`, data);

export const deleteTask = (id) =>
  BASE_API.delete(`/tasks/delete/${id}`);


/* =====================================================
   REQUEST API
===================================================== */

export const requestTask = (taskId) =>
  BASE_API.post(`/requests/${taskId}`);

export const getRequestsForMyTasks = () =>
  BASE_API.get("/requests/my-tasks");

export const getMyRequests = () =>
  BASE_API.get("/requests/my-requests");

export const acceptRequest = (requestId) =>
  BASE_API.patch(`/requests/${requestId}/accept`);

export const rejectRequest = (requestId) =>
  BASE_API.patch(`/requests/${requestId}/reject`);


/* =====================================================
   NOTIFICATION API
===================================================== */

export const getNotifications = () =>
  BASE_API.get("/notifications");

export const markNotificationRead = (notificationId) =>
  BASE_API.patch(`/notifications/${notificationId}/read`);

export const markAllNotificationsRead = () =>
  BASE_API.patch("/notifications/read-all");


/* =====================================================
   EXPORT
===================================================== */

export default BASE_API;
