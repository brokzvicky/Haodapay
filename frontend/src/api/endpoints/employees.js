import { axiosClient } from '../axiosClient';

export const employeesApi = {
  list: (search) => axiosClient.get('/api/employees', { params: search ? { search } : {} }).then((res) => res.data),
  getById: (id) => axiosClient.get(`/api/employees/${id}`).then((res) => res.data),
  create: (payload) => axiosClient.post('/api/employees', payload).then((res) => res.data),
  update: (id, payload) => axiosClient.put(`/api/employees/${id}`, payload).then((res) => res.data),
  updateStatus: (id, status, reason) =>
    axiosClient.patch(`/api/employees/${id}/status`, { status, reason }).then((res) => res.data),
  setBiometricMapping: (id, deviceUserId) =>
    axiosClient.patch(`/api/employees/${id}/biometric-mapping`, { deviceUserId }).then((res) => res.data),
};
