import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipForward,
  RotateCcw,
  RotateCw,
  Settings,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  title?: string;
  autoPlay?: boolean;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  hasNext?: boolean;
  onNext?: () => void;
}

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

const formatTime = (seconds: number): string => {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const VideoPlayer = ({
  src,
  title,
  autoPlay = false,
  onEnded,
  onTimeUpdate,
  hasNext = false,
  onNext,
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [showOverlayIcon, setShowOverlayIcon] = useState<'play' | 'pause' | null>(null);

  // Reset state when source changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setBuffered(0);
    setIsLoading(true);
    setHasError(false);
    setShowSpeedMenu(false);
    setShowOverlayIcon(null);
  }, [src]);

  // Auto-hide controls
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (isPlaying) {
      hideTimerRef.current = setTimeout(() => {
        setShowControls(false);
        setShowSpeedMenu(false);
      }, 3000);
    }
  }, [isPlaying]);

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [isPlaying, resetHideTimer]);

  // Fullscreen change listener
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const video = videoRef.current;
      if (!video) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowleft':
        case 'j':
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 10);
          break;
        case 'arrowright':
        case 'l':
          e.preventDefault();
          video.currentTime = Math.min(video.duration, video.currentTime + 10);
          break;
        case 'arrowup':
          e.preventDefault();
          setVolume((v) => {
            const nv = Math.min(1, v + 0.1);
            video.volume = nv;
            video.muted = false;
            setIsMuted(false);
            return nv;
          });
          break;
        case 'arrowdown':
          e.preventDefault();
          setVolume((v) => {
            const nv = Math.max(0, v - 0.1);
            video.volume = nv;
            return nv;
          });
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'n':
          if (hasNext && onNext) {
            e.preventDefault();
            onNext();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [hasNext, onNext]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await container.requestFullscreen();
      }
    } catch {
      // Fullscreen not supported
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressRef.current;
    const video = videoRef.current;
    if (!bar || !video || !duration) return;
    const rect = bar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    video.currentTime = pos * duration;
  };

  const handleProgressDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSeeking) return;
    handleProgressClick(e);
  };

  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) videoRef.current.playbackRate = rate;
    setShowSpeedMenu(false);
  };

  const flashOverlay = (icon: 'play' | 'pause') => {
    setShowOverlayIcon(icon);
    setTimeout(() => setShowOverlayIcon(null), 600);
  };

  // Video event handlers
  const onPlay = () => {
    setIsPlaying(true);
    flashOverlay('play');
  };
  const onPause = () => {
    setIsPlaying(false);
    flashOverlay('pause');
  };
  const onVideoTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    onTimeUpdate?.(video.currentTime, video.duration);
  };
  const onDurationChange = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };
  const onProgress = () => {
    const video = videoRef.current;
    if (!video || !video.buffered.length) return;
    setBuffered(video.buffered.end(video.buffered.length - 1));
  };
  const onWaiting = () => setIsLoading(true);
  const onCanPlay = () => setIsLoading(false);
  const onError = () => {
    const video = videoRef.current;
    if (video?.error) {
      console.error('Video error:', video.error.code, video.error.message);
    }
    setIsLoading(false);
    setHasError(true);
  };
  const onVideoEnded = () => {
    setIsPlaying(false);
    onEnded?.();
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative bg-black rounded-lg overflow-hidden group select-none"
      onMouseMove={resetHideTimer}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        className="w-full aspect-video cursor-pointer"
        autoPlay={autoPlay}
        onClick={togglePlay}
        onPlay={onPlay}
        onPause={onPause}
        onTimeUpdate={onVideoTimeUpdate}
        onDurationChange={onDurationChange}
        onProgress={onProgress}
        onWaiting={onWaiting}
        onCanPlay={onCanPlay}
        onError={onError}
        onEnded={onVideoEnded}
        playsInline
        preload="auto"
      />

      {/* Center Overlay Icon (flash on play/pause) */}
      {showOverlayIcon && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="bg-black/50 rounded-full p-5 animate-ping-once">
            {showOverlayIcon === 'play' ? (
              <Play className="text-white" size={40} fill="white" />
            ) : (
              <Pause className="text-white" size={40} fill="white" />
            )}
          </div>
        </div>
      )}

      {/* Loading Spinner */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <Loader2 className="text-white animate-spin" size={48} />
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-30">
          <AlertCircle className="text-red-400 mb-3" size={48} />
          <p className="text-white text-lg font-medium mb-1">Video failed to load</p>
          <p className="text-gray-400 text-sm mb-4">Check your connection or try again</p>
          <button
            onClick={() => {
              setHasError(false);
              setIsLoading(true);
              videoRef.current?.load();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Big center play button when paused and controls visible */}
      {!isPlaying && !isLoading && !hasError && showControls && (
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer z-10"
          onClick={togglePlay}
        >
          <div className="bg-black/40 hover:bg-black/60 rounded-full p-6 transition-colors">
            <Play className="text-white" size={48} fill="white" />
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-16 pb-2 px-3 transition-opacity duration-300 z-20 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Title bar */}
        {title && (
          <div className="absolute top-4 left-4 right-4">
            <p className="text-white text-sm font-medium truncate drop-shadow-lg">{title}</p>
          </div>
        )}

        {/* Progress Bar */}
        <div
          ref={progressRef}
          className="relative h-1.5 bg-white/20 rounded-full cursor-pointer group/progress mb-3 hover:h-2.5 transition-all"
          onClick={handleProgressClick}
          onMouseDown={() => setIsSeeking(true)}
          onMouseMove={handleProgressDrag}
          onMouseUp={() => setIsSeeking(false)}
          onMouseLeave={() => setIsSeeking(false)}
        >
          {/* Buffered */}
          <div
            className="absolute inset-y-0 left-0 bg-white/30 rounded-full"
            style={{ width: `${bufferedPercent}%` }}
          />
          {/* Played */}
          <div
            className="absolute inset-y-0 left-0 bg-blue-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
          {/* Thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-blue-500 rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity"
            style={{ left: `${progressPercent}%` }}
          />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-2">
          {/* Play / Pause */}
          <button
            onClick={togglePlay}
            className="text-white hover:text-blue-400 transition-colors p-1.5"
            title={isPlaying ? 'Pause (K)' : 'Play (K)'}
          >
            {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
          </button>

          {/* Skip Back 10s */}
          <button
            onClick={() => {
              if (videoRef.current) videoRef.current.currentTime -= 10;
            }}
            className="text-white hover:text-blue-400 transition-colors p-1.5"
            title="Back 10s (J)"
          >
            <RotateCcw size={18} />
          </button>

          {/* Skip Forward 10s */}
          <button
            onClick={() => {
              if (videoRef.current) videoRef.current.currentTime += 10;
            }}
            className="text-white hover:text-blue-400 transition-colors p-1.5"
            title="Forward 10s (L)"
          >
            <RotateCw size={18} />
          </button>

          {/* Next Lecture */}
          {hasNext && (
            <button
              onClick={onNext}
              className="text-white hover:text-blue-400 transition-colors p-1.5"
              title="Next Lecture (N)"
            >
              <SkipForward size={20} fill="currentColor" />
            </button>
          )}

          {/* Time Display */}
          <span className="text-white text-xs font-mono ml-1 tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="flex-1" />

          {/* Playback Speed */}
          <div className="relative">
            <button
              onClick={() => setShowSpeedMenu((v) => !v)}
              className="text-white hover:text-blue-400 transition-colors p-1.5 flex items-center gap-1"
              title="Playback Speed"
            >
              <Settings size={18} />
              <span className="text-xs font-medium">{playbackRate}x</span>
            </button>
            {showSpeedMenu && (
              <div className="absolute bottom-full right-0 mb-2 bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-xl border border-white/10 py-1 min-w-[100px]">
                {PLAYBACK_RATES.map((rate) => (
                  <button
                    key={rate}
                    onClick={() => handleSpeedChange(rate)}
                    className={`w-full px-4 py-1.5 text-sm text-left hover:bg-white/10 transition-colors ${
                      rate === playbackRate ? 'text-blue-400 font-medium' : 'text-white'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Volume */}
          <div className="flex items-center gap-1 group/vol">
            <button
              onClick={toggleMute}
              className="text-white hover:text-blue-400 transition-colors p-1.5"
              title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
            >
              {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-0 group-hover/vol:w-20 transition-all duration-200 accent-blue-500 cursor-pointer h-1"
            />
          </div>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="text-white hover:text-blue-400 transition-colors p-1.5"
            title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
          >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};
