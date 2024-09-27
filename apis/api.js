import APIBase from "../api_base/apiBase";

const BASE_API_URL = "http://192.168.0.114:1337/api";

// Login API
export const loginAPI = new APIBase({
  baseURL: `${BASE_API_URL}/app-auth/login/`,
});

// logout api
export const logoutAPI = new APIBase({
  baseURL: `${BASE_API_URL}/app-auth/log-out`,
});

// Projects API
export const projectsAPI = new APIBase({
  baseURL: `${BASE_API_URL}/projects/`,
});

// Calendar API
export const calendarAPI = new APIBase({
  baseURL: `${BASE_API_URL}/calendar/`,
});

// Employee API
export const employeeAPI = new APIBase({
  baseURL: `${BASE_API_URL}/employees/`,
});

// Tasks API
export const tasksAPI = new APIBase({
  baseURL: `${BASE_API_URL}/tasks/`,
});

// Attendance API
export const attendanceAPI = new APIBase({
  baseURL: `${BASE_API_URL}/attendances/`,
});

// Daily Report API
export const dailyReportAPI = new APIBase({
  baseURL: `${BASE_API_URL}/daily-reports/`,
});

// Daily Report API
export const dailyReportImageAPI = new APIBase({
  baseURL: `${BASE_API_URL}/upload/`,
  defaultHeaders: {
    'Content-Type': 'multipart/form-data'
  }, // Important for file uploads
});
