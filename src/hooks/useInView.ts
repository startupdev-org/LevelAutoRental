import { useInView as useFramerInView } from 'framer-motion';
import { useRef } from 'react';

export const useInView = (options?: { threshold?: number; triggerOnce?: boolean }) => {
  const ref = useRef(null);
  const isInView = useFramerInView(ref, {
    threshold: options?.threshold || 0.1,
    once: options?.triggerOnce || true
  });

  return { ref, isInView };
};