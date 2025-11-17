import { motion, useInView } from "framer-motion";
import { useRef, ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  className?: string;
}

export const ScrollReveal = ({ 
  children, 
  delay = 0, 
  direction = "up",
  className = ""
}: ScrollRevealProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const directions = {
    up: { y: 50, x: 0 },
    down: { y: -50, x: 0 },
    left: { x: 50, y: 0 },
    right: { x: -50, y: 0 },
  };

  return (
    <motion.div
      ref={ref}
      initial={{ 
        opacity: 0,
        ...directions[direction]
      }}
      animate={isInView ? {
        opacity: 1,
        x: 0,
        y: 0
      } : {}}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.21, 0.45, 0.27, 0.9]
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
