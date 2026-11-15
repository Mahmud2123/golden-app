// src/components/FeaturedRewards.jsx
import React from 'react';

const FeaturedRewards = () => {
  const rewards = [
    { icon: '🎮', title: 'PlayStation®Store (UAE)', price: '$10 USD', badge: 'NEW' },
    { icon: '🎮', title: 'Nintendo eShop Voucher', price: '50,000 Silver', badge: 'NEW' },
    { icon: '🎮', title: 'Epic Games Voucher', price: '$20 USD' },
    { icon: '🎮', title: 'Xbox Gift Card', price: '$15 USD' }
  ];

  return (
    <div className="mb-10">
      <div className="flex justify-between items-baseline mb-4">
        <h2 className="text-white text-sm sm:text-base font-black tracking-[0.2em] uppercase flex items-center gap-2">
          <span className="w-1.5 h-4 bg-[#00ff41]"></span> Featured Rewards
        </h2>
        <a href="#" className="text-[#888] text-[0.65rem] sm:text-xs font-bold tracking-widest hover:text-[#00ff41] transition-colors">VIEW ALL →</a>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {rewards.map((reward, idx) => (
          <div 
            key={idx} 
            className="bg-[#0a0a0a] border border-[#222] p-5 relative overflow-hidden group hover:border-[#00ff41] transition-all duration-300 cursor-pointer"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)' }}
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-[#00ff41] opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            {reward.badge && (
              <span className="absolute top-0 right-0 bg-[#00ff41] text-black text-[0.6rem] font-black px-3 py-1 uppercase tracking-widest" style={{ clipPath: 'polygon(10px 0, 100% 0, 100% 100%, 0 100%)' }}>
                {reward.badge}
              </span>
            )}
            
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform origin-left">{reward.icon}</div>
            <div className="text-sm font-bold text-[#ccc] mb-1 group-hover:text-white transition-colors">{reward.title}</div>
            <div className="text-[#00ff41] font-black text-lg">{reward.price}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeaturedRewards;