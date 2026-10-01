import { useCallback, useEffect, useRef } from "react";
import dollAsset from "@/assets/pookie-doll.png.asset.json";

type Bubble = { x: number; y: number; radius: number };
type Mode = "perch" | "ground" | "chase" | "return";

const DOLL_W_DESKTOP = 100;
const DOLL_W_MOBILE = 76;

const VOICE_LINES: Record<string, string[]> = {
  perch: ["Comfy up here!", "Hehe, I'm sitting on the box!", "Wheee, up I go!"],
  ground: ["Boing! Down I go!", "La la la!", "Wiggle wiggle!"],
  wave: ["Hi bubble!", "Ooh, pretty bubble!", "Bubble, come play!"],
  candy: ["Yummy candy! Thank you!", "Mmm, so sweet!", "Candy! Yay!"],
};

const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)] ?? arr[0]!;

/** Speak with a cute high-pitched voice; cancels any queued line so lines never stutter or overlap. */
function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.pitch = 2;
  u.rate = 1.1;
  u.volume = 0.9;
  const voices = synth.getVoices();
  const female = voices.find((v) => /female|samantha|zira|google uk english female|victoria/i.test(v.name));
  if (female) u.voice = female;
  synth.speak(u);
}

/**
 * Interactive doll: perches on the dropzone top-right edge, hops down to the
 * viewport floor, chases bubbles, waves at nearby bubbles, breathes and sways
 * continuously, and speaks short lines when her activity changes.
 */
export function PookieDoll() {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const dollRef = useRef<HTMLImageElement>(null);
  const sparkRef = useRef<HTMLDivElement>(null);
  const candyRef = useRef<() => void>(() => {});

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
    let mode: Mode = "perch";
    let nextCycle = performance.now() + 10000 + Math.random() * 5000;
    let tilt = 0;
    let tiltVel = 0;
    let sparkUntil = 0;
    let waveUntil = 0;
    let waveCooldown = 0;
    let hop = 0; // 0..1 hop arc progress while travelling
    let target: { x: number; y: number } | null = null;
    let frame = 0;
    let started = false;

    const perchPos = () => {
      const r = anchor.getBoundingClientRect();
      const w = width();
      return { x: r.left - w / 2, y: r.top - w * 1.05 };
    };
    const groundPos = () => {
      const w = width();
      return { x: Math.min(window.innerWidth - w - 24, perchPos().x), y: window.innerHeight - w * 1.15 };
    };
    const bubbles = (): Bubble[] =>
      (window as unknown as { __pookieBubbles?: Bubble[] }).__pookieBubbles ?? [];

    const setMode = (m: Mode, line?: string[]) => {
      mode = m;
      hop = 0;
      if (line) speak(pick(line));
    };

    const burst = () => {
      sparkUntil = performance.now() + 200;
      tiltVel = 0.55;
    };

    candyRef.current = () => {
      burst();
      waveUntil = performance.now() + 900;
      speak(pick(VOICE_LINES.candy!));
    };

    const tick = (now: number) => {
      const w = width();
      if (!started) {
        const p = perchPos();
        x = p.x;
        y = p.y;
        started = true;
      }

      // Unpredictable activity cycle every 10–15s.
      if (!reduceMotion.matches && now >= nextCycle && (mode === "perch" || mode === "ground")) {
        nextCycle = now + 10000 + Math.random() * 5000;
        const r = Math.random();
        if (mode === "ground" && r < 0.5) setMode("perch", VOICE_LINES.perch);
        else if (mode === "perch" && r < 0.5) setMode("ground", VOICE_LINES.ground);
        else {
          const list = bubbles();
          const b = list[Math.floor(Math.random() * list.length)];
          if (b) {
            target = { x: b.x - w / 2, y: b.y - w / 2 };
            setMode("chase", VOICE_LINES.wave);
          } else setMode(mode === "perch" ? "ground" : "perch");
        }
      }

      const goal =
        mode === "chase" && target ? target : mode === "ground" ? groundPos() : perchPos();
      if (reduceMotion.matches) {
        x = goal.x;
        y = goal.y;
      } else {
        const ease = mode === "chase" ? 0.055 : 0.06;
        x += (goal.x - x) * ease;
        y += (goal.y - y) * ease;
      }
      const dist = Math.hypot(goal.x - x, goal.y - y);
      hop = dist > 4 ? Math.min(1, hop + 0.02) : 0;
      const hopLift = dist > 4 ? Math.sin(hop * Math.PI) * 30 : 0;

      const cx = x + w / 2;
      const cy = y + w / 2;
      if (mode === "chase") {
        let hit = false;
        for (const b of bubbles()) {
          if (Math.hypot(b.x - cx, b.y - cy) < b.radius + w * 0.42) hit = true;
        }
        if (hit || (target && dist < 6)) {
          burst();
          target = null;
          setMode("return");
        }
      } else if (mode === "return" && dist < 1.5) {
        mode = "perch";
      }

      // Bubble-proximity wave while resting.
      if ((mode === "perch" || mode === "ground") && now > waveCooldown) {
        for (const b of bubbles()) {
          if (Math.hypot(b.x - cx, b.y - cy) < b.radius + w * 0.9) {
            waveUntil = now + 900;
            waveCooldown = now + 6000;
            if (Math.random() < 0.4) speak(pick(VOICE_LINES.wave!));
            break;
          }
        }
      }

      tiltVel += -tilt * 0.12 - tiltVel * 0.14;
      tilt += tiltVel;

      const resting = mode === "perch" || mode === "ground";
      const breathe = reduceMotion.matches ? 0 : Math.sin(now / 900) * 0.025;
      const sway = reduceMotion.matches ? 0 : Math.sin(now / 1300) * (mode === "ground" ? 4 : 1.5);
      const wave = now < waveUntil ? Math.sin(now / 60) * 9 : 0;
      const bob = resting ? Math.sin(now / 700) * 3 : 0;

      layer.style.transform = `translate3d(${x}px, ${y + bob - hopLift}px, 0)`;
      layer.style.width = `${w}px`;
      doll.style.transform = `rotate(${tilt * 26 + sway + wave}deg) scale(${1 + Math.abs(tilt) * 0.12}, ${1 + breathe + Math.abs(tilt) * 0.12})`;
      spark.style.opacity = now < sparkUntil ? "1" : "0";
      spark.style.transform = `scale(${now < sparkUntil ? 1.15 : 0.6})`;

      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(frame);
      window.speechSynthesis?.cancel();
    };
  }, []);

  const giveCandy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    candyRef.current();
  }, []);

  return (
    <>
      <span ref={anchorRef} aria-hidden="true" className="pointer-events-none absolute right-4 top-0 h-0 w-0 sm:right-8" />
      <div
        ref={layerRef}
        className="pointer-events-none fixed left-0 top-0 z-10 w-[76px] will-change-transform sm:w-[100px]"
      >
        <div className="relative">
          <div
            ref={sparkRef}
            aria-hidden="true"
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
            aria-hidden="true"
            className="relative w-full origin-bottom select-none drop-shadow-[0_10px_18px_rgba(43,37,36,0.18)]"
          />
          <button
            type="button"
            onClick={giveCandy}
            className="pointer-events-auto absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-semibold text-foreground shadow-sm transition-transform hover:scale-105 active:scale-95"
          >
            🍬 Give Candy
          </button>
        </div>
      </div>
    </>
  );
}
