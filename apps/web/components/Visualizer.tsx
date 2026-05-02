'use client';

import React, { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Search01Icon } from '@hugeicons/core-free-icons';

// ---------- types ----------
interface Node {
  id: string;
  latency: number;
  tier: 'fast' | 'medium' | 'slow';
  x: number; // random 0-100%
  y: number; // random within its tier band
}

// ---------- helpers ----------
const generateMockNodes = (count: number): Node[] => {
  return Array.from({ length: count }).map(() => {
    const latency = Math.floor(Math.random() * 800) + 20;
    let tier: 'fast' | 'medium' | 'slow' = 'fast';
    let yBase = 15; // Top area
    
    if (latency > 150) {
      tier = 'medium';
      yBase = 50; // Middle area
    }
    if (latency > 400) {
      tier = 'slow';
      yBase = 85; // Bottom area
    }

    return {
      id: `NODE-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      latency,
      tier,
      x: Math.random() * 90 + 5, // Keep away from edges
      y: yBase + (Math.random() * 20 - 10), // Add some jitter
    };
  });
};

// ---------- component ----------
export function Visualizer() {
  const [robKey, setRobKey] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);

  const handleScan = () => {
    if (!robKey.startsWith('rob_')) {
      alert('Please enter a valid ROB key (rob_...)');
      return;
    }
    
    setIsScanning(true);
    setNodes([]);
    
    setTimeout(() => {
      setNodes(generateMockNodes(Math.floor(Math.random() * 15) + 10));
      setIsScanning(false);
    }, 1200);
  };

  return (
    <section className="w-full border-b border-dashed border-[#333]">
      {/* Standard Section Header */}
      <div className="py-12 border-b border-dashed border-[#333] px-8 lg:px-12">
        <h2 className="text-3xl font-semibold tracking-tight uppercase">Network Visualizer</h2>
        <p className="text-[#A3A3A3] mt-2 max-w-2xl font-light text-sm leading-relaxed">
          Real-time spectral analysis of your residential node pool. Enter your ROB key to visualize current mesh topology and node latencies.
        </p>
      </div>

      <div className="p-8 lg:p-12">
        {/* Minimalist Input */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-12">
          <div className="relative flex-1 w-full">
            <input 
              type="text" 
              value={robKey}
              onChange={(e) => setRobKey(e.target.value)}
              placeholder="ENTER ROB KEY..."
              className="w-full bg-transparent border-b border-[#333] py-2 font-mono text-sm text-white focus:outline-none focus:border-[#FACC15] placeholder:text-[#333] transition-colors"
            />
          </div>
          <button 
            onClick={handleScan}
            disabled={isScanning}
            className="w-full sm:w-auto px-8 py-2 border border-[#333] hover:border-[#FACC15] hover:text-[#FACC15] transition-all font-mono text-xs uppercase tracking-widest disabled:opacity-30"
          >
            {isScanning ? "SCANNING..." : "VISUALIZE_NODES"}
          </button>
        </div>

        {/* Minimalist Visualizer Canvas */}
        <div className="relative w-full aspect-[16/9] lg:aspect-[21/9] bg-[#050505] border border-[#333] border-dashed overflow-hidden flex flex-col justify-between group">
          
          {/* Ruler Grid (Subtle Lines) */}
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
               style={{ 
                 backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
                 backgroundSize: '100px 50px' 
               }}>
          </div>

          {/* Tier Counts (No Labels) */}
          <div className="absolute left-12 top-12 flex items-center select-none">
            {nodes.length > 0 && <span className="text-emerald-500 font-mono text-3xl font-bold leading-none">{nodes.filter(n => n.tier === 'fast').length}</span>}
          </div>
          <div className="absolute left-12 top-1/2 -translate-y-1/2 flex items-center select-none">
            {nodes.length > 0 && <span className="text-yellow-500 font-mono text-3xl font-bold leading-none">{nodes.filter(n => n.tier === 'medium').length}</span>}
          </div>
          <div className="absolute left-12 bottom-12 flex items-center select-none">
            {nodes.length > 0 && <span className="text-red-500 font-mono text-3xl font-bold leading-none">{nodes.filter(n => n.tier === 'slow').length}</span>}
          </div>

          {nodes.length === 0 && !isScanning && (
            <div className="absolute inset-0 flex items-center justify-center text-[#222]">
              <span className="font-mono text-[10px] uppercase tracking-[0.4em]">Awaiting Key Input</span>
            </div>
          )}

          {isScanning && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 border border-[#FACC15] border-t-transparent animate-spin"></div>
            </div>
          )}

          {/* Render Nodes */}
          {nodes.map((node) => {
            const dotSize = nodes.length < 15 ? 'w-3 h-3' : nodes.length < 30 ? 'w-2 h-2' : 'w-1.5 h-1.5';
            return (
              <div 
                key={node.id}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                className={`absolute ${dotSize} transition-all duration-1000 cursor-pointer hover:scale-150 z-10 rounded-full
                  ${node.tier === 'fast' ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' : ''}
                  ${node.tier === 'medium' ? 'bg-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.5)]' : ''}
                  ${node.tier === 'slow' ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]' : ''}
                `}
                style={{ 
                  left: `${node.x}%`, 
                  top: `${node.y}%`,
                  opacity: isScanning ? 0 : 1 
                }}
              />
            );
          })}

          {/* Minimal Tooltip */}
          {hoveredNode && (
            <div 
              className="absolute pointer-events-none bg-black border border-[#333] p-3 font-mono z-50 transition-all duration-75"
              style={{ 
                left: `calc(${hoveredNode.x}% + 12px)`,
                top: `calc(${hoveredNode.y}% - 20px)`
              }}
            >
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-white font-bold">{hoveredNode.latency}MS</span>
                <span className="text-[8px] text-[#555] uppercase tracking-tighter">{hoveredNode.id}</span>
              </div>
            </div>
          )}

          {/* Bottom-Right Stats Overlay */}
          {nodes.length > 0 && (
            <div className="absolute bottom-8 right-8 flex flex-col items-end pointer-events-none font-mono">
              <div className="text-5xl font-bold text-white leading-none">{nodes.length}</div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
