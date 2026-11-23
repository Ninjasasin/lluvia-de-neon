import { useEffect, useRef } from 'react';
import { BACKGROUND_NAMES, type BackgroundTheme } from '../game/backgrounds';
import { SceneBackground } from '../render/background';

/** Fondo animado para las pantallas de menú. */
export function SceneBackdrop({ theme, animated }: { theme: BackgroundTheme; animated: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const background = new SceneBackground(theme);
    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    const start = performance.now();

    const paint = (now: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      background.draw(ctx, (now - start) / 1000, animated ? 1 : 0);
      const shade = ctx.createLinearGradient(0, 0, 0, height);
      shade.addColorStop(0, 'rgba(4, 11, 28, 0.25)');
      shade.addColorStop(1, 'rgba(4, 11, 28, 0.6)');
      ctx.fillStyle = shade;
      ctx.fillRect(0, 0, width, height);
    };
    const loop = (now: number) => {
      paint(now);
      raf = requestAnimationFrame(loop);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      background.resize(width, height, dpr);
      paint(performance.now());
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    if (animated) raf = requestAnimationFrame(loop);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [theme, animated]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      role="img"
      aria-label={`Fondo: ${BACKGROUND_NAMES[theme]}`}
    />
  );
}

interface ThumbProps {
  theme: BackgroundTheme;
  className?: string;
}

/** Tamaño de la escena que se reduce para la miniatura. */
const THUMB_SCENE = { width: 640, height: 400 };

/** Miniatura estática de un fondo, para el selector de la configuración. */
export function SceneThumbnail({ theme, className }: ThumbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const cssWidth = canvas.getBoundingClientRect().width || 160;
    const scale = (cssWidth / THUMB_SCENE.width) * Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(THUMB_SCENE.width * scale);
    canvas.height = Math.round(THUMB_SCENE.height * scale);
    const background = new SceneBackground(theme);
    background.resize(THUMB_SCENE.width, THUMB_SCENE.height, scale);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    background.draw(ctx, 0, 0);
  }, [theme]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
