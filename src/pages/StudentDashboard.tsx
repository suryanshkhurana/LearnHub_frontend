import { useState, useEffect } from 'react';
import { BookOpen, TrendingUp, Award, LogOut } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService } from '../services/dashboardService';
import { courseService } from '../services/courseService';
import { progressService } from '../services/progressService';
import { Course, Progress } from '../types';
import { CourseCard } from '../components/CourseCard';
import { Card } from '../components/ui/Card';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [dashboardAverageCompletion, setDashboardAverageCompletion] = useState(0);
  const [dashboardCompletedCourses, setDashboardCompletedCourses] = useState(0);
  const [loading, setLoading] = useState(true);

  const getProgressCourseId = (course: Progress['course']) =>
    typeof course === 'string' ? course : course._id;

  const handleWithdraw = async (courseId: string) => {
    if (!confirm('Are you sure you want to withdraw from this course?')) return;
    try {
      await courseService.withdrawFromCourse(courseId);
      setEnrolledCourses((prev) => prev.filter((c) => c._id !== courseId));
      setProgress((prev) => prev.filter((p) => getProgressCourseId(p.course) !== courseId));
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to withdraw');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentDashboard, progressData] = await Promise.all([
          dashboardService.getStudentDashboard(),
          progressService.getAllProgress(),
        ]);

        setEnrolledCourses(studentDashboard.enrolledCourses ?? []);
        setProgress(progressData ?? []);
        setDashboardAverageCompletion(studentDashboard.overview?.averageCompletion ?? 0);
        setDashboardCompletedCourses(studentDashboard.overview?.completedCourses ?? 0);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const averageProgress =
    dashboardAverageCompletion > 0
      ? dashboardAverageCompletion
      : progress?.length > 0
      ? Math.round(
          progress.reduce((sum, p) => sum + (p.completionPercentage ?? 0), 0) / progress.length
        )
      : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
          <p className="text-gray-600 mt-2">Continue your learning journey</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Enrolled Courses</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {enrolledCourses.length}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <BookOpen className="text-blue-600" size={24} />
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Average Progress</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{averageProgress}%</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <TrendingUp className="text-green-600" size={24} />
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Completed</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {dashboardCompletedCourses || progress.filter((p) => p.completionPercentage === 100).length}
                  </p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <Award className="text-yellow-600" size={24} />
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">My Courses</h2>
        </div>

        {enrolledCourses.length === 0 ? (
          <Card>
            <div className="p-12 text-center">
              <BookOpen className="mx-auto text-gray-400 mb-4" size={64} />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No courses yet
              </h3>
              <p className="text-gray-600 mb-6">
                Start learning by enrolling in a course
              </p>
              <a
                href="/courses"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Courses
              </a>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledCourses.map((course) => {
              const courseProgress = progress.find((p) => getProgressCourseId(p.course) === course._id);
              const isPaidCourse = Boolean(course.isPaid || course.price > 0);
              return (
                <div key={course._id} className="relative">
                  <CourseCard course={course} />
                  {courseProgress && (
                    <div className="mt-2">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{courseProgress.completionPercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${courseProgress.completionPercentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {!isPaidCourse && (
                    <Button
                      variant="danger"
                      size="sm"
                      className="mt-2 w-full flex items-center justify-center gap-1"
                      onClick={() => handleWithdraw(course._id)}
                    >
                      <LogOut size={14} /> Withdraw
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
