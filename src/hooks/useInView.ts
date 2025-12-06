import { useRef, useEffect, useState } from 'react';

export const useInView = (options?: { threshold?: number; triggerOnce?: boolean }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (options?.triggerOnce && hasTriggered) return;

        const inView = entry.isIntersecting;
        setIsInView(inView);

        if (options?.triggerOnce && inView) {
          setHasTriggered(true);
        }
      },
      {
        threshold: options?.threshold || 0.1,
      }
    );

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [options?.threshold, options?.triggerOnce, hasTriggered]);

  return { ref, isInView };
};