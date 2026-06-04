import { useState, useEffect, useRef } from 'react';

/**
 * Hook que anima un número desde 0 hasta `end` cuando el elemento
 * referenciado entra en el viewport (IntersectionObserver).
 *
 * @param {number} end - Valor final del contador
 * @param {number} duration - Duración de la animación en ms (default 2000)
 * @returns {{ count: number, countRef: React.RefObject }}
 */
const useCountUp = (end, duration = 2000) => {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const countRef = useRef(null);

  useEffect(() => {
    const el = countRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => {
      observer.unobserve(el);
      observer.disconnect();
    };
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    let startTimestamp = null;
    let rafId;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(easeProgress * end));
      if (progress < 1) {
        rafId = window.requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };

    rafId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(rafId);
  }, [hasStarted, end, duration]);

  return { count, countRef };
};

export default useCountUp;
