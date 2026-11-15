// src/components/Navbar.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <div className="bg-[#000000]/90 backdrop-blur-md px-4 sm:px-8 py-4 border-b border-[#222] flex justify-between items-center sticky top-0 z-50">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="text-[#00ff41] text-xl sm:text-2xl font-black tracking-[0.2em] uppercase" style={{ textShadow: '0 0 10px rgba(0,255,65,0.4)' }}>
          RΛZER
        </div>
        <div className="h-5 w-px bg-[#333] hidden sm:block"></div>
        <span className="text-[#888] text-[0.65rem] sm:text-xs font-bold tracking-[0.2em] uppercase hidden sm:block mt-1">Gold & Silver</span>
      </div>
      
      <div className="flex gap-4 sm:gap-8 items-center">
        <Link to="/" className="text-[#aaa] text-xs font-bold tracking-widest hover:text-[#00ff41] transition-colors relative group">
          HOME
          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#00ff41] transition-all group-hover:w-full"></span>
        </Link>
        <Link to="/scan" className="text-[#aaa] text-xs font-bold tracking-widest hover:text-[#00ff41] transition-colors relative group">
          SCAN
          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#00ff41] transition-all group-hover:w-full"></span>
        </Link>
        
        <button 
          onClick={() => alert('Sign in - demo')}
          className="relative px-4 sm:px-6 py-2 bg-transparent text-[#00ff41] font-bold text-[0.65rem] sm:text-xs tracking-widest border border-[#00ff41] overflow-hidden group hover:shadow-[0_0_15px_rgba(0,255,65,0.3)] transition-all"
          style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
        >
          <span className="relative z-10 group-hover:text-black transition-colors duration-300 uppercase">Sign In</span>
          <div className="absolute inset-0 bg-[#00ff41] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
        </button>
      </div>
    </div>
  );
};

export default Navbar;