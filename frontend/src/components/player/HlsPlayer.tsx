import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import styles from './HlsPlayer.module.css';

interface HlsPlayerProps {
  src: string;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  initialTime?: number;
}

export default function HlsPlayer({ src, onTimeUpdate, onEnded, initialTime = 0 }: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [quality, setQuality] = useState<number>(-1);
  const [levels, setLevels] = useState<{ height: number; index: number }[]>([]);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    // Destroy previous instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
      });
      hlsRef.current = hls;

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        const lvls = data.levels.map((l, i) => ({ height: l.height, index: i }));
        setLevels(lvls);
        if (initialTime > 0) video.currentTime = initialTime;
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS (Safari)
      video.src = src;
      if (initialTime > 0) {
        video.addEventListener('loadedmetadata', () => { video.currentTime = initialTime; }, { once: true });
      }
      video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    };
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handler = () => onTimeUpdate?.(video.currentTime, video.duration || 0);
    const endedHandler = () => onEnded?.();
    video.addEventListener('timeupdate', handler);
    video.addEventListener('ended', endedHandler);
    return () => {
      video.removeEventListener('timeupdate', handler);
      video.removeEventListener('ended', endedHandler);
    };
  }, [onTimeUpdate, onEnded]);

  const handleQualityChange = (idx: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = idx;
      setQuality(idx);
    }
  };

  return (
    <div className={styles.player}>
      <video
        ref={videoRef}
        className={styles.video}
        controls
        playsInline
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      />

      {levels.length > 1 && (
        <div className={`${styles.qualityPanel} ${showControls ? styles.visible : ''}`}>
          <span className={styles.qualityLabel}>Качество:</span>
          <button
            className={`${styles.qualityBtn} ${quality === -1 ? styles.active : ''}`}
            onClick={() => handleQualityChange(-1)}
          >
            Авто
          </button>
          {levels.map(l => (
            <button
              key={l.index}
              className={`${styles.qualityBtn} ${quality === l.index ? styles.active : ''}`}
              onClick={() => handleQualityChange(l.index)}
            >
              {l.height}p
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
