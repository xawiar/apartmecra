import React from 'react';
import { motion } from 'framer-motion';

const LoginHeader = () => {
  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 260, 
          damping: 20,
          delay: 0.1
        }}
        className="flex justify-center mb-6"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-2xl transform rotate-6 blur-md opacity-30"></div>
          <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-4 shadow-xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>
      </motion.div>
      
      <motion.h2 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="text-3xl font-bold text-gray-900 mb-2"
      >
        Parti Sekreterliği Sistemi
      </motion.h2>
      
      <motion.p 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="text-gray-600"
      >
        Devam etmek için giriş yapın
      </motion.p>
    </div>
  );
};

export default LoginHeader;