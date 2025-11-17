import TaskDetail from "./pages/TaskDetail";
import MyTasks from './pages/MyTasks'
import React, { MouseEvent, useState, lazy, Suspense } from "react"
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";

// Lazy load all page components for optimal performance
const Careers = lazy(() => import("./pages/Careers"));
const OurTeam = lazy(() => import("./pages/OurTeam"));
const BlogList = lazy(() => import("./pages/BlogList"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AllProductsPage = lazy(() => import("./pages/AllProductsPage"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const ApplicationView = lazy(() => import("./pages/ApplicationView"));
const InternshipView = lazy(() => import("./pages/InternshipView"));

const queryClient = new QueryClient();

// Loading component for suspense fallback
const PageLoading = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

const App = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeHash, setActiveHash] = useState<string>(window.location.hash || "#home");
  
  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const navOffset = 80;
    const top = window.scrollY + el.getBoundingClientRect().top - navOffset;
    window.scrollTo({ top, behavior: "smooth" });
  };

  const waitForElementAndScroll = (id: string, timeout = 2500) => {
    return new Promise<void>((resolve) => {
      const interval = 50;
      let elapsed = 0;
      const timer = setInterval(() => {
        const el = document.getElementById(id);
        if (el) {
          clearInterval(timer);
          scrollToId(id);
          resolve();
        } else {
          elapsed += interval;
          if (elapsed >= timeout) {
            clearInterval(timer);
            resolve();
          }
        }
      }, interval);
    });
  };
  
  const handleAnchorClick = (href: string, e?: MouseEvent<HTMLAnchorElement>) => {
    if (e) e.preventDefault();
    const raw = href.replace(/^#/, '').replace(/^\//, '');
    const id = raw || 'home';
    const targetPath = id === 'home' ? '/' : `/${id}`;

    if (location.pathname !== targetPath) {
      navigate(targetPath);
      waitForElementAndScroll(id).then(() => {
        try { window.history.replaceState(null, '', targetPath); } catch { };
        setActiveHash(`#${id}`);
      });
    } else {
      scrollToId(id);
      try { window.history.replaceState(null, '', targetPath); } catch { };
      setActiveHash(`#${id}`);
    }
  };

  const display = () => {
    return location.pathname !== "/admin-dashboard" && location.pathname !== "/my-tasks";
  }
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <HelmetProvider>
          <Toaster />
          <Sonner />
          {display() ? <Navigation handleAnchorClick={handleAnchorClick} /> : null}
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/services" element={<Index />} />
            <Route path="/about" element={<Index />} />
            <Route path="/contact" element={<Index />} />
            <Route 
              path="/all-services" 
              element={
                <Suspense fallback={<PageLoading />}>
                  <AllProductsPage />
                </Suspense>
              } 
            />
            <Route 
              path="/product/:productName" 
              element={
                <Suspense fallback={<PageLoading />}>
                  <ProductDetailPage />
                </Suspense>
              } 
            />
            <Route 
              path="/admin-dashboard" 
              element={
                <Suspense fallback={<PageLoading />}>
                  <AdminDashboard />
                </Suspense>
              } 
            />
            <Route path="/my-tasks" element={<MyTasks />} />
            <Route path="/tasks/:id" element={<TaskDetail />} />
            <Route 
              path="/ourteam" 
              element={
                <Suspense fallback={<PageLoading />}>
                  <OurTeam />
                </Suspense>
              } 
            />
            <Route 
              path="/careers" 
              element={
                <Suspense fallback={<PageLoading />}>
                  <Careers />
                </Suspense>
              } 
            />
            <Route 
              path="/blog" 
              element={
                <Suspense fallback={<PageLoading />}>
                  <BlogList />
                </Suspense>
              } 
            />
            <Route 
              path="/blog/:slug" 
              element={
                <Suspense fallback={<PageLoading />}>
                  <BlogPost />
                </Suspense>
              } 
            />
            <Route 
              path="/application/:id" 
              element={
                <Suspense fallback={<PageLoading />}>
                  <ApplicationView />
                </Suspense>
              } 
            />
            <Route 
              path="/internship/:id" 
              element={
                <Suspense fallback={<PageLoading />}>
                  <InternshipView />
                </Suspense>
              } 
            />
            <Route 
              path="*" 
              element={
                <Suspense fallback={<PageLoading />}>
                  <NotFound />
                </Suspense>
              } 
            />
          </Routes>
          {display() ? <Footer handleAnchorClick={handleAnchorClick} /> : null}
        </HelmetProvider>
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App;