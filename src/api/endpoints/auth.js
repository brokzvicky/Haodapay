import { axiosClient } from '../axiosClient';

export const authApi = {
  login: (username, password) =>
    axiosClient.post('/api/auth/login', { username, password }).then((res) => res.data),

  logout: (refreshToken) => axiosClient.post('/api/auth/logout', { refreshToken }),

  me: () => axiosClient.get('/api/auth/me').then((res) => res.data),

  changePassword: (currentPassword, newPassword) =>
    axiosClient.post('/api/auth/change-password', { currentPassword, newPassword }).then((res) => res.data),
};
