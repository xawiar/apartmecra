import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoginHeader from './LoginHeader';
import LoginForm from './LoginForm';
import LoginFooter from './LoginFooter';
import LoadingSpinner from './LoadingSpinner';
import { motion } from 'framer-motion';

const LoginEnhanced = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Load saved credentials on mount
  useEffect(() => {
    const savedUsername = localStorage.getItem('rememberedUsername');
    const savedPassword = localStorage.getItem('rememberedPassword');
    const savedRememberMe = localStorage.getItem('rememberMe') === 'true';
    
    if (savedRememberMe && savedUsername && savedPassword) {
      setUsername(savedUsername);
      setPassword(savedPassword);
      setRememberMe(true);
    }
    
    // Auto-focus username field on mount
    const usernameInput = document.getElementById('username');
    if (usernameInput) {
      usernameInput.focus();
    }
  }, []);

  // Handle form submission with enhanced validation and UX
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setError('');
    
    // Validate inputs
    if (!username.trim()) {
      setError('Kullanıcı adı alanı boş bırakılamaz');
      document.getElementById('username').focus();
      return;
    }
    
    if (!password) {
      setError('Şifre alanı boş bırakılamaz');
      document.getElementById('password').focus();
      return;
    }
    
    // Show loading state
    setIsLoading(true);
    
    try {
      // Simulate network delay for better UX
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Attempt to login
      const success = await login(username, password);
      
      if (success) {
        // Handle remember me functionality
        if (rememberMe) {
          localStorage.setItem('rememberedUsername', username);
          localStorage.setItem('rememberedPassword', password);
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('rememberedUsername');
          localStorage.removeItem('rememberedPassword');
          localStorage.removeItem('rememberMe');
        }
        
        setShowSuccess(true);
        // Navigate after a short delay to show success animation
        setTimeout(() => {
          navigate('/');
        }, 1200);
      } else {
        setError('Geçersiz kullanıcı adı veya şifre');
      }
    } catch (err) {
      setError('Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[1350px] mx-auto"
      >
        <div className="sm:max-w-[1000px] mx-auto md:max-w-[600px]">
          <LoginHeader />
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-8 bg-white/80 backdrop-blur-lg py-8 px-6 shadow-xl rounded-2xl border border-white/50 sm:px-10 relative overflow-hidden"
          >
            {/* Animated background elements */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
            <div className="absolute -bottom-12 -left-20 w-40 h-40 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
            <div className="absolute top-10 left-20 w-40 h-40 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
            
            {showSuccess ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-10"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Giriş Başarılı!</h3>
                <p className="text-gray-600">Yönlendiriliyorsunuz...</p>
              </motion.div>
            ) : (
              <>
                <LoginForm 
                  username={username}
                  setUsername={setUsername}
                  password={password}
                  setPassword={setPassword}
                  error={error}
                  isLoading={isLoading}
                  handleSubmit={handleSubmit}
                  rememberMe={rememberMe}
                  setRememberMe={setRememberMe}
                />
                
                <LoginFooter />
              </>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginEnhanced;