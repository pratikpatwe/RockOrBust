import { Header } from "../components/Header";
import { Hero } from "../components/Hero";
import { Installation } from "../components/Installation";
import { Features } from "../components/Features";
import { FaqSection } from "../components/FaqSection";

import { AsciiArt } from "../components/AsciiArt";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      {/* Reduced gap between header and the hero section, outside the bordered container */}
      <div className="h-6 lg:h-10 w-full"></div>
      
      {/* Main container wrapper */}
      <main className="flex-1 w-full flex flex-col">
        
        {/* Hero section inside bordered container */}
        <div className="w-full max-w-[1200px] mx-auto border-x border-dashed border-[#333] flex flex-col">
          <Hero />
        </div>

        {/* Full-width ASCII Banner - no X padding, pure edge-to-edge */}
        <div className="w-full h-[200px] sm:h-[250px] relative border-b border-dashed border-[#333]">
          <AsciiArt />
        </div>

        {/* Rest of the content inside bordered container */}
        <div className="w-full max-w-[1200px] mx-auto border-x border-dashed border-[#333] flex flex-col">
          <Installation />
          <Features />
          <FaqSection />
        </div>
        
      </main>
      <footer className="max-w-[1200px] mx-auto w-full border border-dashed border-[#333] px-4 py-8 flex flex-col sm:flex-row items-center justify-between text-[#A3A3A3] text-sm font-mono gap-4">
        <div>MIT © BUILDSHOT</div>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-white transition-colors uppercase">Documentation</a>
          <a href="https://github.com/pratikpatwe/RockOrBust/blob/main/CONTRIBUTING.md" target="_blank" rel="noreferrer" className="hover:text-white transition-colors uppercase">Contribute</a>
          <a href="https://github.com/pratikpatwe/RockOrBust/issues/new" target="_blank" rel="noreferrer" className="hover:text-white transition-colors uppercase text-[#FACC15]">Report Bug</a>
        </div>
      </footer>
    </div>
  );
}


