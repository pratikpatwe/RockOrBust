"use client";

import { useEffect, useRef } from "react";
import { createAsciiRenderer } from "../lib/ascii";

export function AsciiArt() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const cleanup = createAsciiRenderer({
      canvas: canvasRef.current,
      imageSrc: "/hero-mask-icons.svg",
      chars: " 0123456789",
      fontSize: 8,
      fontFamily: '"JetBrains Mono", monospace',
      brightnessBoost: 1.2,
      posterize: 32,
      parallaxStrength: 15,
      scale: 1.0,
    });

    return () => {
      cleanup();
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none z-0 bg-[#FACC15]">
      <canvas ref={canvasRef} className="w-full h-full opacity-90" />
      
      {/* Central RockOrBust Logo (Hollow outline, Dark, No shadow) */}
      <div className="absolute z-10 text-[#111]">
        <svg width="70" height="70" viewBox="0 0 245 247" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14.9487 133.5L65.9487 10H219.449L139.449 84L223.449 236.5H180.449L108.949 133.5L35.9487 236.5H14.9487L54.9487 133.5H14.9487Z" stroke="currentColor" strokeWidth="12" />
        </svg>
      </div>
    </div>
  );
}
