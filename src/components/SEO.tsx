import { Helmet } from "react-helmet-async";

const SITE_URL = "https://recipe-finder-flow.lovable.app";
const SITE_NAME = "ספר המתכונים הדיגיטלי";

interface SEOProps {
  title: string;
  description: string;
  path: string;
  jsonLd?: Record<string, any> | Record<string, any>[];
}

const SEO = ({ title, description, path, jsonLd }: SEOProps) => {
  const url = `${SITE_URL}${path}`;
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} — ${SITE_NAME}`;
  const safeTitle = fullTitle.length > 60 ? fullTitle.slice(0, 57) + "..." : fullTitle;
  const safeDescription =
    description.length > 160 ? description.slice(0, 157) + "..." : description;

  const schemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{safeTitle}</title>
      <meta name="description" content={safeDescription} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={safeTitle} />
      <meta property="og:description" content={safeDescription} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(s)}</script>
      ))}
    </Helmet>
  );
};

export default SEO;