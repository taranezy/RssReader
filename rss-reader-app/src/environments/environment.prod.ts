export const environment = {
  production: true,
  // Use /streamlet/api path to match nginx routing configuration
  // The nginx rewrites /streamlet/api/* to /api/* for the backend
  apiUrl: '/streamlet/api'
};
