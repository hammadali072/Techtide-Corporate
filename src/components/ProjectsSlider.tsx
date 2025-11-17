import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ExternalLink, Code } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Project {
  title: string;
  description: string;
  technologies: string[];
  image: string;
  gradient: string;
}

const projects: Project[] = [
  {
    title: "AI-Powered Analytics Platform",
    description: "Enterprise-grade analytics platform with real-time data processing and machine learning insights for Fortune 500 companies.",
    technologies: ["React", "Python", "TensorFlow", "AWS"],
    image: "📊",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    title: "Global E-Commerce Solution",
    description: "Scalable multi-vendor marketplace handling 1M+ daily transactions with advanced payment integration and inventory management.",
    technologies: ["Next.js", "Node.js", "PostgreSQL", "Stripe"],
    image: "🛒",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    title: "Smart IoT Healthcare System",
    description: "Connected medical devices platform with real-time monitoring, predictive analytics, and HIPAA-compliant data security.",
    technologies: ["React Native", "IoT", "Firebase", "ML"],
    image: "🏥",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    title: "Blockchain Financial Platform",
    description: "Decentralized finance application with smart contracts, cryptocurrency wallet integration, and secure transactions.",
    technologies: ["Web3", "Solidity", "React", "Ethereum"],
    image: "₿",
    gradient: "from-orange-500 to-yellow-500",
  },
  {
    title: "Cloud Infrastructure Management",
    description: "Multi-cloud orchestration platform for automated deployment, scaling, and monitoring across AWS, Azure, and GCP.",
    technologies: ["Kubernetes", "Docker", "Go", "Terraform"],
    image: "☁️",
    gradient: "from-indigo-500 to-blue-500",
  },
];

export const ProjectsSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8,
    }),
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex((prevIndex) => {
      let nextIndex = prevIndex + newDirection;
      if (nextIndex < 0) nextIndex = projects.length - 1;
      if (nextIndex >= projects.length) nextIndex = 0;
      return nextIndex;
    });
  };

  return (
    <section className="py-24 bg-gradient-to-b from-background to-secondary relative overflow-hidden">
      {/* Geometric Background */}
      <div className="absolute inset-0 grid-pattern opacity-50" />
      <div className="absolute top-20 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl sm:text-6xl font-heading font-bold mb-4 gradient-text">
            Our Featured Projects
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transforming businesses with cutting-edge technology solutions
          </p>
        </motion.div>

        <div className="relative max-w-6xl mx-auto">
          {/* Main Slider */}
          <div className="relative h-[500px] overflow-hidden">
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                  scale: { duration: 0.2 },
                }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={1}
                onDragEnd={(e, { offset, velocity }) => {
                  const swipe = swipePower(offset.x, velocity.x);
                  if (swipe < -swipeConfidenceThreshold) {
                    paginate(1);
                  } else if (swipe > swipeConfidenceThreshold) {
                    paginate(-1);
                  }
                }}
                className="absolute w-full"
              >
                <Card className="gradient-border hover-lift glow-effect overflow-hidden">
                  <CardContent className="p-0">
                    <div className="grid md:grid-cols-2 gap-0">
                      {/* Project Visual */}
                      <div className={`relative h-[500px] bg-gradient-to-br ${projects[currentIndex].gradient} flex items-center justify-center overflow-hidden`}>
                        <div className="absolute inset-0 grid-pattern opacity-20" />
                        <motion.div
                          animate={{ 
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, 0]
                          }}
                          transition={{ 
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          className="text-9xl relative z-10"
                        >
                          {projects[currentIndex].image}
                        </motion.div>
                      </div>

                      {/* Project Details */}
                      <div className="p-8 md:p-12 flex flex-col justify-center bg-card/50 backdrop-blur">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <h3 className="text-3xl font-heading font-bold mb-4 text-foreground">
                            {projects[currentIndex].title}
                          </h3>
                          <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
                            {projects[currentIndex].description}
                          </p>

                          {/* Technologies */}
                          <div className="mb-6">
                            <p className="text-sm font-semibold text-foreground mb-3">Technologies Used:</p>
                            <div className="flex flex-wrap gap-2">
                              {projects[currentIndex].technologies.map((tech, i) => (
                                <motion.span
                                  key={tech}
                                  initial={{ opacity: 0, scale: 0 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: 0.3 + i * 0.1 }}
                                  className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20"
                                >
                                  {tech}
                                </motion.span>
                              ))}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-3">
                            <Button className="gradient-bg group">
                              View Details
                              <ExternalLink className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                            <Button variant="outline" className="border-primary/50 hover:bg-primary/10">
                              <Code className="mr-2 h-4 w-4" />
                              Tech Stack
                            </Button>
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Buttons */}
          <Button
            variant="outline"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-background/80 backdrop-blur border-2 border-primary/30 hover:border-primary hover:bg-primary hover:text-primary-foreground shadow-lg"
            onClick={() => paginate(-1)}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-background/80 backdrop-blur border-2 border-primary/30 hover:border-primary hover:bg-primary hover:text-primary-foreground shadow-lg"
            onClick={() => paginate(1)}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {projects.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setDirection(index > currentIndex ? 1 : -1);
                  setCurrentIndex(index);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "w-8 bg-primary"
                    : "w-2 bg-primary/30 hover:bg-primary/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
