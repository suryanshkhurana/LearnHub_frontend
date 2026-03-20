import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Calendar, CheckCircle, XCircle, Clock, IndianRupee, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { paymentService } from '../services/paymentService';
import { Payment } from '../types';
import { Card } from '../components/ui/Card';

export const PaymentHistory = () => {
  const { user } = useAuth();
  const isInstructor = user?.role === 'instructor';
  const [payments, setPayments] = useState<Payment[]>([]);
  const [instructorOverview, setInstructorOverview] = useState({
    paidTransactions: 0,
    totalRevenue: 0,
    uniqueStudents: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        if (isInstructor) {
          const data = await paymentService.getInstructorPayments();
          setPayments(data.payments ?? []);
          setInstructorOverview(data.overview);
        } else {
          const data = await paymentService.getMyPayments();
          setPayments(data ?? []);
        }
      } catch (error) {
        console.error('Failed to fetch payments:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, [isInstructor]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'failed':
        return <XCircle className="text-red-500" size={20} />;
      default:
        return <Clock className="text-yellow-500" size={20} />;
    }
  };

  const getStatusBadge = (status: string) => {
    const classes: Record<string, string> = {
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      created: 'bg-yellow-100 text-yellow-800',
    };
    const labelMap: Record<string, string> = {
      paid: 'Paid',
      failed: 'Failed',
      pending: 'Pending',
      created: 'Created',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${classes[status] || classes.pending}`}>
        {labelMap[status] || status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalSpent = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount / 100, 0);

  const getCourseMeta = (payment: Payment) => {
    if (payment.course && typeof payment.course === 'object') {
      return { id: payment.course._id, title: payment.course.title };
    }
    if (typeof payment.course === 'string') {
      return { id: payment.course, title: 'Course' };
    }
    return { id: '', title: 'Deleted Course' };
  };

  const getStudentMeta = (payment: Payment) => {
    if (payment.user && typeof payment.user === 'object') {
      return {
        name: payment.user.name,
        email: payment.user.email,
      };
    }
    return {
      name: 'Student',
      email: '—',
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            {isInstructor ? 'My Payments' : 'Payment History'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isInstructor
              ? 'Track paid students enrolled in your courses'
              : 'View all your transactions'}
          </p>
        </div>

        {/* Summary Card */}
        {isInstructor ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Paid Transactions</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{instructorOverview.paidTransactions}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <CreditCard className="text-blue-600" size={24} />
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Paid Students</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{instructorOverview.uniqueStudents}</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Users className="text-purple-600" size={24} />
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Revenue</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">₹{(instructorOverview.totalRevenue / 100).toFixed(2)}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <IndianRupee className="text-green-600" size={24} />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Transactions</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{payments.length}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <CreditCard className="text-blue-600" size={24} />
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Spent</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">₹{totalSpent}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <IndianRupee className="text-green-600" size={24} />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Payments List */}
        {payments.length === 0 ? (
          <Card>
            <div className="p-12 text-center">
              <CreditCard className="mx-auto text-gray-400 mb-4" size={64} />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {isInstructor ? 'No paid enrollments yet' : 'No payments yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {isInstructor
                  ? 'Paid student enrollments for your courses will appear here.'
                  : 'Your payment history will appear here when you enroll in paid courses'}
              </p>
              {!isInstructor && (
                <Link
                  to="/courses"
                  className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Browse Courses
                </Link>
              )}
            </div>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Course</th>
                    {isInstructor && (
                      <th className="text-left p-4 text-sm font-semibold text-gray-600">Student</th>
                    )}
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Amount</th>
                    {!isInstructor && (
                      <th className="text-left p-4 text-sm font-semibold text-gray-600">Status</th>
                    )}
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Payment ID</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => {
                    const courseMeta = getCourseMeta(payment);
                    const studentMeta = getStudentMeta(payment);

                    return (
                      <tr
                        key={payment._id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="p-4">
                          {courseMeta.id ? (
                            <Link
                              to={`/courses/${courseMeta.id}`}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              {courseMeta.title}
                            </Link>
                          ) : (
                            <span className="text-gray-600 font-medium">{courseMeta.title}</span>
                          )}
                        </td>
                        {isInstructor && (
                          <td className="p-4">
                            <p className="font-medium text-gray-900">{studentMeta.name}</p>
                            <p className="text-xs text-gray-500">{studentMeta.email}</p>
                          </td>
                        )}
                        <td className="p-4 font-semibold text-gray-900">₹{(payment.amount / 100).toFixed(2)}</td>
                        {!isInstructor && (
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(payment.status)}
                              {getStatusBadge(payment.status)}
                            </div>
                            {payment.status === 'failed' && payment.failureReason && (
                              <p className="text-xs text-red-600 mt-1 max-w-xs truncate" title={payment.failureReason}>
                                {payment.failureReason}
                              </p>
                            )}
                          </td>
                        )}
                        <td className="p-4">
                          <span className="text-sm text-gray-500 font-mono">
                            {payment.razorpayPaymentId || '—'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar size={14} />
                            {formatDate(payment.createdAt)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
