import { useEffect, useRef } from "react";
import dollAsset from "@/assets/pookie-doll.png.asset.json";

type Bubble = { x: number; y: number; radius: number };

type Mode = "home" | "chase" | "return";

const DOLL_W_DESKTOP = 100;
const DOLL_W_MOBILE = 76;

/**
 * Fully dynamic doll: rests on the top-right border edge of the dropzone
 * (its home base node), then periodically roams the viewport to chase the
 * background bubbles, sparkles on contact, and glides back home.
 */
export function PookieDoll() {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const dollRef = useRef<HTMLImageElement>(null);
  const sparkRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const anchor = anchorRef.current;
    const layer = layerRef.current;
    const doll = dollRef.current;
    const spark = sparkRef.current;
    if (!anchor || !layer || !doll || !spark) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const width = () => (window.innerWidth < 640 ? DOLL_W_MOBILE : DOLL_W_DESKTOP);
    let x = 0;
    let y = 0;
    let mode: Mode = "home";
    let nextTrip = performance.now() + 4000 + Math.random() * 3000;
    let tilt = 0;
    let tiltVel = 0;
    let sparkUntil = 0;
    let target: { x: number; y: number } | null = null;
    let frame = 0;
    let started = false;

    const home = () => {
      const r = anchor.getBoundingClientRect();
      const w = width();
      return { x: r.left - w / 2, y: r.top - w * 1.05 };
    };

    const bubbles = (): Bubble[] =>
      (window as unknown as { __pookieBubbles?: Bubble[] }).__pookieBubbles ?? [];

    const pickTarget = () => {
      const list = bubbles();
      if (!list.length) return null;
      const b = list[Math.floor(Math.random() * list.length)];
      if (!b) return null;
      return { x: b.x - width() / 2, y: b.y - width() / 2 };
    };

    const burst = () => {
      sparkUntil = performance.now() + 200;
      tiltVel = 0.55;
    };

    const tick = (now: number) => {
      const w = width();
      const base = home();

      if (!started) {
        x = base.x;
        y = base.y;
        started = true;
      }

      if (reduceMotion.matches) {
        mode = "home";
      } else if (mode === "home" && now >= nextTrip) {
        target = pickTarget();
        if (target) mode = "chase";
        nextTrip = now + 15000 + Math.random() * 5000;
      }

      let goal = base;
      if (mode === "chase" && target) goal = target;
      if (mode === "return") goal = base;

      const ease = mode === "chase" ? 0.055 : 0.075;
      x += (goal.x - x) * ease;
      y += (goal.y - y) * ease;

      // Collision with any bubble while roaming.
      if (mode === "chase") {
        const cx = x + w / 2;
        const cy = y + w / 2;
        for (const b of bubbles()) {
          if (Math.hypot(b.x - cx, b.y - cy) < b.radius + w * 0.42) {
            burst();
            mode = "return";
            target = null;
            break;
          }
        }
        if (mode === "chase" && target && Math.hypot(target.x - x, target.y - y) < 6) {
          burst();
          mode = "return";
          target = null;
        }
      } else if (mode === "return" && Math.hypot(base.x - x, base.y - y) < 1.5) {
        mode = "home";
      }

      // Spring tilt.
      tiltVel += -tilt * 0.12 - tiltVel * 0.14;
      tilt += tiltVel;
      const bob = mode === "home" ? Math.sin(now / 700) * 3 : 0;

      layer.style.transform = `translate3d(${x}px, ${y + bob}px, 0)`;
      layer.style.width = `${w}px`;
      doll.style.transform = `rotate(${tilt * 26}deg) scale(${1 + Math.abs(tilt) * 0.12})`;
      spark.style.opacity = now < sparkUntil ? "1" : "0";
      spark.style.transform = `scale(${now < sparkUntil ? 1.15 : 0.6})`;

      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <>
      <span ref={anchorRef} aria-hidden="true" className="pointer-events-none absolute right-4 top-0 h-0 w-0 sm:right-8" />
      <div
        ref={layerRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-10 w-[76px] will-change-transform sm:w-[100px]"
      >
        <div className="relative">
          <div
            ref={sparkRef}
            className="pointer-events-none absolute inset-[-25%] opacity-0 transition-opacity duration-150"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.95) 0%, rgba(247,177,193,0.55) 35%, rgba(247,177,193,0) 70%)",
            }}
          />
          <img
            ref={dollRef}
            src={dollAsset.url}
            alt=""
            className="relative w-full select-none drop-shadow-[0_10px_18px_rgba(43,37,36,0.18)]"
          />
        </div>
      </div>
    </>
  );
}
