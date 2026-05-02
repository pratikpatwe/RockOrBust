"use client";

import { useState, useEffect } from "react";

const faqs = [
  { question: "What is RockOrBust?", answer: "RockOrBust is an open-source browser automation infrastructure that lets you build and use your own residential proxy network. It includes a proxy node CLI, a routing gateway, and plugins for Playwright and Puppeteer." },
  { question: "How does RockOrBust work?", answer: "RockOrBust turns your devices into proxy nodes using a lightweight CLI. These nodes route traffic through real residential IPs, while the gateway manages routing and load balancing. The Playwright and Puppeteer plugins connect your automation directly to this network." },
  { question: "What problem does RockOrBust solve?", answer: "Most browser automation workflows fail due to IP blocking, bot detection, and expensive proxy providers. RockOrBust solves this by letting you use your own residential IPs instead of paying for third-party proxy services." },
  { question: "Is RockOrBust a proxy provider?", answer: "No. RockOrBust is not a proxy provider. It is an open-source system that allows you to create and manage your own proxy network using devices you control." },
  { question: "Is RockOrBust free to use?", answer: "Yes. RockOrBust is fully open source. You can run your own proxy nodes and infrastructure without paying for external proxy services." },
  { question: "Does RockOrBust work with Playwright and Puppeteer?", answer: "Yes. RockOrBust provides a Playwright Extra plugin and supports Puppeteer, allowing you to integrate proxy routing and automation with minimal setup." },
  { question: "Can I use multiple plugins with RockOrBust?", answer: "Yes. RockOrBust works with the Playwright Extra ecosystem, so you can combine it with stealth plugins, CAPTCHA solvers, and other automation tools." },
  { question: "Does RockOrBust make automation undetectable?", answer: "No system is fully undetectable. RockOrBust reduces detection by using real residential IPs and routing strategies, but advanced anti-bot systems may still detect automation." },
  { question: "How is RockOrBust different from BrightData or Oxylabs?", answer: "Traditional providers sell access to large proxy networks. RockOrBust lets you build your own network using your own devices, giving you full control and eliminating per-GB costs." },
  { question: "Do I need technical knowledge to use RockOrBust?", answer: "Basic knowledge of Node.js and browser automation is helpful. However, the CLI and plugins are designed to be simple to set up and integrate." },
  { question: "Can I share my proxy network with a team?", answer: "Yes. RockOrBust is designed for teams and groups. Multiple users can contribute nodes and share the same proxy infrastructure." },
  { question: "Is RockOrBust secure?", answer: "RockOrBust is open source, so you can audit the code. You control your own nodes and infrastructure, which reduces reliance on third-party proxy providers." },
  { question: "What is the RockOrBust CLI?", answer: "The CLI is a lightweight tool (written in Go) that turns your device into a proxy node. It connects to the gateway and allows your IP to be used for routing traffic." },
  { question: "What is the RockOrBust gateway?", answer: "The gateway manages routing between nodes and automation clients. It handles load balancing, connection management, and request forwarding." },
  { question: "What is the Playwright Extra plugin?", answer: "The plugin allows you to use RockOrBust directly inside Playwright Extra. It automatically configures proxy routing and integrates with your automation workflow." },
  { question: "Can I use RockOrBust for web scraping?", answer: "Yes. RockOrBust is designed for web scraping, data extraction, testing, and automation use cases where IP rotation and detection avoidance are important." },
  { question: "Does RockOrBust support proxy rotation?", answer: "Yes. The system can rotate between available nodes to distribute requests and reduce detection risk." },
  { question: "Can I control which IP or region I use?", answer: "Yes. You can configure routing logic and choose nodes based on availability, region, or other parameters." },
  { question: "Why use RockOrBust instead of free proxy lists?", answer: "Free proxy lists are unreliable, slow, and often flagged. RockOrBust uses real residential IPs from devices you control, making it more stable and trustworthy." },
  { question: "Is RockOrBust suitable for production use?", answer: "Yes, but it depends on your setup. For production use, you should ensure a stable node network, proper monitoring, and good routing strategies." }
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
