import { Link } from 'react-router-dom';
import { Clock, Users, BookOpen } from 'lucide-react';
import { Course } from '../types';
import { Card } from './ui/Card';

interface CourseCardProps {
  course: Course;
  showInstructor?: boolean;
}

export const CourseCard = ({ course, showInstructor = true }: CourseCardProps) => {
  const instructorName = typeof course.instructor === 'object' ? course.instructor.name : 'Instructor';
  const enrolledCount = Array.isArray(course.enrolledStudents)
    ? course.enrolledStudents.length
    : (course.enrolledStudents || 0);
  const estimatedHours = course.estimatedHours ?? 1;
  const level = course.level ? course.level.charAt(0).toUpperCase() + course.level.slice(1) : 'Beginner';
  const isPaidCourse = Boolean(course.isPaid || course.price > 0);

  return (
    <Link to={`/courses/${course._id}`}>
      <Card hover className="h-full">
        <div className="aspect-video bg-gradient-to-br from-blue-500 to-blue-700 relative overflow-hidden">
          <div className="flex items-center justify-center h-full">
            <BookOpen className="text-white" size={64} />
          </div>
          {isPaidCourse && (
            <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
              ₹{course.price}
            </div>
          )}
          {!isPaidCourse && (
            <div className="absolute top-3 right-3 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
              FREE
            </div>
          )}
        </div>
        <div className="p-5">
          <div className="mb-2">
            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-medium">
              {course.category}
            </span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
            {course.title}
          </h3>
          {showInstructor && (
            <p className="text-sm text-gray-600 mb-3">{instructorName}</p>
          )}
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {course.description}
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Clock size={16} />
              <span>
                Self-paced • {estimatedHours}h
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Users size={16} />
              <span>
                {course.maxStudents > 0 ? `${enrolledCount}/${course.maxStudents}` : `${enrolledCount} enrolled`}
              </span>
            </div>
            <span className="inline-block bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
              {level}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
};
