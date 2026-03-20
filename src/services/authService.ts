import api from './api';
import { User, AuthResponse, Course } from '../types';

export const authService = {
  register: async (data: {
    name: string;
    email: string;
    password: string;
    role: 'student' | 'instructor';
  }): Promise<{ user: User; message?: string }> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/current-user');
    return response.data.user;
  },

  updateProfile: async (data: { name?: string; email?: string }): Promise<User> => {
    const response = await api.post('/auth/update-profile', data);
    return response.data.user;
  },

  updateAvatar: async (file: File): Promise<User> => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await api.post('/auth/update-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.user;
  },

  changePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
    await api.post('/auth/change-password', { oldPassword, newPassword });
  },

  getEnrolledCourses: async (): Promise<Course[]> => {
    const response = await api.get('/auth/enrolled-courses');
    return response.data.enrolledCourses;
  },

  enrollInCourse: async (courseId: string): Promise<void> => {
    await api.post(`/auth/enroll/${courseId}`);
  },

  unenrollFromCourse: async (courseId: string): Promise<void> => {
    await api.delete(`/auth/unenroll/${courseId}`);
  },
};
