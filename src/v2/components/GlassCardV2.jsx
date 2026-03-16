import { motion } from "framer-motion";

export default function GlassCardV2({ children, className = "", delay = 0, style = {} }) {
  return (
    <motion.div
      className={`v2-glass-card ${className}`}
      initial={{ opacity: 0, scale: 0.95, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -15 }}
      transition={{ 
        type: "spring", 
        stiffness: 120, 
        damping: 20, 
        delay: delay 
      }}
      style={style}
    >
      {children}
    </motion.div>
  );
}
