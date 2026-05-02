'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CanvasIcon, StarIcon, GitForkIcon, Download01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

// ---------- types ----------
interface DownloadStats {
  extraPlugin: number | null;
  nativeSdk: number | null;
  nodeCount: number | null;
}

// ---------- helpers ----------
function fmt(n: number | null): string {
  if (n === null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

async function fetchNpmDownloads(pkg: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.npmjs.org/downloads/point/last-month/${encodeURIComponent(pkg)}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.downloads ?? null;
  } catch {
    return null;
  }
}

// ---------- constants ----------
const STATS_URL = 'https://robapi.buildshot.xyz/api/stats/';
const CACHE_KEY = 'rob_live_stats';

function useLiveNodeCount() {
  const [count, setCount] = useState<number>(0);

  const fetchStats = async () => {
    try {
      // 1. Try to load from cache first for immediate UI feedback
      const cachedStr = localStorage.getItem(CACHE_KEY);
      if (cachedStr) {
        const cached = JSON.parse(cachedStr);
        setCount(cached.totalActiveNodes);
        // If cached within the last 30 seconds, don't fetch from server yet
        if (Date.now() - cached.timestamp < 30000) return;
      }

      const res = await fetch(STATS_URL);
      if (!res.ok) return;
      const data = await res.json();
      
      if (typeof data.totalActiveNodes === 'number') {
        setCount(data.totalActiveNodes);
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          totalActiveNodes: data.totalActiveNodes,
          timestamp: Date.now()
        }));
      }
    } catch (e) {
      console.error('Failed to fetch live stats:', e);
    }
  };

  useEffect(() => {
    fetchStats();
    // Poll every 30 seconds to stay under rate limits (10/min)
    const timer = setInterval(fetchStats, 30000);
    return () => clearInterval(timer);
  }, []);

  return count;
}

