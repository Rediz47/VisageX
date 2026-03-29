import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  canonical?: string;
  type?: string;
  noindex?: boolean;
}

const SEO: React.FC<SEOProps> = ({
  title = "VisageX | AI Face Analysis & Facial Symmetry Test Free Online",
  description = "Get a professional AI face analysis and test your facial symmetry. Discover your personalized glow-up guide and looksmaxxing routine with our free online tool.",
  image = "https://visagex.online/og-default.jpg",
  canonical = "https://visagex.online",
  type = "website",
  noindex = false,
}) => {
  const fullTitle = title.includes("VisageX") ? title : `${title} | VisageX`;
  
  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      {canonical && <link rel="canonical" href={canonical} />}
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={canonical} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
      
      {/* Multilingual Support (hreflang) - Defaulting to English */}
      <link rel="alternate" hreflang="en" href={canonical} />
      <link rel="alternate" hreflang="x-default" href={canonical} />
    </Helmet>
  );
};

export default SEO;
