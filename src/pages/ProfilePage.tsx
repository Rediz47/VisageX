import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Profile } from '../components/Profile';
import { useTheme } from '../context/ThemeProvider';
import { useCredits } from '../context/CreditsProvider';

import SEO from '../components/SEO';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { credits } = useCredits();

  return (
    <>
      <SEO title="Your Profile" noindex={true} />
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        <Profile onBack={() => navigate('/')} isDarkMode={isDarkMode} userCredits={credits} />
      </motion.div>
    </>
  );
}
