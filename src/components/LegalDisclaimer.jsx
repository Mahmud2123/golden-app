// src/components/LegalDisclaimer.jsx
import React from 'react';

const LegalDisclaimer = () => {
  return (
    <div className="bg-black border-t border-[#222] mt-8 pt-8 pb-8">
      <div className="text-center text-[#555] text-[0.65rem] space-y-3 max-w-3xl mx-auto px-6 font-mono">
        <p className="leading-relaxed">
          ⚠️ <strong className="text-[#888]">DISCLAIMER:</strong> This is an independent 
          Razer™, Razer Gold™, and related logos are trademarks of Razer Inc. 
        
        </p>
        <p className="leading-relaxed">
          🔐  No  balances are stored. 
          All data entered is encrytpted.
        </p>
        <div className="pt-4 flex flex-wrap justify-center gap-4 text-[#666] text-[0.6rem] uppercase tracking-[0.2em] font-bold">
          <a href="/privacy" className="hover:text-[#00ff41] transition-colors">Privacy Policy</a>
          <span className="text-[#333] hidden sm:block">|</span>
          <a href="/terms" className="hover:text-[#00ff41] transition-colors">Terms of Service</a>
          <span className="text-[#333] hidden sm:block">|</span>
          <span>Demo v1.0</span>
        </div>
      </div>
    </div>
  );
};

export default LegalDisclaimer;