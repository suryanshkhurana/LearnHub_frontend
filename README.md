# LearnHub - Course Registration Platform

A full-featured course registration and learning management platform built with React, TypeScript, and Tailwind CSS.

## Features

### For Students
- Browse and search courses with filters
- Enroll in free and paid courses
- Razorpay payment integration for paid courses
- Watch course lectures with video player
- Track learning progress
- Mark lectures as complete/incomplete
- View dashboard with enrollment statistics
- Manage profile and change password

### For Instructors
- Create and manage courses
- Upload course thumbnails
- Set course pricing (free or paid)
- Publish/unpublish courses
- Add and manage lectures
- Upload lecture videos
- Set lecture previews
- View instructor dashboard with statistics
- Track total students and revenue

### General Features
- Role-based authentication (Student/Instructor)
- Protected routes based on user roles
- JWT token-based authentication with auto-refresh
- Responsive design for mobile and desktop
- Modern UI with Tailwind CSS
- Form validation and error handling

## Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios with interceptors
- **Icons**: Lucide React
- **Payment**: Razorpay integration
- **Build Tool**: Vite

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (Button, Input, Card, Modal)
│   ├── CourseCard.tsx  # Course display card
│   ├── Navbar.tsx      # Navigation bar
│   └── ProtectedRoute.tsx  # Route protection
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication context
├── pages/              # Page components
│   ├── Home.tsx
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── CourseCatalog.tsx
│   ├── CourseDetails.tsx
│   ├── CoursePlayer.tsx
│   ├── StudentDashboard.tsx
│   ├── InstructorDashboard.tsx
│   ├── CourseForm.tsx
│   └── Profile.tsx
├── services/           # API service layer
│   ├── api.ts          # Axios instance with interceptors
│   ├── authService.ts
│   ├── courseService.ts
│   ├── lectureService.ts
│   ├── paymentService.ts
│   ├── progressService.ts
│   └── dashboardService.ts
├── types/              # TypeScript type definitions
│   └── index.ts
├── App.tsx             # Main app with routing
└── main.tsx           # App entry point
```

## Getting Started

### Prerequisites

- Node.js 16+ installed
- Backend API running on `http://localhost:8081`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
Create a `.env` file in the root directory:
```
VITE_API_BASE_URL=http://localhost:8081/api/v1
```

3. Start the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## API Endpoints

The application connects to the following API endpoints:

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/current-user` - Get current user
- `POST /auth/refresh-token` - Refresh access token
- `PATCH /auth/change-password` - Change password
- `PATCH /auth/update-profile` - Update profile
- `POST /auth/logout` - Logout user

### Courses
- `GET /courses/published` - Get all published courses
- `GET /courses/:id` - Get course by ID
- `POST /courses` - Create course (instructor)
- `PATCH /courses/:id` - Update course (instructor)
- `PATCH /courses/:id/thumbnail` - Upload thumbnail (instructor)
- `DELETE /courses/:id` - Delete course (instructor)
- `GET /courses/instructor/my-courses` - Get instructor courses
- `POST /courses/:id/enroll` - Enroll in free course
- `GET /courses/student/enrolled` - Get enrolled courses
- `POST /courses/:id/withdraw` - Withdraw from course

### Lectures
- `GET /courses/:courseId/lectures` - Get all lectures
- `POST /courses/:courseId/lectures` - Create lecture (instructor)
- `GET /courses/:courseId/lectures/:id` - Get lecture by ID
- `PATCH /courses/:courseId/lectures/:id` - Update lecture (instructor)
- `DELETE /courses/:courseId/lectures/:id` - Delete lecture (instructor)

### Payments
- `GET /payments/key` - Get Razorpay key
- `POST /payments/order/:courseId` - Create payment order
- `POST /payments/verify` - Verify payment
- `GET /payments/my-payments` - Get payment history

### Progress
- `GET /progress` - Get all progress
- `GET /progress/:courseId` - Get course progress
- `POST /progress/:courseId/lectures/:lectureId/complete` - Mark complete
- `POST /progress/:courseId/lectures/:lectureId/incomplete` - Mark incomplete

### Dashboard
- `GET /dashboard/student` - Student dashboard stats
- `GET /dashboard/instructor` - Instructor dashboard stats

## Key Features Implementation

### Authentication
- JWT token stored in localStorage
- Automatic token refresh on 401 errors
- Role-based route protection
- Persistent login state

### Course Management
- Instructors can create, edit, and delete courses
- Support for free and paid courses
- Course thumbnail uploads
- Lecture video uploads
- Course status (draft/published)

### Payment Integration
- Razorpay checkout for paid courses
- Server-side payment verification
- Automatic enrollment after successful payment

### Progress Tracking
- Track completed lectures per course
- Calculate completion percentage
- Visual progress bars
- Continue learning from last position

### User Experience
- Responsive design for all screen sizes
- Loading states for async operations
- Error handling and user feedback
- Clean and modern UI design

## Usage

### As a Student
1. Register with role "Student"
2. Browse courses in the catalog
3. Click on a course to view details
4. Enroll in free courses or pay for paid courses
5. Watch lectures and mark them complete
6. Track progress in your dashboard

### As an Instructor
1. Register with role "Instructor"
2. Create a new course from the dashboard
3. Add course details and upload thumbnail
4. Add lectures with video uploads
5. Publish the course when ready
6. Monitor enrollments and revenue

## Environment Variables

- `VITE_API_BASE_URL` - Backend API base URL (default: http://localhost:8081/api/v1)

## License

This project is part of a course registration system.
