import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  canonical?: string;
  type?: string;
  noindex?: boolean;
  keywords?: string;
  publishedTime?: string;
  modifiedTime?: string;
  jsonLd?: object | object[];
}

const SEO: React.FC<SEOProps> = ({
  title = 'VisageX — Free AI Face Analysis & Symmetry Score',
  description = 'Get your AI face score in seconds. VisageX scans 468 facial landmarks to rate symmetry, jawline, skin health & more. Free online tool — no download needed.',
  image = 'https://visagex.online/og-default.png',
  canonical = 'https://visagex.online',
  type = 'website',
  noindex = false,
  keywords,
  publishedTime,
  modifiedTime,
  jsonLd
}) => {
  const fullTitle = title.includes('VisageX') ? title : `${title} | VisageX`;
  const schema = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="author" content="VisageX" />
      <meta name="application-name" content="VisageX" />
      <meta name="theme-color" content="#050508" />
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'} />
      {canonical && <link rel="canonical" href={canonical} />}
      <link rel="icon" type="image/png" href="/icon.png" />
      <link rel="apple-touch-icon" href="/icon.png" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="VisageX" />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:alt" content={fullTitle} />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonical} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Multilingual Support (hreflang) - Defaulting to English */}
      <link rel="alternate" hrefLang="en" href={canonical} />
      <link rel="alternate" hrefLang="x-default" href={canonical} />
      {schema.map((item, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;
