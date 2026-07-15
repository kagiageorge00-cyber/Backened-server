const { getBackendBaseUrl, getApiBaseUrl } = require('../config');

describe('backend URL configuration', () => {
  const originalBackendUrl = process.env.BACKEND_URL;
  const originalApiBaseUrl = process.env.API_BASE_URL;
  const originalReactAppApiBaseUrl = process.env.REACT_APP_API_BASE_URL;

  afterEach(() => {
    if (originalBackendUrl === undefined) {
      delete process.env.BACKEND_URL;
    } else {
      process.env.BACKEND_URL = originalBackendUrl;
    }

    if (originalApiBaseUrl === undefined) {
      delete process.env.API_BASE_URL;
    } else {
      process.env.API_BASE_URL = originalApiBaseUrl;
    }

    if (originalReactAppApiBaseUrl === undefined) {
      delete process.env.REACT_APP_API_BASE_URL;
    } else {
      process.env.REACT_APP_API_BASE_URL = originalReactAppApiBaseUrl;
    }
  });

  test('prefers BACKEND_URL and builds API paths', () => {
    process.env.BACKEND_URL = 'https://example.com';

    expect(getBackendBaseUrl()).toBe('https://example.com');
    expect(getApiBaseUrl('/api/admin/login')).toBe('https://example.com/api/admin/login');
  });

  test('falls back to the Render backend when no override is set', () => {
    delete process.env.BACKEND_URL;
    delete process.env.API_BASE_URL;
    delete process.env.REACT_APP_API_BASE_URL;

    expect(getBackendBaseUrl()).toBe('https://backened-server-1.onrender.com');
  });
});
