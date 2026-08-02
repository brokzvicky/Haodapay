// Centralized so axiosClient (which can't import AuthContext without a
// circular dependency) and AuthContext both read/write tokens the same way.
// localStorage is fine here - these are JWTs meant to survive a page
// refresh, and XSS is mitigated at the framework level (React escapes by
// default) rather than by moving the token out of JS-reachable storage.

const ACCESS_TOKEN_KEY = 'haodaone_access_token';
const REFRESH_TOKEN_KEY = 'haodaone_refresh_token';

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};
