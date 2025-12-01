import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp } from 'lucide-react';
import React, { useState } from 'react';

interface FloatingContactProps {
  className?: string;
}

export const FloatingContact: React.FC<FloatingContactProps> = ({ className }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const contactMethods = [
    {
      name: '+373 62 000 112',
      icon: '/social/mobile.png',
      href: 'tel:+37362000112',
      delay: 0.1
    },
    {
      name: 'Telegram',
      icon: '/social/telegram.png',
      href: 'https://t.me/Level_Auto_Rental',
      delay: 0.2
    },
    {
      name: 'WhatsApp',
      icon: '/social/whatsapp.png',
      href: 'https://wa.me/37362000112',
      delay: 0.3
    }
  ];

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      {/* Contact Methods Container - Expandable */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 1 }}
            transition={{ 
              duration: 0.3,
              ease: "easeOut"
            }}
            className="absolute bottom-[70px] right-0 bg-white rounded-xl shadow-lg border border-gray-200 min-w-[200px]"
          >
            <div className="space-y-1">
              {contactMethods.map((method, index) => (
                <motion.a
                  key={method.name}
                  href={method.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 1, x: 0 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 1, x: 0 }}
                  transition={{ 
                    delay: 0.1 + (index * 0.1),
                    duration: 0.2
                  }}
                  className="flex items-center space-x-3 p-2 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-200 last:border-b-0 p-3 px-5"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="relative">
                    {/* Live Circle Effect for Call Icon */}
                    {method.name === '+373 62 000 112' && (
                      <motion.div
                        className="absolute inset-0 rounded-full border border-[#333333]"
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.6, 0, 0.6]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    )}
                    
                    <motion.img 
                      src={method.icon} 
                      alt={method.name}
                      className="w-8 h-8 object-contain"
                      animate={method.name === '+373 62 000 112' ? {
                        rotate: [0, 5, -5, 0]
                      } : {}}
                      transition={method.name === '+373 62 000 112' ? {
                        duration: 1.2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      } : {}}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {method.name}
                  </span>
                </motion.a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Main Chat Icon - Fixed Position */}
      <div className="relative">
        {/* Live Circle Effect */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-red-400"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.8, 0, 0.8]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            rotate: [0, 10, -10, 0]
          }}
          transition={{ 
            delay: 0,
            type: "spring",
            stiffness: 200,
            damping: 20,
            rotate: {
              duration: 0.8,
              repeat: 3,
              repeatDelay: 30,
              ease: "easeInOut"
            }
          }}
          className="relative flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl z-10"
          style={{ 
            background: 'linear-gradient(135deg, #F52C2D, #e02424)'
          }}
          whileHover={{ 
            scale: 1.1
          }}
          whileTap={{ scale: 0.95 }}
        >
        <div className="relative w-7 h-7">
          <motion.div
            key={isExpanded ? "arrow" : "chat"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {isExpanded ? (
              <ChevronUp className="w-7 h-7 text-white font-bold" strokeWidth={3} />
            ) : (
              <img 
                src="/social/chat.png"
                alt="Chat"
                className="w-7 h-7 object-contain scale-x-[-1]"
              />
            )}
          </motion.div>
        </div>
        </motion.button>
      </div>
    </div>
  );
};
