import api from './api';
import { Progress } from '../types';

export const progressService = {
  getAllProgress: async (): Promise<Progress[]> => {
    const response = await api.get('/progress');
    return response.data.allProgress;
  },

  getCourseProgress: async (courseId: string): Promise<Progress> => {
    const response = await api.get(`/progress/${courseId}`);
    return response.data.progress;
  },

  markLectureCompleted: async (courseId: string, lectureId: string): Promise<Progress> => {
    const response = await api.post(`/progress/${courseId}/lectures/${lectureId}/complete`);
    return response.data.progress;
  },

  markLectureIncomplete: async (courseId: string, lectureId: string): Promise<Progress> => {
    const response = await api.post(`/progress/${courseId}/lectures/${lectureId}/incomplete`);
    return response.data.progress;
  },
};
