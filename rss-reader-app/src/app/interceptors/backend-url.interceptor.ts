import { HttpInterceptorFn } from '@angular/common/http';

/**
 * HTTP Interceptor that modifies API URLs for direct backend access when running in Android WebView
 * 
 * When the Android app injects a backend URL, this interceptor:
 * 1. Detects requests to /api/* endpoints
 * 2. Replaces the relative URL with the direct backend URL
 * 3. Bypasses the Angular dev server proxy
 * 
 * This solves the ERR_CONTENT_LENGTH_MISMATCH error from the proxy
 */
export const backendUrlInterceptor: HttpInterceptorFn = (req, next) => {
  // Check if running in native app with injected backend URL
  const backendUrl = getInjectedBackendUrl();
  
  if (backendUrl && req.url.startsWith('/api')) {
    // Replace /api with http://192.168.100.10:3000/api
    const directUrl = `${backendUrl}${req.url}`;
    
    const modifiedReq = req.clone({
      url: directUrl,
      withCredentials: true  // Ensure cookies are sent
    });
    
    return next(modifiedReq);
  }
  
  // No backend URL injected, use default (proxy)
  return next(req);
};

/**
 * Get the backend URL injected by the Android native app
 */
function getInjectedBackendUrl(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  // Check window object
  if ((window as any).BACKEND_API_URL) {
    return (window as any).BACKEND_API_URL;
  }
  
  // Check localStorage
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('backend_api_url');
    if (stored) {
      return stored;
    }
  }
  
  return null;
}
