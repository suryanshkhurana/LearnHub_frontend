import { Link } from 'react-router-dom';
import { BookOpen, Users, Award, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pt-20 pb-16 text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            Welcome to <span className="text-blue-600">LearnHub</span>
          </h1>
          <p className="text-2xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Your gateway to unlimited learning. Discover courses, enroll, and master new skills with expert instructors.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/courses">
              <Button size="lg" className="text-lg px-8 py-4">
                Explore Courses
              </Button>
            </Link>
            <Link to="/register">
              <Button size="lg" variant="outline" className="text-lg px-8 py-4">
                Get Started
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-16">
          <div className="bg-white p-8 rounded-2xl shadow-lg text-center hover:shadow-xl transition-shadow">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="text-blue-600" size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Quality Content</h3>
            <p className="text-gray-600">
              Access high-quality courses from experienced instructors
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg text-center hover:shadow-xl transition-shadow">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="text-green-600" size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Expert Instructors</h3>
            <p className="text-gray-600">
              Learn from industry professionals and subject matter experts
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg text-center hover:shadow-xl transition-shadow">
            <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="text-yellow-600" size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Track Progress</h3>
            <p className="text-gray-600">
              Monitor your learning journey with comprehensive progress tracking
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg text-center hover:shadow-xl transition-shadow">
            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="text-red-600" size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Flexible Learning</h3>
            <p className="text-gray-600">
              Learn at your own pace with on-demand video lectures
            </p>
          </div>
        </div>

        <div className="py-16 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to start learning?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of students already learning on LearnHub
          </p>
          <Link to="/register">
            <Button size="lg" className="text-lg px-8 py-4">
              Create Free Account
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
