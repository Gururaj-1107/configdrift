import axios from 'axios';

// In production (Vercel), VITE_API_URL points to the Render backend.
// In development, Vite's proxy handles /api -> localhost:5000.
const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to attach JWT token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('configdrift_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// System Health
export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

// Auth Services
export const registerUserApi = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const loginUserApi = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const getMeApi = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// Project Services
export const getProjectsApi = async () => {
  const response = await api.get('/projects');
  return response.data;
};

export const createProjectApi = async (projectData) => {
  const response = await api.post('/projects', projectData);
  return response.data;
};

export const getProjectByIdApi = async (id) => {
  const response = await api.get(`/projects/${id}`);
  return response.data;
};

export const updateProjectApi = async (id, projectData) => {
  const response = await api.put(`/projects/${id}`, projectData);
  return response.data;
};

export const deleteProjectApi = async (id) => {
  const response = await api.delete(`/projects/${id}`);
  return response.data;
};

// Snapshot Services
export const getSnapshotsApi = async (projectId, environment) => {
  const query = environment ? `?environment=${environment}` : '';
  const response = await api.get(`/projects/${projectId}/snapshots${query}`);
  return response.data;
};

export const getLatestSnapshotsApi = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/snapshots/latest`);
  return response.data;
};

export const getSnapshotByIdApi = async (projectId, snapshotId) => {
  const response = await api.get(`/projects/${projectId}/snapshots/${snapshotId}`);
  return response.data;
};

export const createSnapshotApi = async (projectId, snapshotData) => {
  const response = await api.post(`/projects/${projectId}/snapshots`, snapshotData);
  return response.data;
};

export const deleteSnapshotApi = async (projectId, snapshotId) => {
  const response = await api.delete(`/projects/${projectId}/snapshots/${snapshotId}`);
  return response.data;
};

// Comparison & Drift Report Services
export const compareSnapshotsApi = async (projectId, { baseSnapshotId, targetSnapshotId }) => {
  const response = await api.post(`/projects/${projectId}/compare`, {
    baseSnapshotId,
    targetSnapshotId,
  });
  return response.data;
};

export const saveDriftReportApi = async (projectId, { baseSnapshotId, targetSnapshotId }) => {
  const response = await api.post(`/projects/${projectId}/reports`, {
    baseSnapshotId,
    targetSnapshotId,
  });
  return response.data;
};

export const getDriftReportsApi = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/reports`);
  return response.data;
};

export const getDriftReportByIdApi = async (projectId, reportId) => {
  const response = await api.get(`/projects/${projectId}/reports/${reportId}`);
  return response.data;
};

export const exportDriftReportApi = async (projectId, reportId, format = 'json') => {
  const response = await api.get(
    `/projects/${projectId}/reports/${reportId}/export?format=${format}`,
    { responseType: format === 'csv' ? 'blob' : 'json' }
  );
  return response.data;
};

export const deleteDriftReportApi = async (projectId, reportId) => {
  const response = await api.delete(`/projects/${projectId}/reports/${reportId}`);
  return response.data;
};

// Validation Rule Services
export const getValidationRulesApi = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/rules`);
  return response.data;
};

export const createValidationRuleApi = async (projectId, ruleData) => {
  const response = await api.post(`/projects/${projectId}/rules`, ruleData);
  return response.data;
};

export const updateValidationRuleApi = async (projectId, ruleId, ruleData) => {
  const response = await api.put(`/projects/${projectId}/rules/${ruleId}`, ruleData);
  return response.data;
};

export const deleteValidationRuleApi = async (projectId, ruleId) => {
  const response = await api.delete(`/projects/${projectId}/rules/${ruleId}`);
  return response.data;
};

export default api;

