import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { db } from "@/firebase";
import { ref, onValue } from "firebase/database";
// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';
// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
// Import required modules
import { Navigation, Autoplay } from 'swiper/modules';
// Import custom styles
import './ProductShowcase.css';
import { ChevronRight, ChevronLeft } from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string;
  images: string[];
  altTexts?: string[];
  createdAt?: string;
}

const ProductShowcase = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [imgIndexes, setImgIndexes] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const servicesRef = ref(db, "services");
    const unsubscribe = onValue(servicesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, s]: any) => ({ id, ...s }));
        // Sort by createdAt desc, take latest 4
        const sorted = list.sort((a, b) => (b.createdAt || "")?.localeCompare(a.createdAt || ""));
        setServices(sorted.slice(0, 8));
        setImgIndexes(new Array(Math.min(4, sorted.length)).fill(0));
      } else {
        setServices([]);
        setImgIndexes([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleNextImage = (idx: number) => {
    setImgIndexes((prev) =>
      prev.map((val, i) =>
        i === idx
          ? (val + 1) % (services[i]?.images?.length || 1)
          : val
      )
    );
  };
  const handlePrevImage = (idx: number) => {
    setImgIndexes((prev) =>
      prev.map((val, i) =>
        i === idx
          ? (val - 1 + (services[i]?.images?.length || 1)) % (services[i]?.images?.length || 1)
          : val
      )
    );
  };

  return (
    <section id="products" className="pt-[75px] pb-[75px] bg-gradient-hero">
      <div className="container">
        <div className="mx-auto px-4 text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-textile-charcoal mb-6">
            <span
              style={{
                background: 'linear-gradient(90deg, #4A00E0 10%, #00C9FF 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Our Services Collection
            </span>
          </h2>
          <p className="lg:text-xl text-base text-muted-foreground max-w-3xl mx-auto leading-relaxed">Discover Techtide Co.'s expertise in web development, mobile app development, and digital marketing. We build modern, scalable, and results-driven solutions to help your business grow online.</p>
        </div>

        <div>
          {loading ? (
            <div className="text-center text-gray-500">Loading services...</div>
          ) : services.length === 0 ? (
            <div className="text-center text-gray-500">No services found.</div>
          ) : (
            <div className="relative">
              <Swiper
                modules={[Navigation, Autoplay]}
                navigation={{
                  nextEl: '.swiper-button-next',
                  prevEl: '.swiper-button-prev',
                }}
                autoplay={{
                  delay: 3000,
                  disableOnInteraction: false,
                }}
                spaceBetween={24}
                slidesPerView={1}
                loop={true}
                breakpoints={{
                  640: {
                    slidesPerView: 2,
                  },
                  1024: {
                    slidesPerView: 3,
                  }
                }}
                className="w-full"
              >
                {services.map((service, index) => {
                  const images = Array.isArray(service.images) ? service.images : [];
                  const altTexts: string[] = (service as any).altTexts || [];
                  const currentImage = images[imgIndexes[index]] || images[0];
                  const currentAlt = altTexts[imgIndexes[index]] || altTexts[0] || (service.name ? `${service.name} product image` : 'Service image');
                  return (
                    <SwiperSlide key={service.id}>
                      <Card className="overflow-hidden shadow-lg bg-card/80 backdrop-blur-sm border-border/50 duration-300 group hover:shadow-xl">
                        <div className="relative h-72 overflow-hidden cursor-pointer flex flex-col items-center justify-center">
                          <Link to={`/product/${service.id}`} className="block size-full">
                            {currentImage && (
                              <img
                                src={currentImage}
                                alt={currentAlt}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                              />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-textile-silk to-textile-cotton opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                          </Link>
                          {/* Arrows for switching images - desktop only */}
                          {images.length > 1 && (
                            <>
                              <button
                                aria-label="Previous image"
                                className="hidden md:block absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1 shadow border border-border z-10 opacity-0 duration-300 group-hover:opacity-100"
                                onClick={e => { e.stopPropagation(); handlePrevImage(index); }}
                              >
                                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" /></svg>
                              </button>
                              <button
                                aria-label="Next image"
                                className="hidden md:block absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1 shadow border border-border z-10 opacity-0 duration-300 group-hover:opacity-100"
                                onClick={e => { e.stopPropagation(); handleNextImage(index); }}
                              >
                                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg>
                              </button>
                            </>
                          )}
                        </div>
                        <CardContent className="p-6 lg:p-2">
                          <Link to={`/product/${service.id}`} className="lg:text-xl md:text-xl text-lg font-semibold text-textile-charcoal mb-3 hover:text-blue-500 block duration-300 group-hover:text-blue-500">{service.name}</Link>
                          <p className="text-muted-foreground text-sm leading-relaxed">{service.description}</p>
                        </CardContent>
                      </Card>
                    </SwiperSlide>
                  );
                })}
              </Swiper>
              <div className="swiper-button-prev !left-0 md:!left-[-20px] group">
                <Button variant="ghost" className="size-8 flex justify-center items-center p-2 rounded-full bg-white/80 group-hover:bg-blue-500 shadow border border-border">
                  <ChevronLeft className="size-6 text-textile-charcoal group-hover:text-white" />
                </Button>
              </div>
              <div className="swiper-button-next !right-0 md:!right-[-20px] group">
                <Button variant="ghost" className="size-8 flex justify-center items-center p-2 rounded-full bg-white/80 group-hover:bg-blue-500 shadow border border-border">
                  <ChevronRight className="size-6 text-textile-charcoal group-hover:text-white" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* View All Button */}
        <div className="flex justify-center mt-12">
          <Link to="/all-services">
            <Button size="lg" variant="default">View All</Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;  