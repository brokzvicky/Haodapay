import { createContext, useCallback, useEffect, useState } from 'react';
import { authApi } from '../api/endpoints/auth';
import { tokenStorage } from './tokenStorage';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      const token = tokenStorage.getAccessToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const me = await authApi.me();
        setUser(me);
      } catch {
        // axiosClient's interceptor already tried a refresh and failed if
        // we land here - session really is gone.
        tokenStorage.clear();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    restoreSession();
  }, []);

  const login = useCallback(async (username, password) => {
    const data = await authApi.login(username, password);
    tokenStorage.setTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {
      // Best-effort - clear local state regardless of whether the server call succeeded.
    }
    tokenStorage.clear();
    setUser(null);
  }, []);

  const hasRole = useCallback((roleName) => !!user?.roles?.includes(roleName), [user]);

  const hasAnyRole = useCallback((roleNames) => roleNames.some((r) => user?.roles?.includes(r)), [user]);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    hasRole,
    hasAnyRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
