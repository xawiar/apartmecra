import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-gray-600 dark:text-gray-400 text-center md:text-left">
            <p>
              © 2025{' '}
              <a
                href="https://www.datdijital.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium transition-colors"
              >
                DAT Dijital
              </a>
              . Tüm hakları saklıdır.
            </p>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 text-center md:text-right">
            <p>
              Teknik destek ve iletişim için:{' '}
              <a
                href="https://www.datdijital.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium transition-colors"
              >
                DAT Dijital
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

