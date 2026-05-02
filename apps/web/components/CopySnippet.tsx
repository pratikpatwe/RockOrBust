"use client";

import { useState } from "react";
import { HugeiconsIcon } from '@hugeicons/react';
import { CopyIcon, CopyCheckIcon } from '@hugeicons/core-free-icons';

export function CopySnippet({ command, variant = "window" }: { command: string, variant?: "window" | "inline" }) {
  const [copied, setCopied] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; angle: number }[]>([]);

  const handleCopy = (e: React.MouseEvent) => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    
    // Create a particle burst at the exact mouse click location
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newParticles = Array.from({ length: 8 }).map((_, i) => ({
      id: Date.now() + i,
      x,
      y,
      angle: (i * 45) * (Math.PI / 180),
    }));
    
    setParticles(newParticles);
    
    setTimeout(() => setCopied(false), 2000);
    setTimeout(() => setParticles([]), 500); // Clear particles after animation
  };

  if (variant === "inline") {
    return (
      <div 
        className="flex items-center gap-3 bg-[#050505] border border-[#333] px-5 py-2.5 w-fit text-sm font-mono text-[#A3A3A3] cursor-pointer group relative overflow-hidden transition-colors hover:border-[#555]"
        onClick={handleCopy}
      >
        <span className="text-[#555] pointer-events-none">$</span> 
        <span className="text-white pointer-events-none">{command}</span>
        <button className="ml-4 text-[#A3A3A3] group-hover:text-[#FACC15] transition-colors cursor-pointer z-10 font-bold uppercase">
          {copied ? (
            <HugeiconsIcon icon={CopyCheckIcon} size={14} className="text-[#FACC15]" strokeWidth={2.5} />
          ) : (
            <HugeiconsIcon icon={CopyIcon} size={14} strokeWidth={2} />
          )}
        </button>
        {/* Particles */}
        {particles.map(p => (
          <span
            key={p.id}
            className="absolute block w-1.5 h-1.5 bg-[#FACC15] pointer-events-none"
            style={{
              left: p.x,
              top: p.y,
              animation: `particleBurst 0.5s ease-out forwards`,
              '--tx': `${Math.cos(p.angle) * 30}px`,
              '--ty': `${Math.sin(p.angle) * 30}px`,
            } as any}
          />
        ))}
      </div>
    );
  }

  return (
    <div 
      className="bg-[#0A0A0A] border border-[#333] p-4 font-mono text-sm group cursor-pointer relative overflow-hidden transition-colors hover:border-[#555]"
      onClick={handleCopy}
    >
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[#333]/50 pointer-events-none">
        <div className="flex gap-1.5"><div className="w-2 h-2 bg-[#333]"></div><div className="w-2 h-2 bg-[#333]"></div><div className="w-2 h-2 bg-[#333]"></div></div>
      </div>
      <div className="flex items-center justify-between pointer-events-none">
        <div>
          <span className="text-[#555] mr-2">$</span>
          <span className="text-white">{command}</span>
        </div>
        <button className="flex items-center gap-1.5 bg-[#111] text-[#A3A3A3] border border-[#333] px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-all group-hover:text-[#FACC15] group-hover:border-[#FACC15]/50 cursor-pointer z-10 pointer-events-auto font-bold uppercase">
          <HugeiconsIcon icon={copied ? CopyCheckIcon : CopyIcon} size={12} strokeWidth={2.5} />
          {copied ? "COPIED" : "COPY"}
        </button>
      </div>
      {/* Particles */}
      {particles.map(p => (
        <span
          key={p.id}
          className="absolute block w-1.5 h-1.5 bg-[#FACC15] pointer-events-none"
          style={{
            left: p.x,
            top: p.y,
            animation: `particleBurst 0.5s ease-out forwards`,
            '--tx': `${Math.cos(p.angle) * 40}px`,
            '--ty': `${Math.sin(p.angle) * 40}px`,
          } as any}
        />
      ))}
    </div>
  );
}
