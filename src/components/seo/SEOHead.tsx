import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title: string;
  description: string;
  url?: string;
  image?: string;
  type?: 'website' | 'product' | 'article';
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  speakable?: {
    cssSelector: string[];
  };
}

export const SEOHead = ({
  title,
  description,
  url,
  image = 'https://vaiavita.ro/og-image.jpg',
  type = 'website',
  noindex = false,
  jsonLd,
  speakable,
}: SEOHeadProps) => {
  const fullUrl = url ? `https://vaiavita.ro${url}` : 'https://vaiavita.ro';

  const jsonLdArray = jsonLd
    ? Array.isArray(jsonLd)
      ? jsonLd
      : [jsonLd]
    : [];

  // Add speakable schema if provided
  if (speakable) {
    jsonLdArray.push({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: title,
      speakable: {
        '@type': 'SpeakableSpecification',
        cssSelector: speakable.cssSelector,
      },
      url: fullUrl,
    });
  }

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={fullUrl} />

      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content={type} />
      <meta property="og:locale" content="ro_RO" />
      <meta property="og:site_name" content="VAIAVITA" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD */}
      {jsonLdArray.map((ld, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(ld)}
        </script>
      ))}
    </Helmet>
  );
};
