import axios from "axios";
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default class APIBase {
  // Constructor to initialize APIBase with custom configuration
  constructor(config) {
    if (!config.baseURL) throw new Error("Base URL cannot be empty");

    // Configuration defaults are set here, allowing for customization
    this.config = {
      baseURL: config.baseURL, // Base URL for API requests
      defaultHeaders: config.defaultHeaders || {
        "Content-Type": "application/json",
      }, // Default headers for all requests
      timeout: config.timeout || 30000, // Request timeout in milliseconds
      tokenKey: config.tokenKey || false, // Key for storing JWT token in AsyncStorage
      retryLimit: config.retryLimit || 1, // Number of retries for failed requests
      debounceDelay: config.debounceDelay || 0, // Delay for debouncing requests
    };

    // Creating an axios instance with the provided configuration
    this.apiClient = axios.create({
      baseURL: this.config.baseURL,
      headers: this.config.defaultHeaders,
      timeout: this.config.timeout,
    });

    // Bind methods to ensure 'this' context
    this.get = this.get.bind(this);
    this.post = this.post.bind(this);
    this.put = this.put.bind(this);
    this.patch = this.patch.bind(this);
    this.delete = this.delete.bind(this);

    // Interceptors for handling request and response
    this.apiClient.interceptors.request.use((config) => {
      // Add token before making the request
      this.addToken();
      return config;
    }, error => {
      return Promise.reject(error);
    });

    // Debounce Settings
    if (this.config.debounceDelay) {
      this.get = this.debounceRequest(this.get);
      this.post = this.debounceRequest(this.post);
      this.put = this.debounceRequest(this.put);
      this.patch = this.debounceRequest(this.patch);
      this.delete = this.debounceRequest(this.delete);
    }
  }

  // Method to add token to headers
  async addToken() {
    const token = await this.getToken();
    if (token) {
      this.apiClient.defaults.headers["Authorization"] = `Bearer ${token}`;
    }
  }

  // Method to handle request interception, e.g., to add auth tokens
  handleRequestInterception = (config) => {
    this.addToken();
    return config;
  };

  // Method to handle successful responses
  handleSuccessResponse = (response) => {
    return response;
  };

  // Method to extract error message from response
  extract_error_message = (data) => {
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      if (data.response && typeof data.response === 'object') {
        const { code, invalid, message } = data.response;
        let invalidMessages = '';
        if (Array.isArray(invalid)) {
          invalidMessages = invalid?.map(item => `ID: ${item.id}, Year: ${item.year}`).join('; ');
        }
        return `${message}, Invalid: ${invalidMessages}`;
      }

      return Object.entries(data)
        .map(([key, value]) => {
          const messages = Array.isArray(value) ? value.join(', ') : value;
          return `${messages}`;
        })
        .join('\n');
    }

    return data?.error || data?.detail || data?.details || data?.message || data?.response?.message || "An unexpected error occurred";
  };

  // Method to handle error responses
  handleErrorResponse = (error) => {
    const { response } = error;

    if (response) {
      const { status, data, config } = response;
      const errorMessage = this.extract_error_message(data);

      if (['post', 'delete', 'patch', 'put'].includes(config.method.toLowerCase())) {
        switch (status) {
          case 404:
            Toast.show({ type: 'error', text1: "Not Found", text2: errorMessage });
            throw error;
          case 403:
            Toast.show({ type: 'error', text1: "Permission Denied", text2: errorMessage });
            throw error;
          case 500:
            Toast.show({ type: 'error', text1: "Server Error", text2: errorMessage });
            throw error;
          case 400:
            Toast.show({ type: 'error', text1: "Please fill all details" });
            throw error;
          default:
            Toast.show({ type: 'error', text1: "Error", text2: errorMessage });
        }
      }
    } else if (error.request) {
      Toast.show({ type: 'error', text1: "Network Error", text2: "No response was received" });
    } else {
      Toast.show({ type: 'error', text1: "Error", text2: error.message || "Something went wrong" });
    }
  };

  // General method to make an API request
  async makeRequest(method, endpoint = "", data = null, headers = {}, params = "") {
    const fullEndpoint = endpoint || this.config.baseURL;
    const effectiveHeaders = { ...this.config.defaultHeaders, ...headers };

    const debouncedFunc = this.debounceRequest(async () => {
      const response = await this.apiClient({
        method,
        url: fullEndpoint + params,
        data,
        headers: effectiveHeaders,
      });
      return response.data;
    });

    try {
      return await debouncedFunc();
    } catch (error) {
      this.handleErrorResponse(error);
      if (error?.response?.status === 404) {
        return error;
      } else {
        throw error;
      }
    }
  }

  // Specific methods for different HTTP verbs
  get(endpoint = "", params = "", headers = {}) {
    return this.makeRequest("get", endpoint, null, headers, params);
  }

  post(endpoint = "", data, headers = {}) {
    return this.makeRequest("post", endpoint, data, headers);
  }

  put(endpoint = "", data, headers = {}) {
    return this.makeRequest("put", endpoint, data, headers);
  }

  patch(endpoint = "", data, headers = {}) {
    return this.makeRequest("patch", endpoint, data, headers);
  }

  delete(endpoint = "", headers = {}) {
    return this.makeRequest("delete", endpoint, null, headers);
  }

  // Methods for token management in AsyncStorage
  async getToken() {
    return await AsyncStorage.getItem("access_token");
  }

  async setToken(token) {
    await AsyncStorage.setItem("access_token", token);
  }

  async removeToken() {
    await AsyncStorage.removeItem("access_token");
  }

  // Utility method to format dates
  formatDate(date) {
    return new Date(date).toLocaleDateString("en-US");
  }

  // Utility method to parse JSON safely
  parseJSON(response) {
    try {
      return JSON.parse(response);
    } catch (error) {
      return null;
    }
  }

  // Utility method to serialize URL parameters
  serializeParams(params) {
    return Object.entries(params)
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
      )
      .join("&");
  }

  // Method to check if response status is successful
  checkStatus(response) {
    if (response.status >= 200 && response.status < 300) {
      return response;
    } else {
      throw new Error(response.statusText);
    }
  }

  // Method to extract error message from response
  extractErrorMessage(error) {
    return error.response ? error.response.data.message : error.message;
  }

  // Method to build Authorization header
  buildAuthHeader(token) {
    return { Authorization: `Bearer ${token}` };
  }

  // Utility method for logging requests
  logRequest(url, method, data) {
    console.log(`Requesting ${method.toUpperCase()} ${url} with data:`, data);
  }

  // Debounce utility to prevent rapid firing of requests
  debounceRequest(func) {
    let inDebounce;
    return async (...args) => {
      clearTimeout(inDebounce);
      return new Promise((resolve, reject) => {
        inDebounce = setTimeout(async () => {
          try {
            resolve(await func(...args));
          } catch (error) {
            reject(error);
          }
        }, this.config.debounceDelay);
      });
    };
  }

  // Method for validating response schema (implementation pending)
  validateResponseSchema(response, schema) {
    // Implement schema validation logic if required
  }

  // Interceptor for token refresh logic
  tokenRefreshInterceptor(apiClient, refreshToken) {
    apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          // Implement token refresh logic here
          return apiClient(originalRequest);
        }
        return Promise.reject(error);
      }
    );
  }
}
