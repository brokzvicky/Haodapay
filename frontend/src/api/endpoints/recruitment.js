import { axiosClient } from '../axiosClient';

export const jobOpeningsApi = {
  list: () => axiosClient.get('/api/job-openings').then((res) => res.data),
  create: (payload) => axiosClient.post('/api/job-openings', payload).then((res) => res.data),
  setStatus: (id, status) => axiosClient.patch(`/api/job-openings/${id}/status`, { status }).then((res) => res.data),
};

export const candidatesApi = {
  list: (jobOpeningId) => axiosClient.get('/api/candidates', { params: jobOpeningId ? { jobOpeningId } : {} }).then((res) => res.data),
  create: (payload) => axiosClient.post('/api/candidates', payload).then((res) => res.data),
  updateStage: (id, payload) => axiosClient.patch(`/api/candidates/${id}/stage`, payload).then((res) => res.data),
};

export const interviewsApi = {
  byCandidate: (candidateId) => axiosClient.get(`/api/interviews/candidate/${candidateId}`).then((res) => res.data),
  upcoming: () => axiosClient.get('/api/interviews/upcoming').then((res) => res.data),
  schedule: (payload) => axiosClient.post('/api/interviews', payload).then((res) => res.data),
  submitFeedback: (id, payload) => axiosClient.patch(`/api/interviews/${id}/feedback`, payload).then((res) => res.data),
};
