import { motion } from "framer-motion";

export default function AnimatedMessage({ message, isUser, isLatest = false }) {
  // Container styling depending on the sender
  const alignment = isUser ? "flex-end" : "flex-start";
  const bgStyle = isUser 
    ? { background: "var(--color-text-primary)", color: "var(--color-bg-base)" } 
    : { background: "var(--glass-bg)", color: "var(--color-text-primary)", backdropFilter: "var(--glass-blur)" };
    
  const fontClass = isUser ? "v2-msg-sans" : "serif-font v2-msg-serif";
  const borderStyle = isUser ? {} : { boxShadow: "var(--glass-border), var(--glass-shadow)" };

  return (
    <motion.div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: alignment,
        marginBottom: "1.5rem",
        width: "100%"
      }}
      initial={isLatest ? { opacity: 0, y: 20, scale: 0.97 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 100,
        damping: 20,
        mass: 0.8
      }}
    >
      <div 
        className={fontClass}
        style={{
           ...bgStyle,
           ...borderStyle,
           padding: "1rem 1.25rem",
           borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
           maxWidth: "85%",
           lineHeight: "1.6",
           fontSize: isUser ? "0.95rem" : "1.1rem",
        }}
      >
        {message}
      </div>
    </motion.div>
  );
}
