import React from 'react';
import { Helmet } from 'react-helmet-async';

interface StructuredDataProps {
  data?: object;
}

const StructuredData: React.FC<StructuredDataProps> = ({ data }) => {
  const defaultSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'VisageX',
    operatingSystem: 'Web browser',
    applicationCategory: 'HealthApplication',
    description:
      'AI face analysis and facial symmetry test. Discover a personalized glow up guide.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    }
  };

  const schemaToRender = data || defaultSchema;

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schemaToRender)}</script>
    </Helmet>
  );
};

export default StructuredData;
