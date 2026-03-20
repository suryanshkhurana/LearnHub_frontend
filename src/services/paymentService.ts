import api from './api';
import { InstructorPaymentsResponse, Payment } from '../types';

export const paymentService = {
  getRazorpayKey: async (): Promise<string> => {
    const response = await api.get('/payments/key');
    return response.data.key;
  },

  createOrder: async (courseId: string): Promise<{
    order: {
      id: string;
      amount: number;
      currency: string;
    };
    key: string;
  }> => {
    const response = await api.post(`/payments/order/${courseId}`);
    return response.data;
  },

  verifyPayment: async (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<void> => {
    await api.post('/payments/verify', data);
  },

  markPaymentFailed: async (data: {
    razorpay_order_id: string;
    reason?: string;
  }): Promise<void> => {
    await api.post('/payments/failure', data);
  },

  getMyPayments: async (): Promise<Payment[]> => {
    const response = await api.get('/payments/my-payments');
    return response.data.payments;
  },

  getInstructorPayments: async (): Promise<InstructorPaymentsResponse> => {
    const response = await api.get('/payments/instructor-payments');
    return {
      payments: response.data.payments ?? [],
      overview: {
        paidTransactions: response.data.overview?.paidTransactions ?? 0,
        totalRevenue: response.data.overview?.totalRevenue ?? 0,
        uniqueStudents: response.data.overview?.uniqueStudents ?? 0,
      },
    };
  },
};
