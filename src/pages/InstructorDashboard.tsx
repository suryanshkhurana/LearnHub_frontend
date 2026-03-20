import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, DollarSign, Plus, Edit2, Trash2 } from 'lucide-react';
import { courseService } from '../services/courseService';
import { dashboardService } from '../services/dashboardService';
import { Course } from '../types';
import { CourseCard } from '../components/CourseCard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const InstructorDashboard = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [overview, setOverview] = useState<{ totalEnrollments?: number; totalRevenue?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const [data, dashboard] = await Promise.all([
          courseService.getMyCourses(),
          dashboardService.getInstructorDashboard(),
        ]);
        setCourses(data);
        setOverview(dashboard.overview ?? null);
      } catch (error) {
        console.error('Failed to fetch courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const getEnrolledCount = (c: typeof courses[number]) =>
    Array.isArray(c.enrolledStudents) ? c.enrolledStudents.length : (c.enrolledStudents || 0);

  const handleDeleteCourse = async (course: Course) => {
    if (!confirm(`Are you sure you want to delete "${course.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingCourseId(course._id);
      await courseService.deleteCourse(course._id);

      const removedEnrolledCount = getEnrolledCount(course);
      setCourses((prev) => prev.filter((c) => c._id !== course._id));
      setOverview((prev) => {
        if (!prev) return prev;
        return {
          totalEnrollments: Math.max(0, (prev.totalEnrollments ?? 0) - removedEnrolledCount),
          totalRevenue: Math.max(0, (prev.totalRevenue ?? 0) - removedEnrolledCount * course.price),
        };
      });
    } catch (error: any) {
      console.error('Failed to delete course:', error);
      alert(error.response?.data?.message || 'Failed to delete course');
    } finally {
      setDeletingCourseId(null);
    }
  };

  const totalStudents = overview?.totalEnrollments ?? courses.reduce((sum, course) => sum + getEnrolledCount(course), 0);
  const totalRevenue = overview?.totalRevenue ?? courses.reduce(
    (sum, course) => sum + getEnrolledCount(course) * course.price,
    0
  );

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
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Instructor Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage your courses and students</p>
          </div>
          <Link to="/instructor/courses/new">
            <Button className="flex items-center gap-2">
              <Plus size={20} />
              Create Course
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Courses</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{courses.length}</p>
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
                  <p className="text-gray-600 text-sm">Total Students</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{totalStudents}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <Users className="text-green-600" size={24} />
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Revenue</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">₹{totalRevenue}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <DollarSign className="text-yellow-600" size={24} />
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">My Courses</h2>
        </div>

        {courses.length === 0 ? (
          <Card>
            <div className="p-12 text-center">
              <BookOpen className="mx-auto text-gray-400 mb-4" size={64} />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No courses yet
              </h3>
              <p className="text-gray-600 mb-6">
                Create your first course and start teaching
              </p>
              <Link to="/instructor/courses/new">
                <Button className="inline-flex items-center gap-2">
                  <Plus size={20} />
                  Create Course
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div key={course._id}>
                <div className="relative">
                  <CourseCard course={course} showInstructor={false} />
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span
                      className={`px-3 py-1 rounded-full ${
                        course.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {course.status}
                    </span>
                    <div className="flex items-center gap-2">
                      <Link to={`/instructor/courses/${course._id}/edit`}>
                        <Button variant="outline" size="sm" className="inline-flex items-center gap-1">
                          <Edit2 size={14} /> Update
                        </Button>
                      </Link>
                      <Button
                        variant="danger"
                        size="sm"
                        className="inline-flex items-center gap-1"
                        onClick={() => handleDeleteCourse(course)}
                        isLoading={deletingCourseId === course._id}
                      >
                        <Trash2 size={14} /> Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
