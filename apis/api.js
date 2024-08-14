import APIBase from "../api_base/apiBase";

const BASE_API_URL = 'https://uat-api.quickso.in/api';

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

// Attendance API
export const attendanceAPI = new APIBase({
  baseURL: `${BASE_API_URL}/attendances/`,
});