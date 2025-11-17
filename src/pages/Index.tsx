import React, { useRef, useState, useEffect } from "react";
import { useLocation } from 'react-router-dom';

import Hero from "@/components/Hero";
import ProductShowcase from "@/components/ProductShowcase";
import AllProducts from "@/components/AllProducts";
import About from "@/components/About";
import Contact from "@/components/Contact";
import Seo from "@/components/Seo";
import BlogSec from "@/components/BlogSec";

const Index = () => {
  const allProductsRef = useRef<HTMLDivElement>(null);
  const [showAllProducts, setShowAllProducts] = useState(false);

  const location = useLocation();

  // Listen for hash indicator for the AllProducts panel (legacy behavior)
  React.useEffect(() => {
    if (window.location.hash === "#all-products") {
      setShowAllProducts(true);
      setTimeout(() => {
        allProductsRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, []);

  // On mount or when route changes, scroll to a matching section if path indicates one
  useEffect(() => {
    const navOffset = 80; // match Navigation

    const scrollToId = (id: string) => {
      const el = document.getElementById(id);
      if (!el) return;
      const top = window.scrollY + el.getBoundingClientRect().top - navOffset;
      window.scrollTo({ top, behavior: "smooth" });
    };

    const handlePath = (pathname: string) => {
      // e.g. '/', '/services', '/about' -> id: 'services'|'about'|'home'
      if (!pathname) return;
      const id = pathname === '/' ? 'home' : pathname.replace(/^\//, '');
      // wait a tick for the DOM to be ready
      setTimeout(() => scrollToId(id), 60);
    };

    // handle initial load
    handlePath(location.pathname);

    // listen for navigation events (popstate) and route changes via react-router (location)
    // react-router location change is covered by dependency below
    return () => { };
  }, [location.pathname]);

  return (
    <>
      <Seo title="Home" description="High-quality textile products and services from TechtideCo - fashion fabrics, denim, silk and tailored textile solutions." />

      <div className="min-h-screen">
        <Hero />
        <div id="services">
          <ProductShowcase />
        </div>

        {showAllProducts && (
          <div ref={allProductsRef}>
            <AllProducts />
          </div>
        )}
        <BlogSec />
        <About />
        <Contact />
      </div>
    </>
  );
};

export default Index;
