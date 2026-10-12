export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
export const frontendUrl = (import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
const mediaOrigin = (import.meta.env.VITE_MEDIA_BASE_URL ||
  (apiBaseUrl.startsWith('https://') || apiBaseUrl.startsWith('http://') ? new URL(apiBaseUrl).origin : '')
).replace(/\/$/, '');

export function resolveUploadUrls(value: unknown): unknown {
  if (!mediaOrigin) return value;
  if (typeof value === 'string') return value.startsWith('/uploads/') ? `${mediaOrigin}${value}` : value;
  if (Array.isArray(value)) return value.map(resolveUploadUrls);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolveUploadUrls(item)]));
  }
  return value;
}

export function restoreUploadUrls(value: unknown): unknown {
  if (!mediaOrigin) return value;
  if (typeof value === 'string') return value.startsWith(`${mediaOrigin}/uploads/`) ? value.slice(mediaOrigin.length) : value;
  if (value instanceof FormData) {
    const form = new FormData();
    value.forEach((item, key) => form.append(key, typeof item === 'string' ? restoreUploadUrls(item) as string : item));
    return form;
  }
  if (Array.isArray(value)) return value.map(restoreUploadUrls);
  if (value && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, restoreUploadUrls(item)]));
  }
  return value;
}
