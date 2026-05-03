"use client";

import { useState, useEffect } from "react";

const faqs = [
  { question: "What is RockOrBust?", answer: "RockOrBust is an open-source, decentralized P2P proxy infrastructure. It allows you to build your own residential proxy network using a Go CLI, a signaling Gateway, and native SDKs for Playwright and Puppeteer." },
  { question: "What is the P2P Mesh-Flow architecture?", answer: "Mesh-Flow is a peer-to-peer tunneling protocol that uses WebRTC DataChannels to connect your browser directly to residential nodes. This eliminates gateway latency and ensures your proxy traffic never passes through a centralized VPS." },
  { question: "How does the signaling process work?", answer: "When an SDK initiates a connection, it sends an encrypted signaling offer to the Gateway. The Gateway identifies an available residential node and forwards the signal. The node responds with an answer, establishing a direct WebRTC connection between the two peers." },
  { question: "Is the traffic encrypted?", answer: "Yes. All traffic between the SDK and the residential node is encrypted using DTLS (Datagram Transport Layer Security) as part of the standard WebRTC protocol suite." },
  { question: "What happens if a P2P connection fails?", answer: "RockOrBust includes a 'Smart Fallback' mechanism. If a direct P2P connection cannot be established (e.g., due to highly restrictive symmetric NATs), the system automatically falls back to a secure WebSocket tunnel through the Gateway." },
  { question: "Does RockOrBust support both Playwright and Puppeteer?", answer: "Yes. We provide a Native Playwright Plugin for zero-dependency setups and a Unified Extra Plugin for the playwright-extra and puppeteer-extra ecosystems." },
  { question: "How is this different from traditional proxy providers?", answer: "Traditional providers charge you per GB and relay traffic through their own servers. RockOrBust lets you own the infrastructure. You contribute nodes, and the traffic flows directly over your own decentralized mesh." },
  { question: "Do I still need a Gateway?", answer: "Yes. The Gateway acts as the 'Signaling Control Plane'. It is required for node discovery, authentication, and orchestrating the initial WebRTC handshakes." },
  { question: "Is RockOrBust free to use?", answer: "Yes. RockOrBust is fully open-source (MIT License). You can deploy your own gateway and run your own nodes without any subscription fees." },
  { question: "What are the requirements for running a node?", answer: "Any device with a stable internet connection can run the Go CLI. It is lightweight, cross-platform (Windows, Linux, macOS), and can run as a background daemon." }
];

const ITEMS_PER_PAGE = 5;
const TOTAL_PAGES = Math.ceil(faqs.length / ITEMS_PER_PAGE);

export function FaqSection() {
  const [currentPage, setCurrentPage] = useState(0);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  // When page changes, automatically open the first FAQ of that page
  useEffect(() => {
    setOpenIndex(currentPage * ITEMS_PER_PAGE);
  }, [currentPage]);

  const handleNext = () => setCurrentPage((prev) => Math.min(prev + 1, TOTAL_PAGES - 1));
  const handlePrev = () => setCurrentPage((prev) => Math.max(prev - 1, 0));
  const handlePageClick = (page: number) => setCurrentPage(page);

  const toggleOpen = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  const startIndex = currentPage * ITEMS_PER_PAGE;
  const currentFaqs = faqs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <section className="w-full px-4 py-16 border-t border-dashed border-[#333]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="mb-12">
        <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight uppercase mb-4">
          Frequently Asked Questions
        </h2>
        <p className="text-[#A3A3A3] text-sm font-mono max-w-2xl">
          Everything you need to know about RockOrBust, the open-source residential proxy infrastructure.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-10 min-h-[400px]">
        {currentFaqs.map((faq, localIdx) => {
          const globalIdx = startIndex + localIdx;
          const isOpen = openIndex === globalIdx;

          return (
            <article 
              key={globalIdx} 
              className={`border border-[#333] transition-colors ${isOpen ? 'bg-[#0a0a0a]' : 'bg-[#050505]'}`}
            >
              <button 
                onClick={() => toggleOpen(globalIdx)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-[#111] transition-colors"
                aria-expanded={isOpen}
              >
                <h3 className={`text-base sm:text-lg font-medium transition-colors ${isOpen ? 'text-[#FACC15]' : 'text-white'}`}>
                  {faq.question}
                </h3>
                <span className="text-[#A3A3A3] shrink-0 ml-4 flex items-center justify-center">
                  {isOpen ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="18 15 12 9 6 15"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  )}
                </span>
              </button>
              
              {isOpen && (
                <div className="p-6 pt-0 animate-in fade-in slide-in-from-top-2 duration-200">
                  <p className="text-[#A3A3A3] leading-relaxed text-sm">
                    {faq.answer}
                  </p>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 border-t border-dashed border-[#333] pt-10">
        <button 
          onClick={handlePrev} 
          disabled={currentPage === 0}
          className="px-3 py-2 sm:px-4 sm:py-2 border border-[#333] text-[#A3A3A3] hover:text-white hover:border-[#555] disabled:opacity-30 disabled:pointer-events-none transition-colors uppercase text-[10px] sm:text-xs font-bold tracking-wider flex items-center gap-2"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 sm:w-3.5 sm:h-3.5">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {Array.from({ length: TOTAL_PAGES }).map((_, idx) => (
            <button 
              key={idx} 
              onClick={() => handlePageClick(idx)}
              className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center border transition-colors font-mono text-xs sm:text-sm
                ${currentPage === idx 
                  ? 'border-[#FACC15] bg-[#FACC15] text-black font-bold' 
                  : 'border-[#333] text-[#A3A3A3] hover:text-white hover:border-[#555] bg-[#050505]'
                }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        <button 
          onClick={handleNext} 
          disabled={currentPage === TOTAL_PAGES - 1}
          className="px-3 py-2 sm:px-4 sm:py-2 border border-[#333] text-[#A3A3A3] hover:text-white hover:border-[#555] disabled:opacity-30 disabled:pointer-events-none transition-colors uppercase text-[10px] sm:text-xs font-bold tracking-wider flex items-center gap-2"
        >
          Next
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 sm:w-3.5 sm:h-3.5">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>

    </section>
  );
}
