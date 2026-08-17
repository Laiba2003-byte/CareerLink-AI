import axios from "axios";

let pendingRequests = 0;

function emitLoading() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("careerlink:loading", {
        detail: { pending: pendingRequests }
      })
    );
  }
}

function startRequest(config) {
  pendingRequests += 1;
  emitLoading();
  return config;
}

function finishRequest() {
  pendingRequests = Math.max(0, pendingRequests - 1);
  emitLoading();
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api"
});

api.interceptors.request.use(
  (config) => startRequest(config),
  (error) => {
    finishRequest();
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    finishRequest();
    return response;
  },
  (error) => {
    finishRequest();
    const message = error.response?.data?.message || error.message || "Request failed";
    return Promise.reject(new Error(message));
  }
);
