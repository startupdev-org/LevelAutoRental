import { useEffect, useRef, useState } from 'react';

interface UseLazyImageLoadOptions {
  threshold?: number;
  rootMargin?: string;
}

export const useLazyImageLoad = (options: UseLazyImageLoadOptions = {}) => {
  const {
    threshold = 0.1,
    rootMargin = '50px',
  } = options;

  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          // Stop observing once we've loaded
          if (ref.current) {
            observer.unobserve(ref.current);
          }
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold, rootMargin]);

  return { ref, isInView };
};
