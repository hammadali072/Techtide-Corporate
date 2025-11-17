import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { db } from "@/firebase";
import { ref, onValue } from "firebase/database";

interface Service {
  id: string;
  name: string;
  description: string;
  images: string[];
  altTexts?: string[];
  createdAt?: string;
}

const AllProducts = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [imgIndexes, setImgIndexes] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const servicesRef = ref(db, "services");
    const unsubscribe = onValue(servicesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, s]: any) => ({ id, ...s }));
        setServices(list);
        setImgIndexes(new Array(list.length).fill(0));
      } else {
        setServices([]);
        setImgIndexes([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handlePrev = (idx: number, images: string[], e: React.MouseEvent<HTMLButtonElement>) => {
    // prevent the Link navigation when clicking the control buttons
    e.preventDefault();
    e.stopPropagation();
    setImgIndexes(prev => prev.map((v, i) => i === idx ? (v - 1 + images.length) % images.length : v));
  };
  const handleNext = (idx: number, images: string[], e: React.MouseEvent<HTMLButtonElement>) => {
    // prevent the Link navigation when clicking the control buttons
    e.preventDefault();
    e.stopPropagation();
    setImgIndexes(prev => prev.map((v, i) => i === idx ? (v + 1) % images.length : v));
  };

  return (
    <section id="all-products" className="pt-[75px] pb-[75px] bg-background min-h-screen">
      <div className="container">
        <div className="mx-auto px-4 text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-textile-charcoal mb-6 pb-2 mt-8">Our Digital Expertise</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed pb-4">Explore our complete range of professional digital solutions, including mobile app development, web design, and digital marketing services - crafted to help your business grow online.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {loading ? (
            <div className="col-span-4 text-center text-gray-500">Loading services...</div>
          ) : services.length === 0 ? (
            <div className="col-span-4 text-center text-gray-500">No services found.</div>
          ) : (
            services.map((service, idx) => {
              const images = Array.isArray(service.images) ? service.images : [];
              const imgIdx = imgIndexes[idx] || 0;
              return (
                <Link to={`/product/${service.id}`} key={service.id} className="group block">
                  <Card className="overflow-hidden shadow-soft bg-card/80 backdrop-blur-sm border-border/50 cursor-pointer duration-500 group hover:shadow-lg hover:scale-[1.02]">
                    <div className="relative overflow-hidden">
                      {images.length > 0 ? (
                        (() => {
                          const altTexts: string[] = (service as any).altTexts || [];
                          const currentAlt = altTexts[imgIdx] || altTexts[0] || (service.name ? `${service.name} product image` : 'Product image');
                          const src = images[imgIdx] || images[0];
                          return (
                            <img
                              src={src}
                              alt={`${service.name} ${currentAlt}`}
                              className="aspect-[1.6/1] w-full h-full object-cover duration-300 group-hover:scale-105"
                            />
                          );
                        })()
                      ) : (
                        <div className="aspect-[1.6/1] w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400">No image</div>
                      )}

                      {images.length > 1 && (
                        <>
                          <button
                            aria-label="Previous image"
                            className="absolute z-50 left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 shadow border border-border opacity-0 invisible duration-300 group-hover:opacity-100 group-hover:visible group-hover:bg-white"
                            onClick={e => handlePrev(idx, images, e)}
                          >
                            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" /></svg>
                          </button>
                          <button
                            aria-label="Next image"
                            className="absolute z-50 right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 shadow border border-border opacity-0 invisible duration-300 group-hover:opacity-100 group-hover:visible group-hover:bg-white"
                            onClick={e => handleNext(idx, images, e)}
                          >
                            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg>
                          </button>
                        </>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-textile-silk to-textile-cotton opacity-20" />
                    </div>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold text-textile-charcoal mb-2 duration-300 group-hover:text-blue-500">{service.name}</h3>
                      <p className="text-muted-foreground text-base">{service.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};

export default AllProducts;
