import { useEffect } from "react";

const MOBILE_MAX_WIDTH_PX = 639;
const MIN_FONT_SIZE_PX = 12;

export const useFitText = (ref, deps = []) => {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const element = ref.current;
    if (!element) return;

    let resizeObserver;

    const fit = () => {
      if (!element) return;
      if (window.innerWidth > MOBILE_MAX_WIDTH_PX) {
        element.style.fontSize = "";
        return;
      }

      element.style.fontSize = "";
      const computed = window.getComputedStyle(element);
      let size = parseFloat(computed.fontSize);
      const available = element.clientWidth;
      if (!available || !size) return;

      while (element.scrollWidth > available && size > MIN_FONT_SIZE_PX) {
        size -= 1;
        element.style.fontSize = `${size}px`;
      }
    };

    const onResize = () => fit();
    const raf = window.requestAnimationFrame(fit);
    window.addEventListener("resize", onResize);

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(onResize);
      resizeObserver.observe(element);
    }

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, deps);
};
