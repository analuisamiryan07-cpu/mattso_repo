// Reproductor HLS con video.js (regla de arquitectura §"Reproducción VOD": no
// <video> nativo). Envía un ping de progreso cada 10s de reproducción real
// (no cada 10s de reloj — pausado no cuenta) y uno final al terminar/salir.
// El servidor decide si eso cuenta como completado (progress.service.ts); este
// componente solo informa `onProgressUpdate` con lo que el backend respondió.

import { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { lmsService } from '@api/lmsService';
import './VideoPlayer.css';

const PING_INTERVAL_SECONDS = 10;

const VideoPlayer = ({ contentItem, onProgressUpdate }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const lastPingRef = useRef(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!videoRef.current) return;

    const player = videojs(videoRef.current, {
      controls: true,
      fluid: true,
      preload: 'metadata',
      sources: [{ src: contentItem.cloudinary_url, type: 'application/x-mpegURL' }],
    });
    playerRef.current = player;
    lastPingRef.current = 0;

    const sendPing = async (forced = false) => {
      const current = player.currentTime();
      const duration = contentItem.video_duration_seconds || player.duration();
      if (!duration || Number.isNaN(current)) return;
      if (!forced && current - lastPingRef.current < PING_INTERVAL_SECONDS) return;

      lastPingRef.current = current;
      try {
        const result = await lmsService.enviarVideoPing(contentItem.id, current, duration);
        onProgressUpdate?.(result);
      } catch (err) {
        // Un ping fallido no debe interrumpir la reproducción — se reintenta en el siguiente tick.
        console.warn('No se pudo registrar el progreso del video:', err?.response?.data?.message);
      }
    };

    player.on('timeupdate', () => sendPing(false));
    player.on('pause', () => sendPing(true));
    player.on('ended', () => sendPing(true));
    player.on('error', () => setError('No se pudo cargar el video. Intenta recargar la página.'));

    return () => {
      sendPing(true);
      player.dispose();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentItem.id]);

  return (
    <div className="lms-video-wrap">
      {error && <p className="lms-video-error">{error}</p>}
      <div data-vjs-player>
        <video ref={videoRef} className="video-js vjs-big-play-centered" />
      </div>
    </div>
  );
};

export default VideoPlayer;
