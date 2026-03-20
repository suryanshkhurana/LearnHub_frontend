import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { courseService } from '../services/courseService';
import { Course } from '../types';
import { CourseCard } from '../components/CourseCard';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';

const CATEGORIES = ['All', 'Frontend', 'Backend', 'Mobile', 'Data Science', 'DevOps', 'Design'];

export const CourseCatalog = () => {
  const { user, loading: authLoading } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchCourses();
  }, [page, selectedCategory]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 9 };
      if (selectedCategory !== 'All') {
        params.category = selectedCategory;
      }
      if (searchTerm) {
        params.search = searchTerm;
      }

      const data = await courseService.getPublishedCourses(params);
      setCourses(data.data ?? []);
      setTotalPages(data.totalPages ?? 1);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCourses();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (user?.role === 'instructor') {
    return <Navigate to="/instructor/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold mb-4">Explore Courses</h1>
          <p className="text-xl text-blue-100">
            Discover and enroll in courses to advance your skills
          </p>

          <form onSubmit={handleSearch} className="mt-8 max-w-2xl">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white text-gray-900 placeholder-gray-500"
                />
              </div>
              <Button type="submit" className="flex items-center gap-2">
                <Search size={20} />
                Search
              </Button>
            </div>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => {
                setSelectedCategory(category);
                setPage(1);
              }}
              className={`px-6 py-2.5 rounded-full font-medium whitespace-nowrap transition-all ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">No courses found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {courses.map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <Button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  variant="outline"
                >
                  Previous
                </Button>
                <span className="px-4 py-2 text-gray-700">
                  Page {page} of {totalPages}
                </span>
                <Button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  variant="outline"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
