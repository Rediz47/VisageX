import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Methodology } from '../components/Methodology';
import { useTheme } from '../context/ThemeProvider';

import SEO from '../components/SEO';

export default function MethodologyPage() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  return (
    <>
      <SEO
        title="Our Methodology | Science Behind the Analysis"
        description="Learn how VisageX uses 468 facial landmarks and advanced neural networks to provide clinical-grade aesthetic analysis."
        canonical="https://visagex.online/methodology"
      />
      <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="pt-20"
    >
      <Methodology
        onBack={() => navigate('/')}
        isDarkMode={isDarkMode}
        result={null}
        imageUrl={undefined}
      />
    </motion.div>
    </>
  );
}
