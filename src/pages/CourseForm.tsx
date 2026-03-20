import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseService } from '../services/courseService';
import { lectureService } from '../services/lectureService';
import { Course, CourseStudentProgress, Lecture } from '../types';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Trash2, Plus, ChevronUp, ChevronDown, Edit2, PlayCircle } from 'lucide-react';
import { Modal } from '../components/ui/Modal';

export const CourseForm = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(courseId);
  const [savedCourseId, setSavedCourseId] = useState<string | undefined>(courseId);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    estimatedHours: 4,
    level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    language: 'English',
    weeklyEffortHours: 0,
    maxStudents: 0,
    price: 0,
    isPaid: false,
    status: 'draft' as 'draft' | 'published',
  });

  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<CourseStudentProgress[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showLectureModal, setShowLectureModal] = useState(false);
  const [showEditLectureModal, setShowEditLectureModal] = useState(false);
  const [editingLecture, setEditingLecture] = useState<Lecture | null>(null);
  const [editLectureForm, setEditLectureForm] = useState({
    title: '',
    description: '',
    isPreview: false,
  });
  const [lectureForm, setLectureForm] = useState({
    title: '',
    description: '',
    video: null as File | null,
    order: 1,
    isPreview: false,
  });

  useEffect(() => {
    if (isEditing) {
      fetchCourse();
    }
  }, [courseId]);

  const formatActivityDate = (date?: string | null) => {
    if (!date) return 'No activity yet';
    return new Date(date).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const fetchCourse = async (id?: string) => {
    const cid = id || savedCourseId;
    if (!cid) return;

    setStudentsLoading(true);
    try {
      const [courseData, lecturesData, studentsData] = await Promise.all([
        courseService.getCourseById(cid),
        lectureService.getLectures(cid),
        courseService.getCourseStudents(cid),
      ]);

      setFormData({
        title: courseData.title,
        description: courseData.description,
        category: courseData.category,
        estimatedHours: courseData.estimatedHours ?? 4,
        level: courseData.level ?? 'beginner',
        language: courseData.language ?? 'English',
        weeklyEffortHours: courseData.weeklyEffortHours ?? 0,
        maxStudents: courseData.maxStudents,
        price: courseData.price,
        isPaid: courseData.isPaid,
        status: courseData.status === 'archived' ? 'draft' : courseData.status,
      });
      setLectures(lecturesData);
      setEnrolledStudents(studentsData.students ?? []);
    } catch (error) {
      console.error('Failed to fetch course:', error);
      setEnrolledStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let savedCourse: Course;

      if (isEditing) {
        savedCourse = await courseService.updateCourse(savedCourseId!, formData);
      } else {
        savedCourse = await courseService.createCourse(formData);
        setSavedCourseId(savedCourse._id);
      }

      if (!isEditing) {
        // Redirect to edit page so lectures can be added with a real ID
        navigate(`/instructor/courses/${savedCourse._id}/edit`, { replace: true });
        return;
      }

      navigate('/instructor/dashboard');
    } catch (error: any) {
      console.error('Failed to save course:', error);
      alert(error.response?.data?.message || 'Failed to save course');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLecture = async () => {
    if (!lectureForm.video) {
      alert('Please select a video file');
      return;
    }

    try {
      await lectureService.createLecture(savedCourseId!, {
        title: lectureForm.title,
        description: lectureForm.description,
        order: lectureForm.order,
        isPreview: lectureForm.isPreview,
        video: lectureForm.video,
      });

      setShowLectureModal(false);
      setLectureForm({
        title: '',
        description: '',
        video: null,
        order: lectures.length + 1,
        isPreview: false,
      });
      fetchCourse();
    } catch (error: any) {
      console.error('Failed to add lecture:', error);
      alert(error.response?.data?.message || 'Failed to add lecture');
    }
  };

  const handleDeleteLecture = async (lectureId: string) => {
    if (!confirm('Are you sure you want to delete this lecture?')) return;

    try {
      await lectureService.deleteLecture(savedCourseId!, lectureId);
      fetchCourse();
    } catch (error) {
      console.error('Failed to delete lecture:', error);
    }
  };

  const handleDeleteCourse = async () => {
    if (!confirm('Are you sure you want to delete this entire course? This action cannot be undone.')) return;

    setDeleteLoading(true);
    try {
      await courseService.deleteCourse(savedCourseId!);
      navigate('/instructor/dashboard');
    } catch (error: any) {
      console.error('Failed to delete course:', error);
      alert(error.response?.data?.message || 'Failed to delete course');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEditLecture = (lecture: Lecture) => {
    setEditingLecture(lecture);
    setEditLectureForm({
      title: lecture.title,
      description: lecture.description || '',
      isPreview: lecture.isPreview,
    });
    setShowEditLectureModal(true);
  };

  const handleSaveEditLecture = async () => {
    if (!editingLecture) return;
    try {
      await lectureService.updateLecture(savedCourseId!, editingLecture._id, editLectureForm);
      setShowEditLectureModal(false);
      setEditingLecture(null);
      fetchCourse();
    } catch (error: any) {
      console.error('Failed to update lecture:', error);
      alert(error.response?.data?.message || 'Failed to update lecture');
    }
  };

  const handleReorderLecture = async (lectureId: string, direction: 'up' | 'down') => {
    const index = lectures.findIndex((l) => l._id === lectureId);
    if (
      (direction === 'up' && index <= 0) ||
      (direction === 'down' && index >= lectures.length - 1)
    )
      return;

    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    const newOrders = lectures.map((l, i) => {
      if (i === index) return { lectureId: l._id, order: lectures[swapIndex].order };
      if (i === swapIndex) return { lectureId: l._id, order: lectures[index].order };
      return { lectureId: l._id, order: l.order };
    });

    try {
      await lectureService.reorderLectures(savedCourseId!, newOrders);
      fetchCourse();
    } catch (error) {
      console.error('Failed to reorder lectures:', error);
    }
  };

  const handleWatchLecture = (lecture: Lecture) => {
    if (!lecture.videoUrl) {
      alert('Video URL is not available for this lecture yet');
      return;
    }
    window.open(lecture.videoUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            {isEditing ? 'Edit Course' : 'Create New Course'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <div className="p-6 space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Course Details</h2>

              <Input
                label="Course Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  required
                />
              </div>

              <Input
                label="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Frontend, Backend, Mobile"
                required
              />

              <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg px-4 py-3 text-sm">
                This platform uses a self-paced learning model. Students can learn anytime.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Estimated Duration (hours)"
                  type="number"
                  value={formData.estimatedHours}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      estimatedHours: Math.max(1, Number(e.target.value) || 1),
                    })
                  }
                  min="1"
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                  <select
                    value={formData.level}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        level: e.target.value as 'beginner' | 'intermediate' | 'advanced',
                      })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <Input
                  label="Language"
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  required
                />
              </div>

              <Input
                label="Suggested Weekly Effort (hours, optional)"
                type="number"
                value={formData.weeklyEffortHours}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    weeklyEffortHours: Math.max(0, Number(e.target.value) || 0),
                  })
                }
                min="0"
              />

              <Input
                label="Seat Limit (0 for unlimited)"
                type="number"
                value={formData.maxStudents}
                onChange={(e) =>
                  setFormData({ ...formData, maxStudents: Math.max(0, Number(e.target.value) || 0) })
                }
                min="0"
                required
              />

              <div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPaid}
                    onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">This is a paid course</span>
                </label>
              </div>

              {formData.isPaid && (
                <Input
                  label="Price (₹)"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                  min="0"
                  required
                />
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as 'draft' | 'published' })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" isLoading={loading}>
              {isEditing ? 'Update Course' : 'Create Course'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/instructor/dashboard')}>
              Cancel
            </Button>
            {isEditing && (
              <Button
                type="button"
                variant="danger"
                isLoading={deleteLoading}
                onClick={handleDeleteCourse}
              >
                <span className="flex items-center gap-2">
                  <Trash2 size={16} />
                  Delete Course
                </span>
              </Button>
            )}
          </div>
        </form>

        {savedCourseId && (
          <Card className="mt-8">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Lectures</h2>
                <Button onClick={() => setShowLectureModal(true)} className="flex items-center gap-2">
                  <Plus size={20} />
                  Add Lecture
                </Button>
              </div>

              <div className="space-y-3">
                {lectures.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">No lectures yet. Add your first lecture above.</p>
                ) : (
                  lectures.map((lecture, index) => (
                    <div
                      key={lecture._id}
                      className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg"
                    >
                      {/* Reorder Buttons */}
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleReorderLecture(lecture._id, 'up')}
                          disabled={index === 0}
                          className="text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed p-0.5"
                          title="Move up"
                        >
                          <ChevronUp size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReorderLecture(lecture._id, 'down')}
                          disabled={index === lectures.length - 1}
                          className="text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed p-0.5"
                          title="Move down"
                        >
                          <ChevronDown size={16} />
                        </button>
                      </div>

                      {/* Lecture info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {index + 1}. {lecture.title}
                          </h3>
                          {lecture.isPreview && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                              Preview
                            </span>
                          )}
                        </div>
                        {lecture.description && (
                          <p className="text-sm text-gray-600 mt-0.5 truncate">{lecture.description}</p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleWatchLecture(lecture)}
                          title="Watch lecture"
                        >
                          <PlayCircle size={14} />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditLecture(lecture)}
                        >
                          <Edit2 size={14} />
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteLecture(lecture._id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        )}

        {savedCourseId && (
          <Card className="mt-8">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Enrolled Students</h2>
                <span className="text-sm text-gray-600">{enrolledStudents.length} students</span>
              </div>

              {studentsLoading ? (
                <div className="py-8 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : enrolledStudents.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-6">
                  No students enrolled yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {enrolledStudents.map((student) => (
                    <div key={student._id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{student.name}</p>
                          <p className="text-sm text-gray-600 truncate">{student.email}</p>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            student.isCompleted
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {student.isCompleted ? 'Completed' : 'In Progress'}
                        </span>
                      </div>

                      <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
                        <span>{student.completionPercentage}% completed</span>
                        <span>{student.completedLecturesCount} lectures done</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${student.completionPercentage}%` }}
                        />
                      </div>

                      <p className="text-xs text-gray-500">
                        Last activity: {formatActivityDate(student.lastActiveAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      <Modal
        isOpen={showLectureModal}
        onClose={() => setShowLectureModal(false)}
        title="Add Lecture"
      >
        <div className="space-y-4">
          <Input
            label="Lecture Title"
            value={lectureForm.title}
            onChange={(e) => setLectureForm({ ...lectureForm, title: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={lectureForm.description}
              onChange={(e) => setLectureForm({ ...lectureForm, description: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Video File</label>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setLectureForm({ ...lectureForm, video: e.target.files?.[0] || null })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={lectureForm.isPreview}
                onChange={(e) => setLectureForm({ ...lectureForm, isPreview: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">
                Allow free preview
              </span>
            </label>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowLectureModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddLecture}>Add Lecture</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Lecture Modal */}
      <Modal
        isOpen={showEditLectureModal}
        onClose={() => setShowEditLectureModal(false)}
        title="Edit Lecture"
      >
        <div className="space-y-4">
          <Input
            label="Lecture Title"
            value={editLectureForm.title}
            onChange={(e) => setEditLectureForm({ ...editLectureForm, title: e.target.value })}
            placeholder="Enter lecture title"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={editLectureForm.description}
              onChange={(e) => setEditLectureForm({ ...editLectureForm, description: e.target.value })}
              placeholder="Enter lecture description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={editLectureForm.isPreview}
              onChange={(e) => setEditLectureForm({ ...editLectureForm, isPreview: e.target.checked })}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-gray-700">Free Preview</span>
          </label>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => setShowEditLectureModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEditLecture}>Save Changes</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
