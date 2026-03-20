import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Circle, PlayCircle, ChevronLeft } from 'lucide-react';
import { courseService } from '../services/courseService';
import { lectureService } from '../services/lectureService';
import { progressService } from '../services/progressService';
import { Course, Lecture, Progress } from '../types';
import { Button } from '../components/ui/Button';
import { VideoPlayer } from '../components/VideoPlayer';

export const CoursePlayer = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [currentLecture, setCurrentLecture] = useState<Lecture | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);

  const getCompletedLectureIds = (courseProgress: Progress | null) =>
    (courseProgress?.completedLectures ?? []).map((lecture) =>
      typeof lecture === 'string' ? lecture : lecture._id
    );

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      const [courseData, lecturesData] = await Promise.all([
        courseService.getCourseById(courseId!),
        lectureService.getLectures(courseId!),
      ]);

      setCourse(courseData);
      setLectures(lecturesData ?? []);

      // Fetch progress separately so a failure doesn't block the page
      let progressData: Progress | null = null;
      try {
        progressData = await progressService.getCourseProgress(courseId!);
      } catch {
        console.warn('No progress data found yet — starting fresh');
      }
      setProgress(progressData);

      if (lecturesData?.length > 0) {
        const completedIds = getCompletedLectureIds(progressData);
        const nextIncomplete = lecturesData.find(
          (l) => !completedIds.includes(l._id)
        );
        const firstLecture = nextIncomplete || lecturesData[0];
        setCurrentLecture(firstLecture);
      }
    } catch (error) {
      console.error('Failed to fetch course data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch the full lecture (with videoUrl) whenever the selected lecture changes
  useEffect(() => {
    if (!courseId || !currentLecture) return;

    let cancelled = false;
    const fetchVideo = async () => {
      setVideoLoading(true);
      setVideoUrl(null);
      try {
        const fullLecture = await lectureService.getLectureById(courseId, currentLecture._id);
        if (!cancelled) {
          setVideoUrl(fullLecture.videoUrl || null);
        }
      } catch (error) {
        console.error('Failed to fetch lecture video:', error);
      } finally {
        if (!cancelled) setVideoLoading(false);
      }
    };

    // If the lecture object already has a valid Cloudinary/http videoUrl, use it directly
    if (currentLecture.videoUrl?.startsWith('http')) {
      setVideoUrl(currentLecture.videoUrl);
      setVideoLoading(false);
    } else {
      fetchVideo();
    }

    return () => { cancelled = true; };
  }, [courseId, currentLecture?._id]);

  const handleMarkComplete = async () => {
    if (!currentLecture) return;

    try {
      const isCompleted = isLectureCompleted(currentLecture._id);

      if (isCompleted) {
        const updatedProgress = await progressService.markLectureIncomplete(
          courseId!,
          currentLecture._id
        );
        setProgress(updatedProgress);
      } else {
        const updatedProgress = await progressService.markLectureCompleted(
          courseId!,
          currentLecture._id
        );
        setProgress(updatedProgress);

        const currentIndex = lectures.findIndex((l) => l._id === currentLecture._id);
        if (currentIndex < lectures.length - 1) {
          setCurrentLecture(lectures[currentIndex + 1]);
        }
      }
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const isLectureCompleted = (lectureId: string) => {
    return getCompletedLectureIds(progress).includes(lectureId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!course || !currentLecture) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-600">Course not found</p>
      </div>
    );
  }

  const currentIndex = lectures.findIndex((l) => l._id === currentLecture._id);
  const hasNext = currentIndex < lectures.length - 1;

  const handleNext = () => {
    if (hasNext) setCurrentLecture(lectures[currentIndex + 1]);
  };

  const handleVideoEnded = async () => {
    // Auto-mark as complete when video finishes
    if (!isLectureCompleted(currentLecture._id)) {
      try {
        const updatedProgress = await progressService.markLectureCompleted(
          courseId!,
          currentLecture._id
        );
        setProgress(updatedProgress);
      } catch (error) {
        console.error('Failed to auto-mark complete:', error);
      }
    }
    // Auto-advance to next lecture
    if (hasNext) {
      setTimeout(() => handleNext(), 1500);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Top Bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center gap-4">
        <button
          onClick={() => navigate(`/courses/${courseId}`)}
          className="text-gray-300 hover:text-white transition-colors flex items-center gap-1"
        >
          <ChevronLeft size={20} />
          <span className="text-sm">Back</span>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-white font-semibold truncate">{course.title}</h1>
        </div>
        {progress && (
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-32 bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress.completionPercentage}%` }}
              />
            </div>
            <span className="text-gray-300 text-xs font-medium whitespace-nowrap">
              {progress.completionPercentage}%
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-57px)]">
        {/* Video & Info */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Video Player */}
          <div className="w-full bg-black">
            {videoLoading ? (
              <div className="aspect-video flex flex-col items-center justify-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4" />
                <p className="text-gray-400 text-sm">Loading video...</p>
              </div>
            ) : videoUrl ? (
              <VideoPlayer
                key={currentLecture._id}
                src={videoUrl}
                title={`${currentIndex + 1}. ${currentLecture.title}`}
                autoPlay
                onEnded={handleVideoEnded}
                hasNext={hasNext}
                onNext={handleNext}
              />
            ) : (
              <div className="aspect-video flex flex-col items-center justify-center text-white">
                <PlayCircle size={64} className="mb-4 opacity-50" />
                <p className="text-gray-400">Video not available</p>
              </div>
            )}
          </div>

          {/* Lecture Info */}
          <div className="p-6 bg-gray-800 border-t border-gray-700">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-white mb-1">
                  {currentIndex + 1}. {currentLecture.title}
                </h2>
                {currentLecture.description && (
                  <p className="text-gray-400 text-sm">{currentLecture.description}</p>
                )}
              </div>
              <Button
                onClick={handleMarkComplete}
                variant={isLectureCompleted(currentLecture._id) ? 'outline' : 'primary'}
                size="sm"
                className="flex-shrink-0"
              >
                {isLectureCompleted(currentLecture._id) ? (
                  <span className="flex items-center gap-2">
                    <CheckCircle size={16} /> Completed
                  </span>
                ) : (
                  'Mark Complete'
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar – Lecture List */}
        <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 bg-gray-800 border-l border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h3 className="font-bold text-white text-sm">Course Content</h3>
            <p className="text-xs text-gray-400 mt-1">
              {progress?.completedLectures?.length ?? 0} / {lectures.length} completed
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {lectures.map((lecture, index) => {
              const completed = isLectureCompleted(lecture._id);
              const isCurrent = currentLecture._id === lecture._id;

              return (
                <button
                  key={lecture._id}
                  onClick={() => setCurrentLecture(lecture)}
                  className={`w-full px-4 py-3 flex items-center gap-3 transition-colors border-b border-gray-700/50 ${
                    isCurrent
                      ? 'bg-blue-600/20 border-l-2 border-l-blue-500'
                      : 'hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {completed ? (
                      <CheckCircle className="text-green-500" size={18} />
                    ) : isCurrent ? (
                      <PlayCircle className="text-blue-400" size={18} />
                    ) : (
                      <Circle className="text-gray-500" size={18} />
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p
                      className={`text-sm truncate ${
                        isCurrent
                          ? 'text-blue-400 font-medium'
                          : completed
                          ? 'text-gray-400'
                          : 'text-gray-200'
                      }`}
                    >
                      {index + 1}. {lecture.title}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
