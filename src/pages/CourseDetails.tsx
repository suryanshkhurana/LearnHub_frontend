import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Clock, Users, BookOpen, PlayCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { courseService } from '../services/courseService';
import { lectureService } from '../services/lectureService';
import { paymentService } from '../services/paymentService';
import { Course, InstructorPublicOverview, Lecture } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { VideoPlayer } from '../components/VideoPlayer';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const extractPaymentErrorMessage = (error: unknown) => {
  const fallback = 'Failed to enroll in course';
  if (!error || typeof error !== 'object') return fallback;
  const maybeAxiosError = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return maybeAxiosError.response?.data?.message || maybeAxiosError.message || fallback;
};

export const CourseDetails = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isInstructorUser = user?.role === 'instructor';
  const isStudentUser = user?.role === 'student';
  const [course, setCourse] = useState<Course | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [showInstructorModal, setShowInstructorModal] = useState(false);
  const [instructorOverview, setInstructorOverview] = useState<InstructorPublicOverview | null>(null);
  const [instructorOverviewLoading, setInstructorOverviewLoading] = useState(false);
  const [instructorOverviewError, setInstructorOverviewError] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState<Lecture | null>(null);

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId, user?._id]);

  const getPreviewLectures = (courseData: Course): Lecture[] => {
    const sourceLectures = courseData.lectures ?? [];
    return sourceLectures.filter((lecture) => lecture.isPreview);
  };

  const isCourseInstructor = (courseData: Course): boolean => {
    if (!user) return false;
    if (typeof courseData.instructor === 'string') return courseData.instructor === user._id;
    return courseData.instructor._id === user._id;
  };

  const fetchCourseDetails = async () => {
    try {
      const courseData = await courseService.getCourseById(courseId!);
      setCourse(courseData);

      if (!user) {
        setLectures(getPreviewLectures(courseData));
        return;
      }

      const instructorAccess = isCourseInstructor(courseData);
      let enrolledAccess = false;

      try {
        const enrolledCourses = await courseService.getEnrolledCourses();
        enrolledAccess = enrolledCourses.some((c) => c._id === courseId);
        setIsEnrolled(enrolledAccess);
      } catch {
        enrolledAccess = false;
      }

      if (enrolledAccess || instructorAccess) {
        try {
          const lecturesData = await lectureService.getLectures(courseId!);
          setLectures(lecturesData ?? []);
        } catch {
          setLectures(getPreviewLectures(courseData));
        }
      } else {
        setLectures(getPreviewLectures(courseData));
      }
    } catch (error) {
      console.error('Failed to fetch course details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (course && isCourseInstructor(course)) {
      navigate(`/instructor/courses/${course._id}/edit`);
      return;
    }

    setEnrolling(true);
    try {
      if (course?.isPaid) {
        if (!window.Razorpay) {
          alert('Payment gateway failed to load. Please refresh the page and try again.');
          return;
        }

        const { order, key } = await paymentService.createOrder(courseId!);

        if (!key) {
          const fallbackKey = await paymentService.getRazorpayKey().catch(() => '');
          if (!fallbackKey) {
            alert('Payment gateway is unavailable right now. Please try again in a moment.');
            return;
          }
        }

        const checkoutKey = key || (await paymentService.getRazorpayKey());

        const options = {
          key: checkoutKey,
          amount: order.amount,
          currency: order.currency,
          order_id: order.id,
          name: 'LearnHub',
          description: course.title,
          prefill: {
            name: user.name,
            email: user.email,
          },
          theme: {
            color: '#2563eb',
          },
          handler: async (response: any) => {
            try {
              await paymentService.verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              setIsEnrolled(true);
              navigate(`/courses/${courseId}/learn`);
            } catch (error) {
              console.error('Payment verification failed:', error);
              alert('Payment verification failed. Please contact support.');
            }
          },
          modal: {
            ondismiss: () => {
              paymentService
                .markPaymentFailed({
                  razorpay_order_id: order.id,
                  reason: 'Checkout closed by user',
                })
                .catch((error) => {
                  console.error('Failed to mark dismissed payment:', error);
                });
            },
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.on('payment.failed', (response: any) => {
          const paymentError = response?.error?.description || 'Payment failed during checkout';
          paymentService
            .markPaymentFailed({
              razorpay_order_id: order.id,
              reason: paymentError,
            })
            .catch((error) => {
              console.error('Failed to mark payment as failed:', error);
            });
          alert(paymentError);
        });
        razorpay.open();
      } else {
        await courseService.enrollInFreeCourse(courseId!);
        setIsEnrolled(true);
        navigate(`/courses/${courseId}/learn`);
      }
    } catch (error: unknown) {
      console.error('Enrollment failed:', error);
      alert(extractPaymentErrorMessage(error));
    } finally {
      setEnrolling(false);
    }
  };

  const handleWithdraw = async () => {
    if (!courseId) return;
    if (!confirm('Are you sure you want to withdraw from this course? This action cannot be undone.')) return;
    try {
      setWithdrawing(true);
      await courseService.withdrawFromCourse(courseId);
      setIsEnrolled(false);
      alert('Successfully withdrawn from the course.');
    } catch (error: any) {
      console.error('Withdraw failed:', error);
      alert(error.response?.data?.message || 'Failed to withdraw from course');
    } finally {
      setWithdrawing(false);
    }
  };

  const resolveInstructorId = () => {
    if (!course) return '';
    return typeof course.instructor === 'string' ? course.instructor : course.instructor._id;
  };

  const handleOpenInstructorOverview = async () => {
    const instructorId = resolveInstructorId();
    if (!instructorId) return;

    setShowInstructorModal(true);
    setInstructorOverviewLoading(true);
    setInstructorOverviewError('');

    try {
      const data = await courseService.getInstructorOverview(instructorId);
      setInstructorOverview(data);
    } catch (error: any) {
      setInstructorOverview(null);
      setInstructorOverviewError(error?.response?.data?.message || 'Failed to fetch instructor details');
    } finally {
      setInstructorOverviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-600">Course not found</p>
      </div>
    );
  }

  const instructorName = typeof course.instructor === 'object' ? course.instructor.name : 'Instructor';
  const enrolledCount = Array.isArray(course.enrolledStudents)
    ? course.enrolledStudents.length
    : (course.enrolledStudents || 0);
  const totalLectureCount = course.lectureCount ?? lectures.length;
  const levelLabel = course.level
    ? course.level.charAt(0).toUpperCase() + course.level.slice(1)
    : 'Beginner';
  const estimatedHours = course.estimatedHours ?? 1;
  const seatLimitReached = course.maxStudents > 0 && enrolledCount >= course.maxStudents;
  const isInstructorView = isCourseInstructor(course);
  const shouldPromptEnrollForLectures =
    user?.role === 'student' &&
    !isEnrolled &&
    !isInstructorView &&
    totalLectureCount > 0 &&
    lectures.length === 0;

  const openPreview = (lecture: Lecture) => {
    if (!lecture.videoUrl) return;
    setSelectedPreview(lecture);
    setShowPreviewModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="mb-4">
                <span className="inline-block bg-blue-500 px-3 py-1 rounded-full text-sm font-medium">
                  {course.category}
                </span>
              </div>
              <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
              <p className="text-xl text-blue-100 mb-6">{course.description}</p>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Clock size={20} />
                  <span>Self-paced • {estimatedHours} hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={20} />
                  <span>
                    {course.maxStudents > 0
                      ? `${enrolledCount}/${course.maxStudents} students`
                      : `${enrolledCount} enrolled`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen size={20} />
                  <span>{totalLectureCount} lectures</span>
                </div>
              </div>
            </div>

            <div>
              <Card>
                <div className="p-6">
                  <div className="mb-6">
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      {course.isPaid ? `₹${course.price}` : 'FREE'}
                    </div>
                    <p className="text-gray-600 text-sm">Instructor: {instructorName}</p>
                  </div>

                  {isStudentUser && (
                    <Button
                      variant="outline"
                      onClick={handleOpenInstructorOverview}
                      className="w-full mb-3"
                    >
                      More from {instructorName}
                    </Button>
                  )}

                  {authLoading ? (
                    <Button className="w-full" disabled>
                      Loading...
                    </Button>
                  ) : isInstructorView ? (
                    <Button
                      onClick={() => navigate(`/instructor/courses/${courseId}/edit`)}
                      className="w-full"
                    >
                      Manage Course
                    </Button>
                  ) : isInstructorUser ? (
                    <Button
                      onClick={() => navigate('/instructor/dashboard')}
                      className="w-full"
                    >
                      Instructor accounts cannot enroll
                    </Button>
                  ) : isEnrolled ? (
                    <div className="space-y-2">
                      <Button
                        onClick={() => navigate(`/courses/${courseId}/learn`)}
                        className="w-full"
                      >
                        Continue Learning
                      </Button>
                      {!(course.isPaid && course.price > 0) && (
                        <Button
                          variant="danger"
                          onClick={handleWithdraw}
                          isLoading={withdrawing}
                          className="w-full"
                        >
                          Withdraw from Course
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button
                      onClick={handleEnroll}
                      isLoading={enrolling}
                      className="w-full"
                      disabled={seatLimitReached}
                    >
                      {seatLimitReached
                        ? 'Course Full'
                        : course.isPaid
                        ? 'Enroll Now'
                        : 'Enroll for Free'}
                    </Button>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Course Content</h2>
            <div className="space-y-3">
              {lectures.length === 0 ? (
                <Card>
                  <div className="p-6 text-center text-gray-600">
                    {shouldPromptEnrollForLectures ? (
                      'Enroll now to view lectures'
                    ) : user ? (
                      'No lectures available yet'
                    ) : (
                      <>
                        <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                          Signup
                        </Link>
                        <span> / </span>
                        <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                          Login
                        </Link>
                        <span> to view lectures</span>
                      </>
                    )}
                  </div>
                </Card>
              ) : (
                lectures.map((lecture, index) => (
                  <Card key={lecture._id} hover>
                    <div className="p-4 flex items-center gap-4">
                      <div className="bg-blue-100 p-3 rounded-full">
                        <PlayCircle className="text-blue-600" size={24} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {index + 1}. {lecture.title}
                        </h3>
                        {lecture.description && (
                          <p className="text-sm text-gray-600 mt-1">{lecture.description}</p>
                        )}
                      </div>
                      {lecture.videoUrl && (
                        <div className="flex items-center gap-2">
                          {lecture.isPreview && (
                            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                              Preview
                            </span>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openPreview(lecture)}
                          >
                            Watch
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          <div>
            <Card>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">About this course</h3>
                <div className="space-y-4 text-gray-600">
                  <div>
                    <p className="font-medium text-gray-900 mb-1">Learning Format</p>
                    <p>Self-paced</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 mb-1">Estimated Duration</p>
                    <p>{estimatedHours} hours</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 mb-1">Level</p>
                    <p>{levelLabel}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 mb-1">Language</p>
                    <p>{course.language || 'English'}</p>
                  </div>
                  {course.weeklyEffortHours ? (
                    <div>
                      <p className="font-medium text-gray-900 mb-1">Suggested Weekly Effort</p>
                      <p>{course.weeklyEffortHours} hours/week</p>
                    </div>
                  ) : null}
                  <div>
                    <p className="font-medium text-gray-900 mb-1">Course Content</p>
                    <p>{totalLectureCount} lectures</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 mb-1">Enrollment</p>
                    <p>
                      {course.maxStudents > 0
                        ? `${enrolledCount} of ${course.maxStudents} students`
                        : `${enrolledCount} students enrolled`}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setSelectedPreview(null);
        }}
        title={selectedPreview ? `Preview: ${selectedPreview.title}` : 'Lecture Preview'}
        size="xl"
      >
        {selectedPreview?.videoUrl ? (
          <VideoPlayer
            src={selectedPreview.videoUrl}
            title={selectedPreview.title}
            autoPlay
          />
        ) : (
          <p className="text-gray-600">Preview video is unavailable for this lecture.</p>
        )}
      </Modal>

      <Modal
        isOpen={showInstructorModal}
        onClose={() => setShowInstructorModal(false)}
        title={instructorOverview ? `More from ${instructorOverview.instructor.name}` : `More from ${instructorName}`}
        size="lg"
      >
        {instructorOverviewLoading ? (
          <div className="py-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : instructorOverviewError ? (
          <div className="text-center text-red-600">{instructorOverviewError}</div>
        ) : instructorOverview ? (
          <div className="space-y-6">
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center gap-4">
                {instructorOverview.instructor.avatar ? (
                  <img
                    src={instructorOverview.instructor.avatar}
                    alt={instructorOverview.instructor.name}
                    className="h-12 w-12 rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-lg font-semibold">
                    {instructorOverview.instructor.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">{instructorOverview.instructor.name}</p>
                  <p className="text-sm text-gray-600">{instructorOverview.instructor.email}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {instructorOverview.totalCourses} published courses • {instructorOverview.totalStudents} total enrollments
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Offered Courses</h3>
              {instructorOverview.courses.length === 0 ? (
                <p className="text-sm text-gray-600">No published courses available yet.</p>
              ) : (
                <div className="space-y-3">
                  {instructorOverview.courses.map((offeredCourse) => (
                    <Link
                      key={offeredCourse._id}
                      to={`/courses/${offeredCourse._id}`}
                      className="block border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowInstructorModal(false)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-gray-900">{offeredCourse.title}</p>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{offeredCourse.description}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {offeredCourse.category} • {offeredCourse.enrolledCount} enrolled
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                          {offeredCourse.isPaid ? `₹${offeredCourse.price}` : 'FREE'}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-600">No instructor details available.</div>
        )}
      </Modal>
    </div>
  );
};
