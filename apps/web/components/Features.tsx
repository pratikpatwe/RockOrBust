export function Features() {
  const features = [
    {
      title: "Decentralized Pool",
      desc: "By leveraging real residential IPs contributed by the Go CLI, your traffic blends in with natural user behavior.",
      id: "01"
    },
    {
      title: "Stealth by Default",
      desc: "Native TLS fingerprint masking and stripped proxy headers ensure Cloudflare and Datadome see a real browser.",
      id: "02"
    },
    {
      title: "Signaling Hub",
      desc: "The Gateway acts as a Signaling Orchestrator, coordinating direct WebRTC handshakes for a zero-latency P2P Mesh-Flow.",
      id: "03"
    },
    {
      title: "Self-Hosted Control",
      desc: "No vendor lock-in. Deploy the entire infrastructure on your own VPS and invite your team to contribute nodes.",
      id: "04"
    }
  ];

  return (
    <section className="w-full border-b border-dashed border-[#333]">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        
        {/* Title Cell */}
        <div className="md:col-span-2 lg:col-span-4 grid-cell-x py-12 border-b border-dashed border-[#333]">
          <h2 className="text-3xl font-semibold tracking-tight uppercase">Architecture Specs</h2>
        </div>

        {features.map((feature, idx) => (
          <div 
            key={feature.id} 
            className={`p-8 lg:p-12 flex flex-col justify-between hover:bg-[#050505] transition-colors group ${
              idx !== features.length - 1 ? 'border-b md:border-b-0 md:border-r border-dashed border-[#333]' : ''
            } ${(idx === 0 || idx === 1) ? 'md:border-b border-dashed border-[#333] lg:border-b-0' : ''}`}
          >
            <div>
              <div className="text-sm font-medium text-[#FACC15] mb-4 font-mono border border-[#FACC15]/20 w-fit px-2 py-1 bg-[#111]">
                {feature.id}
              </div>
              <h3 className="text-xl font-medium mb-3 text-white uppercase">{feature.title}</h3>
            </div>
            <p className="text-[#A3A3A3] font-light text-sm leading-relaxed">
              {feature.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
