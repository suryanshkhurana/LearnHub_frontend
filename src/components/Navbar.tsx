import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, LogOut, User, LayoutDashboard, CreditCard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2">
            <BookOpen className="text-blue-600" size={32} />
            <span className="text-2xl font-bold text-gray-900">LearnHub</span>
          </Link>

          <div className="flex items-center gap-4">
            {user?.role === 'instructor' ? (
              <Link to="/instructor/payments">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <CreditCard size={18} />
                  My Payments
                </Button>
              </Link>
            ) : (
              <Link to="/courses">
                <Button variant="outline" size="sm">
                  Browse Courses
                </Button>
              </Link>
            )}

            {user ? (
              <>
                <Link to={user.role === 'instructor' ? '/instructor/dashboard' : '/student/dashboard'}>
                  <Button variant="primary" size="sm" className="flex items-center gap-2">
                    <LayoutDashboard size={18} />
                    Dashboard
                  </Button>
                </Link>
                {user.role === 'student' && (
                  <Link to="/student/payments">
                    <button className="p-2 rounded-full hover:bg-gray-100 transition-colors" title="Payment History">
                      <CreditCard size={24} className="text-gray-700" />
                    </button>
                  </Link>
                )}
                <Link to="/profile">
                  <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                    <User size={24} className="text-gray-700" />
                  </button>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <LogOut size={24} className="text-gray-700" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
