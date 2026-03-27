import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { TermsOfService } from '../components/TermsOfService';
import { useTheme } from '../context/ThemeProvider';

export default function TermsPage() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="pt-20"
    >
      <TermsOfService
        onBack={() => navigate('/')}
        isDarkMode={isDarkMode}
      />
    </motion.div>
  );
}
