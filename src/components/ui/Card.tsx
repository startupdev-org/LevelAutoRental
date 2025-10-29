import { motion, MotionProps } from 'framer-motion';
import React from 'react';
import { cn } from '../../lib/utils';

// ✅ This ensures we combine both div props and motion props correctly
type CardProps = React.HTMLAttributes<HTMLDivElement> &
  MotionProps & {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
  };

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hover = true,
  ...props
}) => {
  return (
    <motion.div
      whileHover={
        hover
          ? {
            y: -5,
            boxShadow:
              '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }
          : {}
      }
      transition={{ duration: 0.2 }}
      className={cn(
        'bg-white rounded-lg shadow-md overflow-hidden',
        className,
        props.onClick ? 'cursor-pointer' : ''
      )}
      {...props} // ✅ now type-safe with Framer Motion + HTML props
    >
      {children}
    </motion.div>
  );
};
