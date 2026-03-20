import api from './api';
import { Lecture } from '../types';

export const lectureService = {
  createLecture: async (
    courseId: string,
    data: {
      title: string;
      description?: string;
      order: number;
      isPreview: boolean;
      video: File;
    }
  ): Promise<Lecture> => {
    const formData = new FormData();
    formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    formData.append('order', data.order.toString());
    formData.append('isPreview', data.isPreview.toString());
    formData.append('video', data.video);

    const response = await api.post(`/courses/${courseId}/lectures`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.lecture;
  },

  getLectures: async (courseId: string): Promise<Lecture[]> => {
    const response = await api.get(`/courses/${courseId}/lectures`);
    return response.data.lectures;
  },

  getLectureById: async (courseId: string, lectureId: string): Promise<Lecture> => {
    const response = await api.get(`/courses/${courseId}/lectures/${lectureId}`);
    return response.data.lecture;
  },

  updateLecture: async (
    courseId: string,
    lectureId: string,
    data: Partial<{
      title: string;
      description: string;
      isPreview: boolean;
    }>
  ): Promise<Lecture> => {
    const response = await api.put(`/courses/${courseId}/lectures/${lectureId}`, data);
    return response.data.lecture;
  },

  reorderLectures: async (
    courseId: string,
    lectureOrders: Array<{ lectureId: string; order: number }>
  ): Promise<void> => {
    await api.patch(`/courses/${courseId}/lectures/reorder`, { lectureOrders });
  },

  deleteLecture: async (courseId: string, lectureId: string): Promise<void> => {
    await api.delete(`/courses/${courseId}/lectures/${lectureId}`);
  },
};
