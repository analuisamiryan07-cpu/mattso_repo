import { useEffect, useRef } from 'react';

export function useScrollReveal(options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let done = false;

    const show = () => {
      if (done) return;
      done = true;
      el.classList.add('sr-visible');
      observer.disconnect();
      window.removeEventListener('scroll', onScroll, true);
    };

    const isVisible = () => {
      const r = el.getBoundingClientRect();
      // visible en viewport O ya pasado por encima
      return r.top < window.innerHeight || r.bottom < 0;
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting || entry.boundingClientRect.top < 0) show();
      },
      { threshold: 0, ...options },
    );

    const onScroll = () => { if (isVisible()) show(); };

    observer.observe(el);
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });

    // chequeo inmediato por si ya está en pantalla al montar
    if (isVisible()) show();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll, true);
    };
  }, []);

  return ref;
}
