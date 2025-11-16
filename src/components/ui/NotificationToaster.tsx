import React from 'react';
import { Toaster as Sonner, toast } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Custom Notification Toaster Component
 * Customized for the admin panel with glass morphism styling
 */
const NotificationToaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white/10 group-[.toaster]:backdrop-blur-xl group-[.toaster]:border group-[.toaster]:border-white/20 group-[.toaster]:text-white group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl",
          description: "group-[.toast]:text-white/70",
          actionButton:
            "group-[.toast]:bg-red-500/20 group-[.toast]:text-white group-[.toast]:border group-[.toast]:border-red-500/50 group-[.toast]:rounded-lg group-[.toast]:px-4 group-[.toast]:py-2 group-[.toast]:font-medium group-[.toast]:transition-all group-[.toast]:hover:bg-red-500/30",
          cancelButton:
            "group-[.toast]:bg-white/10 group-[.toast]:text-white/70 group-[.toast]:rounded-lg group-[.toast]:px-4 group-[.toast]:py-2 group-[.toast]:font-medium group-[.toast]:transition-all group-[.toast]:hover:bg-white/20",
          success:
            "group-[.toaster]:bg-emerald-500/20 group-[.toaster]:border-emerald-400/30 group-[.toaster]:text-emerald-100",
          error:
            "group-[.toaster]:bg-red-500/20 group-[.toaster]:border-red-400/30 group-[.toaster]:text-red-100",
          info:
            "group-[.toaster]:bg-blue-500/20 group-[.toaster]:border-blue-400/30 group-[.toaster]:text-blue-100",
          warning:
            "group-[.toaster]:bg-yellow-500/20 group-[.toaster]:border-yellow-400/30 group-[.toaster]:text-yellow-100",
        },
      }}
      {...props}
    />
  );
};

/**
 * Custom Notification Hook
 * Provides methods to show different types of notifications
 */
export const useNotification = () => {
  const showSuccess = (title: string, description?: string) => {
    toast.success(title, {
      description,
      duration: 4000,
    });
  };

  const showError = (title: string, description?: string) => {
    toast.error(title, {
      description,
      duration: 5000,
    });
  };

  const showInfo = (title: string, description?: string) => {
    toast.info(title, {
      description,
      duration: 4000,
    });
  };

  const showWarning = (title: string, description?: string) => {
    toast.warning(title, {
      description,
      duration: 4000,
    });
  };

  return {
    showSuccess,
    showError,
    showInfo,
    showWarning,
  };
};

export { NotificationToaster, toast };

