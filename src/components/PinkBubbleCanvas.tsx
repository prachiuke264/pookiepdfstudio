import { useEffect, useRef } from "react";

type Bubble = {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  tint: number;
};

const BUBBLE_COUNT_DESKTOP = 16;
const BUBBLE_COUNT_MOBILE = 9;

export function PinkBubbleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let animationFrame = 0;
    let bubbles: Bubble[] = [];

    const bubbleColors = getComputedStyle(document.documentElement);
    const pinkLight = bubbleColors.getPropertyValue("--bubble-pink-light").trim();
    const pinkMid = bubbleColors.getPropertyValue("--bubble-pink-mid").trim();
    const pinkDeep = bubbleColors.getPropertyValue("--bubble-pink-deep").trim();
    const pinkBorder = bubbleColors.getPropertyValue("--bubble-pink-border").trim();
    const pinkSpecular = bubbleColors.getPropertyValue("--bubble-pink-specular").trim();

    const createBubble = (): Bubble => {
      const radius = 20 + Math.random() * 48;
      const speed = 1.7 + Math.random() * 2.2;
      const angle = Math.random() * Math.PI * 2;
      return {
        x: radius + Math.random() * Math.max(1, width - radius * 2),
        y: radius + Math.random() * Math.max(1, height - radius * 2),
        radius,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        tint: Math.random(),
      };
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const targetCount = width < 640 ? BUBBLE_COUNT_MOBILE : BUBBLE_COUNT_DESKTOP;
      bubbles = Array.from({ length: targetCount }, createBubble);
    };

    const drawBubble = (bubble: Bubble) => {
      context.save();
      context.beginPath();
      context.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);

      // Soft pastel rose-pink translucent radial mesh — light blush outer fringe
      const fill = context.createRadialGradient(
        bubble.x - bubble.radius * 0.34,
        bubble.y - bubble.radius * 0.38,
        bubble.radius * 0.05,
        bubble.x,
        bubble.y,
        bubble.radius
      );
      fill.addColorStop(0, pinkLight);
      fill.addColorStop(0.35, bubble.tint > 0.5 ? pinkMid : pinkLight);
      fill.addColorStop(0.78, pinkMid);
      fill.addColorStop(1, pinkDeep);
      context.fillStyle = fill;
      context.fill();

      // Dual-layered translucent white liquid border with internal drop shadow sheen
      // Outer translucent white border
      context.strokeStyle = pinkBorder;
      context.lineWidth = 1.4;
      context.shadowColor = "rgba(255, 255, 255, 0.35)";
      context.shadowBlur = 6;
      context.shadowOffsetX = 0;
      context.shadowOffsetY = 0;
      context.stroke();

      // Ultra-faint inner border for tactile water-droplet rim
      context.shadowBlur = 0;
      context.beginPath();
      context.arc(bubble.x, bubble.y, bubble.radius - 1.6, 0, Math.PI * 2);
      context.strokeStyle = "rgba(255, 255, 255, 0.18)";
      context.lineWidth = 0.8;
      context.stroke();

      // Crisp bright specular highlight near top-left inner edge (crystal-glass reflection)
      const specularX = bubble.x - bubble.radius * 0.38;
      const specularY = bubble.y - bubble.radius * 0.42;
      const specularR = Math.max(1, bubble.radius * 0.16);
      const specular = context.createRadialGradient(
        specularX,
        specularY,
        0,
        specularX,
        specularY,
        specularR
      );
      specular.addColorStop(0, pinkSpecular);
      specular.addColorStop(0.6, "rgba(255, 255, 255, 0.25)");
      specular.addColorStop(1, "rgba(255, 255, 255, 0)");
      context.beginPath();
      context.arc(specularX, specularY, specularR, 0, Math.PI * 2);
      context.fillStyle = specular;
      context.fill();

      // Soft elongated secondary gloss streak for added 3D glass depth
      const reflection = context.createLinearGradient(
        bubble.x - bubble.radius * 0.5,
        bubble.y - bubble.radius * 0.6,
        bubble.x + bubble.radius * 0.15,
        bubble.y + bubble.radius * 0.15
      );
      reflection.addColorStop(0, "rgba(255, 255, 255, 0.5)");
      reflection.addColorStop(0.45, "rgba(255, 255, 255, 0.1)");
      reflection.addColorStop(1, "rgba(255, 255, 255, 0)");
      context.beginPath();
      context.ellipse(
        bubble.x - bubble.radius * 0.22,
        bubble.y - bubble.radius * 0.28,
        bubble.radius * 0.12,
        bubble.radius * 0.26,
        Math.PI / 4,
        0,
        Math.PI * 2
      );
      context.fillStyle = reflection;
      context.fill();
      context.restore();
    };

    const render = () => {
      context.clearRect(0, 0, width, height);
      for (const bubble of bubbles) {
        if (!reduceMotion.matches) {
          bubble.x += bubble.vx;
          bubble.y += bubble.vy;

          if (bubble.x - bubble.radius <= 0 || bubble.x + bubble.radius >= width) {
            bubble.vx *= -1;
            bubble.x = Math.max(bubble.radius, Math.min(width - bubble.radius, bubble.x));
          }
          if (bubble.y - bubble.radius <= 0 || bubble.y + bubble.radius >= height) {
            bubble.vy *= -1;
            bubble.y = Math.max(bubble.radius, Math.min(height - bubble.radius, bubble.y));
          }
        }
        drawBubble(bubble);
      }
      animationFrame = window.requestAnimationFrame(render);
    };

    const handleVisibility = () => {
      window.cancelAnimationFrame(animationFrame);
      if (!document.hidden) animationFrame = window.requestAnimationFrame(render);
    };

    resize();
    render();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-screen w-screen"
    />
  );
}