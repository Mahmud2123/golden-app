// src/components/Spinner.jsx
import React from 'react';

const Spinner = () => {
  return (
    <div className="fixed inset-0 bg-[#050505] z-[10000] flex flex-col items-center justify-center gap-8">
      {/* Animated Hexagon */}
      <div className="relative w-32 h-32 flex items-center justify-center">
        <svg className="absolute inset-0 w-full h-full animate-[spin_4s_linear_infinite]" viewBox="0 0 100 100">
          <polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" fill="none" stroke="#222" strokeWidth="2"/>
          <polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" fill="none" stroke="#00ff41" strokeWidth="2" strokeDasharray="60 200" strokeLinecap="square" style={{ filter: 'drop-shadow(0 0 8px #00ff41)' }}/>
        </svg>
        <div className="text-[#00ff41] font-black text-4xl" style={{ textShadow: '0 0 20px rgba(0,255,65,0.8)' }}>R</div>
      </div>
      
      {/* Loading Text */}
      <div className="flex flex-col items-center gap-2">
        <div className="text-[#00ff41] font-black tracking-[0.4em] text-lg uppercase font-mono animate-pulse">
          Razer Gold
        </div>
        <div className="text-[#555] font-mono text-xs tracking-widest uppercase">
          Initializing Secure System...
        </div>
      </div>
    </div>
  );
};

export default Spinner;