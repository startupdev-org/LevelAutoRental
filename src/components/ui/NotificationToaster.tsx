import React from 'react';
import { Toaster as Sonner, toast } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Custom Notification Toaster Component
 * Customized for the admin panel with glass morphism styling
 */
const NotificationToaster = ({ ...props }: ToasterProps) => {
  return (
    <>
      <style>{`
        [data-sonner-toaster] [data-sonner-toast] {
          background: rgba(255, 255, 255, 0.1) !important;
          backdrop-filter: blur(24px) !important;
          -webkit-backdrop-filter: blur(24px) !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          border-radius: 0.75rem !important;
        }
        [data-sonner-toaster] [data-sonner-toast][data-type="success"] {
          background: rgba(255, 255, 255, 0.1) !important;
          backdrop-filter: blur(24px) !important;
          -webkit-backdrop-filter: blur(24px) !important;
          border-color: rgba(52, 211, 153, 0.3) !important;
          color: rgb(110, 231, 183) !important;
        }
        [data-sonner-toaster] [data-sonner-toast][data-type="error"] {
          background: rgba(255, 255, 255, 0.1) !important;
          backdrop-filter: blur(24px) !important;
          -webkit-backdrop-filter: blur(24px) !important;
          border-color: rgba(248, 113, 113, 0.3) !important;
          color: rgb(252, 165, 165) !important;
        }
        [data-sonner-toaster] [data-sonner-toast][data-type="info"] {
          background: rgba(255, 255, 255, 0.1) !important;
          backdrop-filter: blur(24px) !important;
          -webkit-backdrop-filter: blur(24px) !important;
          border-color: rgba(96, 165, 250, 0.3) !important;
          color: rgb(147, 197, 253) !important;
        }
        [data-sonner-toaster] [data-sonner-toast][data-type="warning"] {
          background: rgba(255, 255, 255, 0.1) !important;
          backdrop-filter: blur(24px) !important;
          -webkit-backdrop-filter: blur(24px) !important;
          border-color: rgba(251, 191, 36, 0.3) !important;
          color: rgb(253, 224, 71) !important;
        }
      `}</style>
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
              "group-[.toaster]:bg-white/10 group-[.toaster]:backdrop-blur-xl group-[.toaster]:border-emerald-400/30 group-[.toaster]:text-emerald-300",
          error:
              "group-[.toaster]:bg-white/10 group-[.toaster]:backdrop-blur-xl group-[.toaster]:border-red-400/30 group-[.toaster]:text-red-300",
          info:
              "group-[.toaster]:bg-white/10 group-[.toaster]:backdrop-blur-xl group-[.toaster]:border-blue-400/30 group-[.toaster]:text-blue-300",
          warning:
              "group-[.toaster]:bg-white/10 group-[.toaster]:backdrop-blur-xl group-[.toaster]:border-yellow-400/30 group-[.toaster]:text-yellow-300",
        },
      }}
      {...props}
    />
    </>
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

