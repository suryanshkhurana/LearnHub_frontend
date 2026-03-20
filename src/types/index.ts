export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'instructor';
  avatar?: string;
  enrolledCourses?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  instructor: User | string;
  schedule?: {
    day: string;
    startTime: string;
    endTime: string;
  };
  learningFormat?: 'self-paced' | 'cohort';
  estimatedHours?: number;
  level?: 'beginner' | 'intermediate' | 'advanced';
  language?: string;
  weeklyEffortHours?: number;
  maxStudents: number;
  enrolledStudents: number | any[];
  price: number;
  isPaid: boolean;
  status: 'draft' | 'published' | 'archived';
  lectureCount?: number;
  lectures?: Lecture[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CourseStudentProgress {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  completionPercentage: number;
  completedLecturesCount: number;
  isCompleted: boolean;
  lastActiveAt?: string | null;
  joinedAt?: string;
}

export interface Lecture {
  _id: string;
  title: string;
  description?: string;
  videoUrl: string;
  duration?: number;
  order: number;
  isPreview: boolean;
  course: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Progress {
  _id: string;
  user: string;
  course: string | Course;
  completedLectures: Array<string | Lecture>;
  isCompleted: boolean;
  completionPercentage: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Payment {
  _id: string;
  user: User | string;
  course: Course | string | null;
  amount: number;
  currency: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  status: 'pending' | 'created' | 'paid' | 'failed';
  failureReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InstructorPaymentsResponse {
  payments: Payment[];
  overview: {
    paidTransactions: number;
    totalRevenue: number;
    uniqueStudents: number;
  };
}

export interface InstructorCourseSummary {
  _id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  isPaid: boolean;
  enrolledCount: number;
  createdAt?: string;
}

export interface PublicInstructorProfile {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt?: string;
}

export interface InstructorPublicOverview {
  instructor: PublicInstructorProfile;
  courses: InstructorCourseSummary[];
  totalCourses: number;
  totalStudents: number;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface DashboardStats {
  overview?: {
    totalEnrolled?: number;
    completedCourses?: number;
    inProgressCourses?: number;
    averageCompletion?: number;
    totalLecturesCompleted?: number;
    totalCourses?: number;
    totalEnrollments?: number;
    uniqueStudents?: number;
    totalLectures?: number;
    totalRevenue?: number;
    studentsCompleted?: number;
    avgStudentCompletion?: number;
  };
  categoryBreakdown?: Record<string, number>;
  statusBreakdown?: {
    draft: number;
    published: number;
    archived: number;
  };
  courseProgress?: Array<{
    course: Course | string;
    completionPercentage: number;
    completedLectures: number;
    isCompleted: boolean;
  }>;
  enrolledCourses?: Course[];
  courseSummaries?: Array<{
    _id: string;
    title: string;
    category: string;
    status: 'draft' | 'published' | 'archived';
    enrolledCount: number;
    lectureCount: number;
    price: number;
    revenue: number;
    avgStudentCompletion: number;
    createdAt: string;
  }>;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string>;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
