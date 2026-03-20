import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { CourseCatalog } from './pages/CourseCatalog';
import { CourseDetails } from './pages/CourseDetails';
import { CoursePlayer } from './pages/CoursePlayer';
import { StudentDashboard } from './pages/StudentDashboard';
import { InstructorDashboard } from './pages/InstructorDashboard';
import { CourseForm } from './pages/CourseForm';
import { Profile } from './pages/Profile';
import { PaymentHistory } from './pages/PaymentHistory';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/courses" element={<CourseCatalog />} />
            <Route path="/courses/:courseId" element={<CourseDetails />} />

            <Route
              path="/courses/:courseId/learn"
              element={
                <ProtectedRoute requireRole="student">
                  <CoursePlayer />
                </ProtectedRoute>
              }
            />

            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute requireRole="student">
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/student/payments"
              element={
                <ProtectedRoute requireRole="student">
                  <PaymentHistory />
                </ProtectedRoute>
              }
            />

            <Route
              path="/instructor/payments"
              element={
                <ProtectedRoute requireRole="instructor">
                  <PaymentHistory />
                </ProtectedRoute>
              }
            />

            <Route
              path="/instructor/dashboard"
              element={
                <ProtectedRoute requireRole="instructor">
                  <InstructorDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/instructor/courses/new"
              element={
                <ProtectedRoute requireRole="instructor">
                  <CourseForm />
                </ProtectedRoute>
              }
            />

            <Route
              path="/instructor/courses/:courseId/edit"
              element={
                <ProtectedRoute requireRole="instructor">
                  <CourseForm />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
