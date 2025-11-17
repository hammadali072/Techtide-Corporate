import AllProducts from "@/components/AllProducts";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import React, { useEffect } from "react";
import Seo from "@/components/Seo";

const AllProductsPage = () => {
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);
  return (
    <>
      <Seo title="All Products" description="Explore all textile products including linens, silks, denim and more from TechtideCo." />
      <div className="min-h-screen">
        <AllProducts />
      </div>
    </>
  );
};

export default AllProductsPage;
