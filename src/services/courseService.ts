import api from './api';
import { Course, CourseStudentProgress, InstructorPublicOverview, PaginatedResponse } from '../types';

export const courseService = {
  getPublishedCourses: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
  }): Promise<PaginatedResponse<Course>> => {
    const response = await api.get('/courses/published', { params });
    const res = response.data;
    return {
      data: res.data ?? res.courses ?? [],
      page: res.page ?? 1,
      limit: res.limit ?? 9,
      total: res.total ?? 0,
      totalPages: res.totalPages ?? 1,
    };
  },

  getCourseById: async (courseId: string): Promise<Course> => {
    const response = await api.get(`/courses/${courseId}`);
    return response.data.course;
  },

  getInstructorOverview: async (instructorId: string): Promise<InstructorPublicOverview> => {
    const response = await api.get(`/courses/instructor/${instructorId}/overview`);
    return {
      instructor: response.data.instructor,
      courses: response.data.courses ?? [],
      totalCourses: response.data.totalCourses ?? 0,
      totalStudents: response.data.totalStudents ?? 0,
    };
  },

  createCourse: async (data: {
    title: string;
    description: string;
    category: string;
    estimatedHours: number;
    level: 'beginner' | 'intermediate' | 'advanced';
    language: string;
    weeklyEffortHours?: number;
    maxStudents: number;
    price: number;
    isPaid: boolean;
    status?: 'draft' | 'published' | 'archived';
  }): Promise<Course> => {
    const response = await api.post('/courses', data);
    return response.data.course;
  },

  updateCourse: async (
    courseId: string,
    data: Partial<{
      title: string;
      description: string;
      category: string;
      estimatedHours: number;
      level: 'beginner' | 'intermediate' | 'advanced';
      language: string;
      weeklyEffortHours?: number;
      maxStudents: number;
      price: number;
      isPaid: boolean;
      status: 'draft' | 'published' | 'archived';
    }>
  ): Promise<Course> => {
    const response = await api.put(`/courses/${courseId}`, data);
    return response.data.course;
  },

  deleteCourse: async (courseId: string): Promise<void> => {
    await api.delete(`/courses/${courseId}`);
  },

  getMyCourses: async (): Promise<Course[]> => {
    const response = await api.get('/courses/instructor/my-courses');
    return response.data.courses;
  },

  enrollInFreeCourse: async (courseId: string): Promise<void> => {
    await api.post(`/courses/${courseId}/enroll`);
  },

  getEnrolledCourses: async (): Promise<Course[]> => {
    const response = await api.get('/courses/student/enrolled');
    return response.data.courses;
  },

  withdrawFromCourse: async (courseId: string): Promise<void> => {
    await api.post(`/courses/${courseId}/withdraw`);
  },

  getCourseStudents: async (courseId: string): Promise<{
    courseId: string;
    courseTitle: string;
    totalLectures: number;
    totalStudents: number;
    students: CourseStudentProgress[];
  }> => {
    const response = await api.get(`/courses/${courseId}/students`);
    return response.data;
  },
};
