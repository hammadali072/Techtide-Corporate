import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useEffect as useAuthEffect } from "react";
import { ShoppingCart } from "lucide-react";
import { auth } from "@/firebase";
import { Swiper, SwiperSlide } from 'swiper/react';
import { ChevronRight, ChevronLeft } from "lucide-react";
import { EffectFade, Navigation, Autoplay } from 'swiper/modules';
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import OrderForm from "@/components/OrderForm";
import WHATSAPP from "@/lib/contactConfig";
import SITE from "@/lib/siteConfig";
import { db } from "@/firebase";
import { ref, get } from "firebase/database";
import Seo from "@/components/Seo";

interface Service {
  id: string;
  name: string;
  description: string;
  images: string[];
  createdAt?: string;
}

const ProductDetailPage = () => {
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);
  const { productName } = useParams();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const navigate = useNavigate();

  const handleAnchorClick = (href: string, e?: any) => {
    if (e) e.preventDefault();
    const raw = href.replace(/^#/, "").replace(/^\//, "");
    const id = raw || 'home';
    const targetPath = id === 'home' ? '/' : `/${id}`;
    navigate(targetPath);
  };

  useAuthEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!productName) return;
    const fetchService = async () => {
      setLoading(true);
      const serviceRef = ref(db, `services/${productName}`);
      const snap = await get(serviceRef);
      if (snap.exists()) {
        setService({ id: productName, ...snap.val() });
      } else {
        setService(null);
      }
      setLoading(false);
    };
    fetchService();
  }, [productName]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-xl text-gray-500">Loading...</div>;
  }

  if (!service) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center">
        <h2 className="text-3xl font-bold mb-4">Product Not Found</h2>
        <Link to="/all-products">
          <Button>Back to All Products</Button>
        </Link>
      </div>
    );
  }

  const images = Array.isArray(service.images) ? service.images : [];
  const handlePrev = () => setImgIdx((prev) => (prev - 1 + images.length) % images.length);
  const handleNext = () => setImgIdx((prev) => (prev + 1) % images.length);

  // Render overview/content blocks stored on the service (blocks similar to blog blocks)
  const renderBlocks = () => {
    const blocks = (service as any).blocks || [];
    if (!blocks || blocks.length === 0) return null;

    const out: any[] = [];
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];

      if (b.type === 'heading') {
        const level = b.level || 2;
        const Tag = (`h${level}`) as any;
        const size = level === 1 ? 'lg:text-3xl text-2xl' : level === 2 ? 'lg:text-2xl text-xl' : 'lg:text-xl text-lg';
        out.push(<Tag key={`h-${i}`} className={`${size} font-bold text-slate-800`}>{b.text}</Tag>);
        continue;
      }

      if (b.type === 'paragraph') {
        out.push(<p key={`p-${i}`} className="text-lg leading-relaxed text-slate-700">{b.text}</p>);
        continue;
      }

      // If a descriptionList is immediately followed by an image block, render them side-by-side
      if (b.type === 'descriptionList') {
        const next = blocks[i + 1];
        if (next && next.type === 'image' && next.url) {
          out.push(
            <div key={`dl-img-${i}`} className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1 lg:pr-10">
                <dl className="space-y-6">
                  {b.items?.map((item: any, idxItem: number) => (
                    <div key={idxItem} className="group lg:pl-5 pl-3 border-l-4 border-primary/30 ml-0 duration-300 group hover:border-blue-500">
                      <dt className="text-lg font-semibold text-primary mb-1">{item.term}</dt>
                      <dd className="text-base leading-relaxed text-muted-foreground">{item.description}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="w-full lg:w-1/3 md:w-1/2">
                <figure className="w-full h-full">
                  <img src={next.url} alt={service.description || `Image ${i + 1}`} className="rounded-lg shadow-md w-full h-full object-cover max-h-80" />
                </figure>
              </div>
            </div>
          );
          // skip the next block (image) since we've rendered it
          i++;
          continue;
        }

        // Otherwise render description list full width
        out.push(
          <div key={`dl-${i}`} className="w-full">
            <dl className="md:space-y-6 space-y-4">
              {b.items?.map((item: any, idxItem: number) => (
                <div key={idxItem} className="pl-6 border-l-4 border-primary/30 ml-0 duration-300 group hover:border-blue-500">
                  <dt className="text-lg font-semibold text-primary mb-1">{item.term}</dt>
                  <dd className="text-base leading-relaxed text-muted-foreground">{item.description}</dd>
                </div>
              ))}
            </dl>
          </div>
        );
        continue;
      }

      // Single image block (not combined with a description list)
      if (b.type === 'image' && b.url) {
        out.push(
          <figure key={`img-${i}`} className="w-full flex flex-col items-center">
            <img src={b.url} alt={service.description || `Image ${i + 1}`} className="rounded-lg shadow-md w-full max-h-[400px] object-cover mb-2" />
          </figure>
        );
        continue;
      }
    }

    return <div className="w-full space-y-5">{out}</div>;
  };

  return (
    <>
      <Seo
        title={service.name}
        description={service.description}
        image={images[imgIdx] || (service.images && service.images[0])}
        url={`${SITE.baseUrl}/product/${service.id}`}
      />
      <div className="min-h-screen flex flex-col bg-background">
        {/* Full width image slider */}
        <div className="w-full md:h-[80vh] h-[50vh] relative">
          <Swiper
            slidesPerView={1}
            effect="slide"
            loop={true}
            autoplay={{ delay: 3000, disableOnInteraction: false }}
            navigation={{
              nextEl: '.swiper-button-next',
              prevEl: '.swiper-button-prev',
            }}
            modules={[Navigation, Autoplay]}
            className="w-full h-full"
          >
            {images.map((img, idx) => (
              <SwiperSlide key={idx} className="relative">
                <img
                  src={img}
                  alt={service.description ? `${service.name} ${service.description}` : 'Product image'}
                  className="w-full h-full object-cover object-center"
                  style={{ height: '100%', width: '100%' }}
                />
                <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background/90 to-transparent" />
              </SwiperSlide>
            ))}
            <div className="swiper-button-prev z-50 absolute top-1/2 left-4 -translate-y-1/2 group">
              <Button variant="ghost" className="size-8 flex justify-center items-center p-2 rounded-full bg-white/80 group-hover:bg-blue-500 shadow border border-border">
                <ChevronLeft className="size-6 text-textile-charcoal group-hover:text-white" />
              </Button>
            </div>
            <div className="swiper-button-next z-50 absolute top-1/2 right-4 -translate-y-1/2 group">
              <Button variant="ghost" className="size-8 flex justify-center items-center p-2 rounded-full bg-white/80 group-hover:bg-blue-500 shadow border border-border">
                <ChevronRight className="size-6 text-textile-charcoal group-hover:text-white" />
              </Button>
            </div>
          </Swiper>
        </div>
        {/* Product details */}
        <main className="flex-1 flex flex-col items-center justify-start px-4 -mt-24 mb-20 z-10 relative">
          <div className="bg-card/95 backdrop-blur-sm rounded-xl shadow-xl sm:p-10 p-5 max-w-7xl w-full flex flex-col items-center border border-border">
            <div className="w-full prose prose-lg prose-slate">
              {renderBlocks()}
            </div>
            <Dialog>
              <DialogTrigger asChild>
                {user ? (
                  <Button size="lg" variant="default" className="mt-10 w-full max-w-xs text-lg font-semibold py-4 rounded-full shadow-2xl bg-gradient-to-r from-primary to-textile-silk transform hover:scale-105 transition-all duration-300">
                    <span className="inline-block mr-2"><ShoppingCart /></span> Order Now
                  </Button>
                ) : (
                  <Button size="lg" variant="default" className="w-full max-w-xs text-lg font-semibold py-4 rounded-full shadow-lg bg-gradient-to-r from-primary to-textile-silk hover:from-textile-silk hover:to-primary transition-all duration-300" disabled>
                    Please login first
                  </Button>
                )}
              </DialogTrigger>
              <DialogContent>
                {user ? (
                  <>
                    <div className="mb-4 text-center">
                      <div className="text-lg font-semibold mb-2">Order via WhatsApp</div>
                      <div className="text-sm text-muted-foreground">WhatsApp: <a href={`https://wa.me/${WHATSAPP.numberPlain}`} target="_blank" rel="noopener noreferrer" className="text-green-600 underline">{WHATSAPP.display}</a></div>
                    </div>
                    <OrderForm
                      productName={service.name}
                      productId={service.id}
                      productUrl={`${SITE.baseUrl}/product/${service.id}`}
                      productImage={images[imgIdx] || (service.images && service.images[0]) || ''}
                    />
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-lg font-semibold mb-2 text-red-600">Please login first to place an order.</div>
                    <div className="text-sm text-muted-foreground mb-4">You must be logged in to submit an order.</div>
                    <Button onClick={() => setShowLoginModal(true)} className="bg-textile-silk text-white font-bold px-6 py-3 rounded-full">Login</Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </>
  );
};

export default ProductDetailPage;