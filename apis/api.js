import APIBase from "../api_base/apiBase";

const BASE_API_URL = 'https://uat-api.quickso.in/api';

// Login API
export const loginAPI = new APIBase({
  baseURL: `${BASE_API_URL}/app-auth/login/`,
});

// Projects API
export const projectsAPI = new APIBase({
  baseURL: `${BASE_API_URL}/projects/`,
});