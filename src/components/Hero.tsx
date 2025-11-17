import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Code, Cloud, Sparkles, Shield, Zap, Users, Award, Target, Rocket, Brain, Database } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollReveal } from '@/components/ScrollReveal';
import { GeometricBackground } from "./GeometricBackground";

import heroBg from "@/assets/hero-bg.jpg";

const Home = () => {
  const features = [
    {
      icon: Code,
      title: "Web & App Development",
      description: "Custom solutions built with cutting-edge technologies",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Brain,
      title: "AI & Machine Learning",
      description: "Intelligent systems powered by advanced algorithms",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Cloud,
      title: "Cloud Infrastructure",
      description: "Scalable, secure, and reliable cloud solutions",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: Database,
      title: "Data Engineering",
      description: "Transform raw data into actionable insights",
      color: "from-orange-500 to-yellow-500",
    },
    {
      icon: Sparkles,
      title: "Blockchain Solutions",
      description: "Decentralized applications and smart contracts",
      color: "from-indigo-500 to-blue-500",
    },
    {
      icon: Rocket,
      title: "Digital Transformation",
      description: "End-to-end modernization of business processes",
      color: "from-red-500 to-pink-500",
    },
  ];

  const whyChooseUs = [
    {
      icon: Shield,
      title: "Trusted Partner",
      description: "Enterprise-grade security and reliability",
    },
    {
      icon: Zap,
      title: "Fast Delivery",
      description: "Agile development with rapid deployment",
    },
    {
      icon: Users,
      title: "Expert Team",
      description: "Seasoned professionals across all tech stacks",
    },
    {
      icon: Award,
      title: "Quality Assured",
      description: "Rigorous testing and best practices",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 lg:pt-28">
        <GeometricBackground />

        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-tech-dark/95 via-primary/80 to-tech-dark/95" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.h1
              className="lg:text-8xl md:text-6xl sm:text-5xl text-4xl font-heading font-bold text-white mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              Turning Ideas into
              <br />
              <span className="gradient-text">Digital Reality</span>
            </motion.h1>

            <motion.p
              className="lg:text-2xl md:text-xl text-base text-white/80 mb-8 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              Techtide Co. delivers innovative IT solutions that transform businesses and drive digital excellence.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <Button
                asChild
                size="lg"
                className="gradient-bg glow-effect font-semibold text-lg px-8 group"
              >
                <Link to="/services" className="flex items-center">
                  Explore Services
                  <Rocket className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="glass-card border-2 border-white/30 text-black hover:bg-white hover:text-primary font-semibold text-lg px-8"
              >
                <Link to="/careers">Join Our Team</Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-4xl mx-auto"
          >
            {[
              { value: "500+", label: "Projects Delivered" },
              { value: "50+", label: "Expert Team" },
              { value: "98%", label: "Client Satisfaction" },
              { value: "24/7", label: "Support Available" },
            ].map((stat, i) => (
              <div key={i} className="glass-card p-6 rounded-xl">
                <div className="text-4xl font-bold text-white/90 mb-2">{stat.value}</div>
                <div className="text-white/70 text-sm">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Target className="h-6 w-6 text-white/70" />
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background relative overflow-hidden">
        <GeometricBackground />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-5xl sm:text-6xl font-heading font-bold mb-4 gradient-text">Our Services</h2>
              <p className="lg:text-xl text-base text-muted-foreground max-w-2xl mx-auto">Comprehensive technology solutions tailored to your business needs</p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <ScrollReveal key={index} delay={index * 0.1}>
                <Card className="gradient-border duration-300 group h-full shadow-md hover:-translate-y-1.5 hover:shadow-xl">
                  <CardContent className="p-8 text-center">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 360 }}
                      transition={{ duration: 0.6 }}
                      className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center`}
                    >
                      <feature.icon className="h-10 w-10 text-white" />
                    </motion.div>
                    <h3 className="text-2xl font-heading font-semibold mb-3 group-hover:gradient-text transition-all">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={0.6}>
            <div className="text-center mt-12">
              <Button asChild size="lg" className="gradient-bg glow-effect font-semibold text-lg px-8">
                <Link to="/all-services">View All Services</Link>
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-24 bg-secondary/50 relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-30" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-5xl sm:text-6xl font-heading font-bold mb-4 gradient-text">Why Choose Techtide Co.</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Your trusted technology partner for innovation and growth</p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyChooseUs.map((item, index) => (
              <ScrollReveal key={index} delay={index * 0.1} direction="up">
                <motion.div
                  whileHover={{ y: -10 }}
                  className="text-center p-8 rounded-2xl glass-card hover-lift group"
                >
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                    className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow"
                  >
                    <item.icon className="h-10 w-10 text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-heading font-semibold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Slider Section */}
      {/* <ProjectsSlider /> */}
    </div>
  );
};

export default Home;
