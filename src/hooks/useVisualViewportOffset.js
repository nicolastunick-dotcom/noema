import { useEffect, useState } from "react";

export function useVisualViewportOffset() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return undefined;

    const viewport = window.visualViewport;
    const update = () => {
      const keyboardOffset = window.innerHeight - viewport.height - viewport.offsetTop;
      setOffset(Math.max(0, Math.round(keyboardOffset)));
    };

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    window.addEventListener("orientationchange", update);

    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return offset;
}