// ---------- component ----------
export function Header() {
  const [stats, setStats] = useState<DownloadStats>({
    extraPlugin: null,
    nativeSdk: null,
    nodeCount: null,
  });
  const [githubStats, setGithubStats] = useState({ stars: "0", forks: "0" });
  const nodeCount = useLiveNodeCount();

  useEffect(() => {
    (async () => {
      const [extraPlugin, nativeSdk] = await Promise.all([
        fetchNpmDownloads('@rockorbust/extra-plugin'),
        fetchNpmDownloads('@rockorbust/playwright-plugin'),
      ]);
      setStats({ extraPlugin, nativeSdk, nodeCount: null });
    })();

    // Fetch GitHub stats from client
    (async () => {
      try {
        const cachedStr = localStorage.getItem('rob_github_stats');
        if (cachedStr) {
          const cached = JSON.parse(cachedStr);
          if (cached.stars && cached.forks) {
            setGithubStats({ stars: cached.stars, forks: cached.forks });
          }
          // If cached within the last 60 seconds, don't fetch again
          if (cached.timestamp && Date.now() - cached.timestamp < 60000) {
            return;
          }
        }

        const res = await fetch("https://api.github.com/repos/pratikpatwe/RockOrBust");
        if (res.ok) {
          const data = await res.json();
          const newStats = {
            stars: fmt(data.stargazers_count),
            forks: fmt(data.forks_count),
            timestamp: Date.now(),
          };
          setGithubStats({ stars: newStats.stars, forks: newStats.forks });
          localStorage.setItem('rob_github_stats', JSON.stringify(newStats));
        }
      } catch (e) {
        // Fallback already handled by initial cache load
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full flex justify-center sticky top-0 z-50 pointer-events-none">
      <header className="w-full max-w-[1200px] mx-auto bg-black border-x border-b border-dashed border-[#333] px-4 py-3 flex items-center justify-between pointer-events-auto">

        {/* ── Left Side: Logo + Nav + Stats + GitHub ── */}
        <div className="flex items-center">
          {/* Logo */}
          <div className="text-[#FACC15] flex items-center shrink-0 mr-10">
            <svg width="22" height="22" viewBox="0 0 245 247" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14.9487 133.5L65.9487 10H219.449L139.449 84L223.449 236.5H180.449L108.949 133.5L35.9487 236.5H14.9487L54.9487 133.5H14.9487Z" stroke="currentColor" strokeWidth="20" />
            </svg>
          </div>

          <div className="hidden lg:flex items-center gap-10">
            {/* Nav Group */}
            <div className="flex items-center gap-2">
              <Link
                href="#"
                className="px-3 py-2 text-[#A3A3A3] hover:text-white transition-colors border border-transparent hover:border-[#333] hover:bg-[#111] uppercase tracking-wide text-xs whitespace-nowrap"
              >
                Documentation
              </Link>
              <Link
                href="https://github.com/pratikpatwe/RockOrBust/blob/main/CONTRIBUTING.md"
                target="_blank"
                className="px-3 py-2 text-[#A3A3A3] hover:text-white transition-colors border border-transparent hover:border-[#333] hover:bg-[#111] uppercase tracking-wide text-xs whitespace-nowrap"
              >
                Contribute
              </Link>
            </div>

            {/* Stats Group */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-0 border border-[#2a2a2a] bg-[#0a0a0a] text-[10px] font-mono uppercase tracking-wider shrink-0">
                <div className="px-2 py-1.5 text-[#FACC15] border-r border-[#2a2a2a] flex items-center">
                  <HugeiconsIcon icon={Download01Icon} size={14} strokeWidth={2.5} />
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1.5 border-r border-[#2a2a2a] text-[#A3A3A3]">
                  <span className="text-[#FACC15] font-bold">{fmt(stats.extraPlugin)}</span>
                  <span>extra</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1.5 text-[#A3A3A3]">
                  <span className="text-[#FACC15] font-bold">{fmt(stats.nativeSdk)}</span>
                  <span>sdk</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 border border-[#2a2a2a] bg-[#0a0a0a] text-[10px] font-mono uppercase tracking-wider text-[#A3A3A3] shrink-0">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-400 font-bold">{nodeCount.toLocaleString()}</span>
                <span>nodes</span>
              </div>
            </div>

            {/* GitHub Stars/Forks */}
            <div className="flex items-center gap-4 text-[#A3A3A3] font-mono uppercase text-[11px] shrink-0 border-r border-[#333] border-dashed pr-10">
              <a href="https://github.com/pratikpatwe/RockOrBust" target="_blank" rel="noreferrer" className="hover:text-[#FACC15] flex items-center gap-1.5 transition-colors">
                <HugeiconsIcon icon={StarIcon} size={14} strokeWidth={2} />
                {githubStats.stars}
              </a>
              <a href="https://github.com/pratikpatwe/RockOrBust/network/members" target="_blank" rel="noreferrer" className="hover:text-white flex items-center gap-1.5 transition-colors">
                <HugeiconsIcon icon={GitForkIcon} size={14} strokeWidth={2} />
                {githubStats.forks}
              </a>
            </div>
          </div>
        </div>

        {/* ── Right Side: CTA Buttons ── */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="#download-cli"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('download-cli')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('cli-scroll-finished'));
              }, 800);
            }}
            className="hidden sm:block px-3 py-2 text-[#A3A3A3] hover:text-white transition-colors border border-transparent hover:border-[#333] hover:bg-[#111] uppercase tracking-wide text-xs whitespace-nowrap"
          >
            Download CLI
          </a>

          <button 
            onClick={() => document.getElementById('visualizer')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
            className="flex items-center gap-2 bg-[#FACC15] text-black font-bold uppercase tracking-wide px-4 py-2 hover:bg-[#EAB308] transition-colors border border-[#FACC15] text-xs whitespace-nowrap shrink-0"
          >
            <HugeiconsIcon icon={CanvasIcon} size={14} strokeWidth={2.5} />
            Visualize Network
          </button>
        </div>

      </header>
    </div>
  );
}
