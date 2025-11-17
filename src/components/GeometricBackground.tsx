import { motion } from "framer-motion";

export const GeometricBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Animated Grid */}
      <div className="absolute inset-0 grid-pattern opacity-30" />
      
      {/* Floating Circles */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-20 left-10 w-64 h-64 rounded-full bg-primary/20 blur-3xl"
      />
      
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-accent/20 blur-3xl"
      />

      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.25, 0.45, 0.25],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary/10 blur-3xl"
      />

      {/* Geometric Shapes */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-40 right-1/4 w-32 h-32 border-2 border-primary/20"
        style={{ transform: "rotate(45deg)" }}
      />

      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-40 left-1/4 w-24 h-24 border-2 border-accent/20 rounded-full"
      />

      {/* Floating Particles */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: "100vh", x: Math.random() * window.innerWidth, opacity: 0 }}
          animate={{ 
            y: "-100vh",
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 10 + Math.random() * 10,
            repeat: Infinity,
            delay: Math.random() * 10,
            ease: "linear"
          }}
          className="absolute w-1 h-1 bg-primary/40 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
          }}
        />
      ))}
    </div>
  );
};
