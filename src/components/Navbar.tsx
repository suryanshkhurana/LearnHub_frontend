import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, LogOut, User, LayoutDashboard, CreditCard, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    setMenuOpen(false);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="bg-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2" onClick={closeMenu}>
            <BookOpen className="text-blue-600" size={32} />
            <span className="text-2xl font-bold text-gray-900">LearnHub</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-4">
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
                <button onClick={handleLogout} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                  <LogOut size={24} className="text-gray-700" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm">Login</Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">Sign Up</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile: Hamburger Button */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen
              ? <X size={26} className="text-gray-700" />
              : <Menu size={26} className="text-gray-700" />
            }
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg px-4 py-4 flex flex-col gap-3">

          {user?.role === 'instructor' ? (
            <Link to="/instructor/payments" onClick={closeMenu}>
              <Button variant="outline" size="sm" className="w-full flex items-center gap-2 justify-center">
                <CreditCard size={18} />
                My Payments
              </Button>
            </Link>
          ) : (
            <Link to="/courses" onClick={closeMenu}>
              <Button variant="outline" size="sm" className="w-full justify-center">
                Browse Courses
              </Button>
            </Link>
          )}

          {user ? (
            <>
              <Link
                to={user.role === 'instructor' ? '/instructor/dashboard' : '/student/dashboard'}
                onClick={closeMenu}
              >
                <Button variant="primary" size="sm" className="w-full flex items-center gap-2 justify-center">
                  <LayoutDashboard size={18} />
                  Dashboard
                </Button>
              </Link>

              {user.role === 'student' && (
                <Link
                  to="/student/payments"
                  onClick={closeMenu}
                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors text-gray-700"
                >
                  <CreditCard size={20} />
                  <span className="text-sm font-medium">Payment History</span>
                </Link>
              )}

              <Link
                to="/profile"
                onClick={closeMenu}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors text-gray-700"
              >
                <User size={20} />
                <span className="text-sm font-medium">Profile</span>
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors text-gray-700 w-full text-left"
              >
                <LogOut size={20} />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <Link to="/login" onClick={closeMenu}>
                <Button variant="outline" size="sm" className="w-full justify-center">Login</Button>
              </Link>
              <Link to="/register" onClick={closeMenu}>
                <Button variant="primary" size="sm" className="w-full justify-center">Sign Up</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
