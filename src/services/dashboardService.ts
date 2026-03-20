import api from './api';
import { DashboardStats } from '../types';

export const dashboardService = {
  getStudentDashboard: async (): Promise<DashboardStats> => {
    const response = await api.get('/dashboard/student');
    return response.data.data;
  },

  getInstructorDashboard: async (): Promise<DashboardStats> => {
    const response = await api.get('/dashboard/instructor');
    return response.data.data;
  },
};
