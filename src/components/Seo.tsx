import React from "react";
import { Helmet } from "react-helmet-async";
import SITE from "@/lib/siteConfig";

type Props = {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  children?: React.ReactNode;
};

const Seo = ({ title, description, image, url, children }: Props) => {
  const fullTitle = title ? `${title} | techtidecorporate` : "TechtideCo";
  const metaDescription = description || "techtidecorporate provides web development, app development and digital marketing services to help your business grow.";
  const metaImage = image || `${SITE.baseUrl}/assets/officelogo.jpg`;
  const metaUrl = url || SITE.baseUrl;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="robots" content="index, follow" />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:url" content={metaUrl} />
      <meta property="og:type" content="website" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />

      {children}
    </Helmet>
  );
};

export default Seo;
