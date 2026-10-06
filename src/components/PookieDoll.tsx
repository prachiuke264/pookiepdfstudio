import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import dollAsset from "@/assets/pookie-doll.png.asset.json";

type Bubble = { x: number; y: number; radius: number };
type Mode = "perch" | "ground" | "chase" | "return";

const DOLL_W_DESKTOP = 150;
const DOLL_W_MOBILE = 114;
const FALLBACK_ASPECT_RATIO = 570 / 335;

const VOICE_LINES = {
  perch: ["Comfy up here!", "Hehe, I'm sitting on the box!", "Wheee, up I go!"],
  ground: ["Boing! Down I go!", "La la la!", "Wiggle wiggle!"],
  wave: ["Hi bubble!", "Ooh, pretty bubble!", "Bubble, come play!"],
};

// Feature-pitch announcements, spoken once on the visitor's first interaction.
const FEATURE_LINES = [
  "Hey Pookie! Welcome! Drop your PDF files here, and I will instantly convert them to fully editable Word documents for you!",
  "Wow, look at all these cool features! Did you know you can merge multiple files, compress heavy PDFs, and convert formats with absolutely zero hosting fees?",
  "Don't worry about server limits, Pookie! I deliver elite production-ready file conversions right here on our fast cloud network!",
  "Hi there! PookiePDF Studio can easily handle Word to PDF, image conversions, and document merging in just a few seconds. Try it out!",
];

const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)] ?? "";

/**
 * Interactive doll: perches on the dropzone top-right edge, hops down to the
 * viewport floor, chases bubbles, waves at nearby bubbles, breathes and sways
 * continuously, and speaks short lines when her activity changes.
 */
export function PookieDoll() {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const dollRef = useRef<HTMLDivElement>(null);
  const sparkRef = useRef<HTMLDivElement>(null);
  const speechIdRef = useRef(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !text) return;
    const synth = window.speechSynthesis;
    const speechId = speechIdRef.current + 1;
    speechIdRef.current = speechId;
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 1.5;
    utterance.rate = 1.1;
    utterance.volume = 0.9;
    const voices = synth.getVoices();
    const female = voices.find((voice) =>
      /female|samantha|zira|google uk english female|victoria/i.test(voice.name)
    );
    if (female) utterance.voice = female;

    utterance.onstart = () => {
      if (speechIdRef.current === speechId) setIsSpeaking(true);
    };
    const finish = () => {
      if (speechIdRef.current === speechId) setIsSpeaking(false);
    };
    utterance.onend = finish;
    utterance.onerror = finish;
    synth.speak(utterance);
  }, []);

  useEffect(() => {
    let blinkTimeout = 0;
    const blink = () => {
      setIsBlinking(true);
      blinkTimeout = window.setTimeout(() => setIsBlinking(false), 150);
    };
    const blinkInterval = window.setInterval(blink, 3000);
    return () => {
      window.clearInterval(blinkInterval);
      window.clearTimeout(blinkTimeout);
    };
  }, []);

  // One-shot feature announcement on the visitor's first interaction.
  useEffect(() => {
    let announced = false;
    const announce = () => {
      if (announced) return;
      announced = true;
      speak(pick(FEATURE_LINES));
      window.removeEventListener("pointerdown", announce);
      window.removeEventListener("keydown", announce);
      window.removeEventListener("touchstart", announce);
    };
    window.addEventListener("pointerdown", announce);
    window.addEventListener("keydown", announce);
    window.addEventListener("touchstart", announce, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", announce);
      window.removeEventListener("keydown", announce);
      window.removeEventListener("touchstart", announce);
    };
  }, [speak]);

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

    const dollHeight = () => width() * FALLBACK_ASPECT_RATIO;
    const perchPos = () => {
      const r = anchor.getBoundingClientRect();
      const w = width();
      return { x: r.left - w / 2, y: r.top - dollHeight() + 7 };
    };
    const groundPos = () => {
      const w = width();
      return {
        x: Math.max(20, Math.min(window.innerWidth - w - 20, perchPos().x)),
        y: window.innerHeight - dollHeight() - 34,
      };
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
      speak(pick(VOICE_LINES.candy));
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
            if (Math.random() < 0.4) speak(pick(VOICE_LINES.wave));
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
  }, [speak]);

  const giveCandy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    candyRef.current();
  }, []);

  return (
    <>
      <span
        ref={anchorRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-0 w-0 -translate-x-1/2"
      />
      <div
        ref={layerRef}
        className="pointer-events-none fixed left-0 top-0 z-50 w-[114px] will-change-transform sm:w-[150px]"
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
          <motion.div
            className="relative origin-bottom"
            animate={isSpeaking ? { y: [0, -1.5, 0], scale: [1, 1.008, 1] } : { y: 0, scale: 1 }}
            transition={
              isSpeaking
                ? { duration: 0.32, repeat: Infinity, ease: "easeInOut" }
                : { type: "spring", stiffness: 260, damping: 20 }
            }
          >
            <div ref={dollRef} className="relative origin-bottom">
              <img
                src={dollAsset.url}
                alt=""
                aria-hidden="true"
                className="relative w-full select-none drop-shadow-[0_10px_18px_rgba(43,37,36,0.18)]"
              />
              {["left-[38.5%]", "left-[54%]"].map((position) => (
                <motion.span
                  key={position}
                  aria-hidden="true"
                  className={`absolute ${position} top-[31.5%] h-[1.15%] w-[7.2%] origin-center rounded-full bg-foreground/75`}
                  animate={{ scaleY: isBlinking ? 1 : 0, opacity: isBlinking ? 0.78 : 0 }}
                  transition={{ duration: 0.07, ease: "easeInOut" }}
                />
              ))}
              <motion.span
                aria-hidden="true"
                className="absolute left-[47.1%] top-[39.2%] h-[1.6%] w-[5.2%] origin-center rounded-full bg-[#D9869A]/80"
                animate={
                  isSpeaking
                    ? { scaleY: [0.55, 1.6, 0.75, 1.35, 0.55], y: [0, 0.5, 0, 0.5, 0] }
                    : { scaleY: 0.45, y: 0 }
                }
                transition={
                  isSpeaking
                    ? { duration: 0.38, repeat: Infinity, ease: "easeInOut" }
                    : { duration: 0.12 }
                }
              />
            </div>
          </motion.div>
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
