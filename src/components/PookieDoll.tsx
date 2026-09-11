import { useEffect, useRef, useState } from "react";
import dollAsset from "@/assets/pookie-doll.png.asset.json";

/**
 * Decorative doll that "sits" on the top-right edge of the workspace card and
 * gently reacts when a background bubble drifts close to her.
 */
export function PookieDoll() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    let frame = 0;
    let cooldown = 0;

    const tick = () => {
      const el = wrapperRef.current;
      const bubbles = (window as unknown as {
        __pookieBubbles?: { x: number; y: number; radius: number }[];
      }).__pookieBubbles;

      if (el && bubbles && cooldown <= 0) {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const reach = Math.max(rect.width, rect.height) / 2 + 40;

        for (const b of bubbles) {
          const dx = b.x - cx;
          const dy = b.y - cy;
          if (Math.hypot(dx, dy) < reach + b.radius) {
            setPlaying(true);
            cooldown = 70;
            window.setTimeout(() => setPlaying(false), 700);
            break;
          }
        }
      }
      if (cooldown > 0) cooldown -= 1;
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      ref={wrapperRef}
      aria-hidden="true"
      className="pointer-events-none absolute -top-[86px] right-4 z-10 w-[76px] origin-bottom sm:-top-[112px] sm:right-8 sm:w-[100px]"
    >
      <img
        src={dollAsset.url}
        alt=""
        className={`w-full select-none drop-shadow-[0_10px_18px_rgba(43,37,36,0.18)] ${
          playing ? "animate-doll-play" : "animate-doll-idle"
        }`}
      />
    </div>
  );
}
