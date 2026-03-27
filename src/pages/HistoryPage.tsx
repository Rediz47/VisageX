import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { History } from '../components/History';
import { useTheme } from '../context/ThemeProvider';

import SEO from '../components/SEO';

export default function HistoryPage() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  return (
    <>
      <SEO title="Scan History" noindex={true} />
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        <History
          onBack={() => navigate('/')}
          isDarkMode={isDarkMode}
          onSelectScan={() => {
            navigate('/');
          }}
        />
      </motion.div>
    </>
  );
}
