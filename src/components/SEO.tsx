import React from 'react';
import { Helmet } from 'react-helmet-async';
import { SITE_CONFIG, getAbsoluteUrl, getOgImageUrl } from '../config/site';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  noindex?: boolean;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description = SITE_CONFIG.description,
  image,
  url,
  type = 'website',
  noindex = false,
}) => {
  const pageTitle = title ? `${title} | ${SITE_CONFIG.name}` : `${SITE_CONFIG.name} - ${SITE_CONFIG.tagline}`;
  const ogImage = image ? getAbsoluteUrl(image) : getOgImageUrl();
  const canonicalUrl = url ? getAbsoluteUrl(url) : SITE_CONFIG.url;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={SITE_CONFIG.keywords} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content={String(SITE_CONFIG.ogImageWidth)} />
      <meta property="og:image:height" content={String(SITE_CONFIG.ogImageHeight)} />
      <meta property="og:site_name" content={SITE_CONFIG.name} />
      <meta property="og:locale" content="ar_OM" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={SITE_CONFIG.twitter} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Additional Meta */}
      <meta name="theme-color" content="#2563eb" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    </Helmet>
  );
};
