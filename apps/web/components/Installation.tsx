"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from '@hugeicons/react';
import { Download01Icon } from '@hugeicons/core-free-icons';

import { CopySnippet } from "./CopySnippet";

export function Installation() {
  const [osName, setOsName] = useState("your OS");
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (userAgent.includes("win")) {
      setOsName("Windows");
    } else if (userAgent.includes("mac")) {
      setOsName("macOS");
    } else if (userAgent.includes("linux") || userAgent.includes("x11")) {
      setOsName("Linux");
    }
  }, []);

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    
    try {
      let osParam = 'windows';
      if (osName === 'macOS') osParam = 'darwin';
      if (osName === 'Linux') osParam = 'linux';

      let archParam = 'amd64';
      const ua = window.navigator.userAgent.toLowerCase();
      if (ua.includes('arm') || ua.includes('aarch64') || (ua.includes('mac') && !ua.includes('intel'))) {
        archParam = 'arm64';
      }

      const res = await fetch(`https://robapi.buildshot.xyz/api/cli/latest?os=${osParam}&arch=${archParam}`);
      
      if (!res.ok) throw new Error("Download currently unavailable");
      
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Download link not found");
      }
    } catch (e) {
      alert("Failed to fetch download link. Please try again later.");
      console.error(e);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <section className="w-full border-b border-dashed border-[#333]">
      {/* Top Half: 2 Columns for SDKs */}
      <div className="grid grid-cols-1 lg:grid-cols-2">
        
        {/* Header Cell */}
        <div className="lg:col-span-2 grid-cell-x py-12 border-b border-dashed border-[#333]">
          <h2 className="text-3xl font-semibold tracking-tight uppercase">Unified Installation</h2>
          <p className="text-[#A3A3A3] mt-2 max-w-2xl font-light">
            Choose your pillar. Run a residential node to contribute, or drop in the SDK to leverage the network in your Playwright scripts.
          </p>
        </div>

        {/* Tab 1: Extra Plugin */}
        <div className="border-b lg:border-b-0 lg:border-r border-dashed border-[#333] p-8 lg:p-12 flex flex-col hover:bg-[#050505] transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-medium uppercase">1. Extra Plugin</h3>
            <span className="text-white font-mono bg-[#222] px-2 py-1 text-xs border border-[#333]">NPM</span>
          </div>
          <p className="text-[#A3A3A3] mb-8 flex-1 font-light text-sm leading-relaxed">
            Modular plugin designed perfectly for existing puppeteer-extra or playwright-extra projects.
          </p>
          <CopySnippet command="npm i @rockorbust/extra-plugin" variant="window" />
        </div>

        {/* Tab 2: Playwright Native */}
        <div className="border-b border-dashed border-[#333] lg:border-b-0 p-8 lg:p-12 flex flex-col hover:bg-[#050505] transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-medium uppercase">2. Native SDK</h3>
            <span className="text-white font-mono bg-[#222] px-2 py-1 text-xs border border-[#333]">NPM</span>
          </div>
          <p className="text-[#A3A3A3] mb-8 flex-1 font-light text-sm leading-relaxed">
            Zero-dependency Playwright wrapper with built-in stealth mocks and residential routing.
          </p>
          <CopySnippet command="npm i @rockorbust/playwright-plugin" variant="window" />
        </div>

      </div>

      {/* Bottom Half: Full Width Go CLI Node */}
      <div id="download-cli" className="border-t border-dashed border-[#333]">
        <div className="p-8 lg:p-12 flex flex-col lg:flex-row items-center justify-between hover:bg-[#050505] transition-colors gap-8 lg:gap-12">
          
          <div className="flex-1 w-full">
            <div className="flex items-center gap-4 mb-4">
              <h3 className="text-xl font-medium uppercase">The Node (Go CLI)</h3>
              <span className="text-[#FACC15] font-mono bg-[#111] px-2 py-1 text-xs border border-[#FACC15]/20">BIN</span>
            </div>
            <p className="text-[#A3A3A3] font-light text-sm leading-relaxed max-w-xl">
              Contribute to the pool. A lightweight, cross-platform background daemon that routes traffic securely.
            </p>
          </div>

          <div className="w-full lg:w-auto shrink-0 relative">
            {/* Professional Wave Animation */}
            <style jsx>{`
              @keyframes ripple {
                0% { transform: scale(1); opacity: 0.5; }
                100% { transform: scale(1.15, 1.4); opacity: 0; }
              }
              .ripple-effect {
                position: absolute;
                inset: 0;
                background-color: #FACC15;
                pointer-events: none;
                animation: ripple 1s cubic-bezier(0, 0, 0.2, 1) infinite;
              }
            `}</style>
            
            <div className="relative group">
              {osName !== "your OS" && (
                <div className="absolute -inset-1 bg-[#FACC15]/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              )}
              
              {/* Trigger the ripples only when needed */}
              <div id="cli-ripple-container" className="hidden">
                <div className="ripple-effect"></div>
                <div className="ripple-effect [animation-delay:400ms]"></div>
              </div>

              <button 
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex items-stretch bg-[#FACC15] text-black font-bold uppercase tracking-wide w-full sm:w-auto hover:opacity-90 transition-opacity border border-[#FACC15] relative z-10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="px-4 sm:px-8 py-4 flex-1 text-center sm:whitespace-nowrap">
                  Download for {osName}
                </div>
                <div className="bg-black/10 px-5 flex items-center justify-center border-l border-black/20">
                  <HugeiconsIcon icon={Download01Icon} size={20} strokeWidth={2} />
                </div>
              </button>
            </div>
          </div>

        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        window.addEventListener('cli-scroll-finished', () => {
          const container = document.getElementById('cli-ripple-container');
          if (container) {
            container.classList.remove('hidden');
            setTimeout(() => container.classList.add('hidden'), 3000);
          }
        });
      `}} />
    </section>
  );
}
