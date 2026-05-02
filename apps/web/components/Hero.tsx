"use client";

import { CopySnippet } from "./CopySnippet";
import Image from "next/image";
import { CanvasIcon, ArrowRight01Icon, Download01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function Hero() {
  return (
    <section className="w-full flex flex-col border-y border-dashed border-[#333]">

      {/* Full-width Badge Row (Touches the top dashed border) */}
      <div className="w-full flex items-center text-xs font-medium text-[#A3A3A3] border-b border-dashed border-[#333]">
        <div className="bg-[#111] px-4 py-2 flex items-center gap-2 border-r border-dashed border-[#333]">
          <span className="w-2 h-2 bg-[#FACC15]"></span>
          Update
        </div>
        <div className="bg-[#050505] px-4 py-2 h-full text-white flex items-center gap-2 hover:text-[#FACC15] transition-colors cursor-pointer border-r border-dashed border-[#333]">
          <span>RockOrBust Playwright Extra plugin is now live with full Puppeteer support</span>
          <HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={2} />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row w-full">
        {/* Left Cell: Typography & CTA */}
        <div className="flex-[1.6] flex flex-col justify-start border-b lg:border-b-0 border-dashed border-[#333]">
          {/* Content Box */}
          <div className="grid-cell-x pt-10 pb-16">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-tight mb-6 text-white max-w-xl">
              Decentralized stealth proxy network
            </h1>

            <p className="text-base sm:text-lg text-[#A3A3A3] max-w-lg mb-10 leading-relaxed font-light">
              Turn your devices into a decentralized residential proxy network and use it seamlessly with Playwright and Puppeteer. Fully open source.
            </p>

            <div className="flex flex-col sm:flex-row items-center sm:justify-start gap-4 mb-10 w-full">
              <a 
                href="#download-cli"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('download-cli')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('cli-scroll-finished'));
                  }, 800);
                }}
                className="bg-[#FACC15] text-black font-bold uppercase px-6 py-2.5 hover:bg-[#EAB308] transition-colors w-full sm:w-auto flex items-center justify-center gap-2 whitespace-nowrap border border-[#FACC15] text-sm tracking-wide"
              >
                <HugeiconsIcon icon={Download01Icon} size={16} strokeWidth={2.5} />
                Download CLI
              </a>
              <button className="bg-transparent text-white font-medium px-6 py-2.5 border border-[#333] hover:bg-[#111] transition-colors w-full sm:w-auto text-center whitespace-nowrap uppercase tracking-wide text-sm">
                Read Docs
              </button>
              <a href="#" className="hidden sm:flex items-center gap-2 text-sm text-[#A3A3A3] hover:text-[#FACC15] transition-colors sm:ml-2 whitespace-nowrap uppercase font-mono">
                Visualize Network
                <HugeiconsIcon icon={CanvasIcon} size={14} strokeWidth={2.5} />
              </a>
            </div>

            {/* Code Snippet Box */}
            <div className="flex flex-col gap-3">
              <CopySnippet command="npm install @rockorbust/extra-plugin" variant="inline" />
              <CopySnippet command="npm install @rockorbust/playwright-plugin" variant="inline" />
            </div>
          </div>
        </div>

        {/* Right Cell: SVG Animation Space (The Brain) */}
        <div className="flex-1 grid-cell-x py-16 flex flex-col justify-center items-center relative overflow-hidden bg-[#000]">
          <div className="relative z-10 w-full max-w-lg flex items-center justify-center p-8">
            <Image 
              src="/Illustration.svg" 
              alt="RockOrBust Decentralized Network Illustration" 
              width={600}
              height={600}
              className="w-full h-auto object-contain"
              priority
            />
          </div>
        </div>
      </div>

    </section>
  );
}

