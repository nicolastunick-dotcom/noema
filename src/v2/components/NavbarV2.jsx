import { memo } from "react";
import { motion } from "framer-motion";
import NoemaLogo from "./NoemaLogo";

const NavbarV2 = memo(function NavbarV2({ rightControls, style, onNav }) {
  return (
    <nav style={{ 
      display: "flex", 
      justifyContent: "space-between", 
      alignItems: "center", 
      width: "100%",
      ...style 
    }}>
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring" }}
        style={{ cursor: "pointer" }}
        onClick={() => onNav && onNav("landing")}
      >
        <NoemaLogo size={32} />
      </motion.div>
      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
        {rightControls}
      </div>
    </nav>
  );
});

export default NavbarV2;
