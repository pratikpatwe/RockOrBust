'use client';

import React, { useState, useEffect } from 'react';
import { 
  ComposableMap, 
  Geographies, 
  Geography, 
  Marker,
  ZoomableGroup
} from 'react-simple-maps';
import { 
  Cancel01Icon, 
  MaximizeScreenIcon, 
  MinimizeScreenIcon, 
  Refresh04Icon, 
  ZoomInAreaIcon, 
  ZoomOutAreaIcon 
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

// TopoJSON for the world map
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const API_BASE = 'https://robapi.buildshot.xyz/api/stats';

// ---------- types ----------
interface NodeLocation {
  country: string;
  city: string;
  ll: [number, number];
}

interface Node {
  id: string;
  latency: number;
  tier: 'fast' | 'medium' | 'slow';
  location: NodeLocation;
}

// ---------- component ----------
export function Visualizer() {
  const [robKey, setRobKey] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [globalCount, setGlobalCount] = useState(0);
  const [hoveredNode, setHoveredNode] = useState<Node[] | Node | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Node[] | null>(null);
  const [viewMode, setViewMode] = useState<'global' | 'user'>('global');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [position, setPosition] = useState({ coordinates: [0, 0] as [number, number], zoom: 1 });

  // Fetch initial global mesh data
  useEffect(() => {
    fetchGlobalStats();
    const interval = setInterval(fetchGlobalStats, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchGlobalStats = async () => {
    try {
      const res = await fetch(API_BASE);
      const data = await res.json();
      if (data.nodes && viewMode === 'global') {
        setNodes(data.nodes);
        setGlobalCount(data.totalActiveNodes);
      }
    } catch (e) {
      console.error('Failed to fetch global network stats');
    }
  };

  const isValidKey = robKey.startsWith('rob_');

  const handleScan = async () => {
    if (!isValidKey) return;
    
    setIsScanning(true);
    setSelectedGroup(null); // Close panel on new scan
    try {
      const res = await fetch(`${API_BASE}/${robKey}`);
      const data = await res.json();
      
      // Artificial delay for the "Cool Scan" effect
      setTimeout(() => {
        setNodes(data.nodes || []);
        setViewMode('user');
        setIsScanning(false);
      }, 1500);
    } catch (e) {
      setIsScanning(false);
    }
  };

  const handleZoomIn = () => {
    if (position.zoom >= 6) return;
    setPosition(pos => ({ ...pos, zoom: pos.zoom * 1.5 }));
  };

  const handleZoomOut = () => {
    if (position.zoom <= 1) return;
    setPosition(pos => ({ ...pos, zoom: pos.zoom / 1.5 }));
  };

  const handleReset = () => {
    setPosition({ coordinates: [0, 0], zoom: 1 });
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <section id="visualizer" className={`w-full border-b border-dashed border-[#333] transition-all duration-500 ${isFullscreen ? 'fixed inset-0 z-[100] bg-[#050505]' : 'relative'}`}>
      
      {!isFullscreen && (
        <div className="py-12 border-b border-dashed border-[#333] px-8 lg:px-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight uppercase">Network Visualizer</h2>
            <p className="text-[#A3A3A3] mt-2 max-w-2xl font-light text-sm leading-relaxed">
              Real-time geographic analysis of the RockOrBust residential mesh. {viewMode === 'global' ? 'Viewing live global distribution.' : 'Viewing your private node pool.'}
            </p>
          </div>
        </div>
      )}

      <div className={`${isFullscreen ? 'h-full p-0 flex flex-col' : 'p-8 lg:p-12'}`}>
        
        {!isFullscreen && (
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-12">
            <div className="relative flex-1 w-full">
              <input 
                type="text" 
                value={robKey}
                onChange={(e) => setRobKey(e.target.value)}
                placeholder="rob_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                className="w-full bg-transparent border-b border-[#333] py-2 font-mono text-sm text-white focus:outline-none focus:border-[#FACC15] placeholder:text-[#222] transition-colors"
              />
            </div>
            <button 
              onClick={handleScan}
              disabled={isScanning || !isValidKey}
              className="w-full sm:w-auto px-8 py-2 border border-[#333] hover:border-[#FACC15] hover:text-[#FACC15] transition-all font-mono text-xs uppercase tracking-[widest] disabled:opacity-10 disabled:cursor-not-allowed"
            >
              {isScanning ? "SCANNING" : "VISUALIZE"}
            </button>
          </div>
        )}

        {/* Minimalist Visualizer Canvas */}
        <div className={`relative w-full border border-[#333] border-dashed overflow-hidden flex group flex-1
          ${isFullscreen ? 'border-none h-full' : 'aspect-[16/9] lg:aspect-[21/9] bg-[#050505]'}
        `}>
          
          {/* Main Map Area */}
          <div className="flex-1 relative overflow-hidden flex flex-col">
            {/* Map Layer */}
            <div className="absolute inset-0 opacity-40">
              <ComposableMap projection="geoMercator" projectionConfig={{ scale: isFullscreen ? 180 : 140 }}>
                <ZoomableGroup
                  zoom={position.zoom}
                  center={position.coordinates}
                  onMoveEnd={setPosition}
                >
                  <Geographies geography={geoUrl}>
                    {({ geographies }: { geographies: any[] }) =>
                      geographies.map((geo) => (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill="#111"
                          stroke="#222"
                          strokeWidth={0.5}
                          style={{
                            default: { outline: "none" },
                            hover: { outline: "none" },
                            pressed: { outline: "none" },
                          }}
                        />
                      ))
                    }
                  </Geographies>

                  {!isScanning && Object.entries(
                    nodes.reduce((acc, node) => {
                      const key = node.location?.ll ? node.location.ll.join(',') : 'unknown';
                      if (!acc[key]) acc[key] = [];
                      acc[key].push(node);
                      return acc;
                    }, {} as Record<string, Node[]>)
                  ).map(([coords, group]) => {
                    if (coords === 'unknown' || !group[0].location?.ll) return null;
                    const [lat, lng] = group[0].location.ll;
                    const isCluster = group.length > 1;
                    const avgLatency = group.reduce((sum, n) => sum + n.latency, 0) / group.length;
                    
                    let color = '#10b981';
                    if (avgLatency > 150) color = '#eab308';
                    if (avgLatency > 450) color = '#ef4444';
                    if (viewMode === 'global') color = '#444';

                    const baseRadius = nodes.length < 10 ? 5 : nodes.length < 30 ? 3 : 2;
                    const r = viewMode === 'user' ? baseRadius * 1.2 : baseRadius;

                    return (
                      <Marker key={`${coords}`} coordinates={[lng, lat]}>
                        <g 
                          className="cursor-pointer transition-all duration-300 hover:scale-110"
                          onMouseEnter={() => setHoveredNode(group)}
                          onMouseLeave={() => setHoveredNode(null)}
                          onClick={() => setSelectedGroup(group)}
                        >
                          {isCluster && (
                            <circle r={r + 4} fill="none" stroke={color} strokeWidth={1} strokeDasharray="2 2" className="animate-[spin_10s_linear_infinite]" />
                          )}
                          <circle r={r} fill={color} />
                          {isCluster && (
                            <text y={-(r + 8)} textAnchor="middle" className="fill-white font-mono font-bold select-none pointer-events-none" style={{ fontSize: '8px' }}>
                              {group.length}
                            </text>
                          )}
                        </g>
                      </Marker>
                    );
                  })}
                </ZoomableGroup>
              </ComposableMap>
            </div>

            {/* Map Controls */}
            <div className={`absolute top-8 left-8 flex flex-col gap-2 z-40 transition-all duration-500 ${isFullscreen ? 'top-12 left-12' : ''}`}>
              <button onClick={handleZoomIn} className="w-8 h-8 flex items-center justify-center bg-black/80 backdrop-blur border border-[#333] hover:border-[#FACC15] text-[#A3A3A3] hover:text-[#FACC15] transition-all">
                <HugeiconsIcon icon={ZoomInAreaIcon} size={16} strokeWidth={2} />
              </button>
              <button onClick={handleZoomOut} className="w-8 h-8 flex items-center justify-center bg-black/80 backdrop-blur border border-[#333] hover:border-[#FACC15] text-[#A3A3A3] hover:text-[#FACC15] transition-all">
                <HugeiconsIcon icon={ZoomOutAreaIcon} size={16} strokeWidth={2} />
              </button>
              <button onClick={handleReset} className="w-8 h-8 flex items-center justify-center bg-black/80 backdrop-blur border border-[#333] hover:border-[#FACC15] text-[#A3A3A3] hover:text-[#FACC15] transition-all">
                <HugeiconsIcon icon={Refresh04Icon} size={16} strokeWidth={2} />
              </button>
              <button onClick={toggleFullscreen} className="w-8 h-8 flex items-center justify-center bg-black/80 backdrop-blur border border-[#333] hover:border-[#FACC15] text-[#A3A3A3] hover:text-[#FACC15] transition-all">
                <HugeiconsIcon icon={isFullscreen ? MinimizeScreenIcon : MaximizeScreenIcon} size={16} strokeWidth={2} />
              </button>
            </div>

            {isScanning && (
              <div className="absolute inset-y-0 w-[2px] bg-[#FACC15] shadow-[0_0_15px_#FACC15] z-30 pointer-events-none" style={{ animation: 'radar-sweep 1.5s linear infinite', left: '-2px' }}></div>
            )}

            {/* Minimal Tooltip (Hidden when panel is open) */}
            {hoveredNode && !selectedGroup && (
              <div className="absolute pointer-events-none bg-black border border-[#333] p-3 font-mono z-50 transition-all duration-75" style={{ left: `calc(50% + 20px)`, top: `calc(50% - 20px)` }}>
                {Array.isArray(hoveredNode) ? (
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-white font-bold uppercase tracking-wider">{hoveredNode.length} NODES DETECTED</span>
                    <span className="text-[9px] text-[#A3A3A3] uppercase tracking-wider">{hoveredNode[0].location.city}, {hoveredNode[0].location.country}</span>
                    <span className="text-[10px] text-[#FACC15] font-bold mt-1">AVG: {Math.round(hoveredNode.reduce((s, n) => s + n.latency, 0) / hoveredNode.length)}MS</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-white font-bold">{hoveredNode.latency ? `${hoveredNode.latency}MS` : 'PENDING'}</span>
                    <span className="text-[9px] text-[#A3A3A3] uppercase tracking-wider">{hoveredNode.location.city}, {hoveredNode.location.country}</span>
                    <span className="text-[8px] text-[#555] uppercase tracking-tighter mt-1">ID: {hoveredNode.id}</span>
                  </div>
                )}
              </div>
            )}

            {/* Big Number Stats Overlay */}
            {!isScanning && (
              <div className={`absolute bottom-8 right-8 flex flex-col items-end pointer-events-none font-mono transition-all duration-500 ${isFullscreen ? 'bottom-12 right-12' : ''}`}>
                <div className="text-5xl font-bold text-white leading-none">
                  {viewMode === 'global' ? globalCount : nodes.length}
                </div>
              </div>
            )}
          </div>

          {/* Side Panel (Non-disturbing Push Layout) */}
          <div className={`h-full bg-black/80 backdrop-blur-xl border-l border-[#333] z-50 transition-all duration-500 flex flex-col overflow-hidden
            ${selectedGroup ? 'w-full sm:w-[350px] opacity-100' : 'w-0 opacity-0 border-none'}
          `}>
            {selectedGroup && (
              <div className="w-[350px] h-full flex flex-col">
                <div className="p-8 border-b border-[#333] flex justify-between items-center shrink-0">
                  <div>
                    <h3 className="text-white font-bold uppercase tracking-widest text-sm truncate max-w-[180px]">{selectedGroup[0].location.city}</h3>
                    <p className="text-[#A3A3A3] text-[10px] uppercase tracking-tighter mt-1">{selectedGroup.length} Nodes in Region</p>
                  </div>
                  <button onClick={() => setSelectedGroup(null)} className="text-[#555] hover:text-white transition-colors">
                    <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={2} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  <div className="flex flex-col gap-2">
                    {selectedGroup.map((node) => (
                      <div key={node.id} className="p-4 border border-[#222] bg-[#111]/50 hover:border-[#333] transition-colors group">
                        <div className="flex justify-between items-center mb-2">
                          <span className={`w-1.5 h-1.5 rounded-full 
                            ${node.tier === 'fast' ? 'bg-emerald-500' : node.tier === 'medium' ? 'bg-yellow-500' : 'bg-red-500'}
                          `}></span>
                          <span className="text-white font-mono text-[10px] font-bold">{node.latency}MS</span>
                        </div>
                        <div className="text-[9px] text-[#555] font-mono group-hover:text-[#A3A3A3] transition-colors truncate">ID: {node.id}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
