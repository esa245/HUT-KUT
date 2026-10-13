import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Key, ArrowUpRight, History, Clock, CheckCircle2, Database } from 'lucide-react';
import { Language, WithdrawalRecord } from '../types/game';
import { translations, formatNumber, toBengaliDigits } from '../utils/translations';
import { soundManager } from '../utils/audio';
import { syncUserToFirebase, saveWithdrawalToFirebase, listenToUserWithdrawals } from '../utils/firebase';
import { AdminLoginModal } from './AdminLoginModal';

interface AirdropViewProps {
  coins: number;
  diamonds: number;
  profitPerHour: number;
  totalTaps: number;
  language: Language;
  onUpdateCoins?: (newCoins: number) => void;
  onUpdateDiamonds?: (newDiamonds: number) => void;
  onBack: () => void;
  onOpenAdmin: () => void; // New prop
}

export const AirdropView: React.FC<AirdropViewProps> = ({
  coins,
  diamonds,
  profitPerHour,
  totalTaps,
  language,
  onUpdateCoins,
  onUpdateDiamonds,
  onBack,
  onOpenAdmin, // New prop
}) => {
  const t = translations[language];

  const [convertedTokens, setConvertedTokens] = useState<number>(() => {
    return Number(localStorage.getItem('loys_converted_tokens') || '0');
  });
  
  // Static Unique Code (Generated once)
  const [airdropCode] = useState<string>(() => {
    const saved = localStorage.getItem('loys_airdrop_code');
    if (saved) return saved;
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    localStorage.setItem('loys_airdrop_code', newCode);
    return newCode;
  });

  const [convertMsg, setConvertMsg] = useState<string | null>(null);
  const [withdrawMsg, setWithdrawMsg] = useState<string | null>(null);
  
  // Withdrawal Form State
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [exchange, setExchange] = useState<string>('Binance');
  const [exchangeId, setExchangeId] = useState<string>('');

  // Withdrawal History State
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>(() => {
    try {
      const saved = localStorage.getItem('loys_withdrawals');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Sync user profile to Firebase
  useEffect(() => {
    syncUserToFirebase(airdropCode, {
      coins,
      diamonds,
      convertedTokens,
      profitPerHour,
      totalTaps,
    });
  }, [airdropCode, coins, diamonds, convertedTokens, profitPerHour, totalTaps]);

  // Listen to live withdrawals from Firebase
  useEffect(() => {
    const unsubscribe = listenToUserWithdrawals(airdropCode, (serverRecords) => {
      if (serverRecords && serverRecords.length > 0) {
        setWithdrawals(serverRecords);
        localStorage.setItem('loys_withdrawals', JSON.stringify(serverRecords));
      }
    });
    return () => unsubscribe();
  }, [airdropCode]);

  const getRecordStatus = (record: WithdrawalRecord) => {
    const elapsed = Date.now() - record.timestamp;
    if (elapsed > 10 * 60 * 1000) return 'completed';
    if (elapsed > 2 * 60 * 1000) return 'processing';
    return record.status || 'pending';
  };

  const formatRecordDate = (ts: number) => {
    const date = new Date(ts);
    const dateStr = date.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const timeStr = date.toLocaleTimeString(language === 'bn' ? 'bn-BD' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${dateStr} • ${timeStr}`;
  };

  const formatLangNumber = (num: number) => {
    const formatted = formatNumber(num, language);
    return language === 'bn' ? toBengaliDigits(formatted) : formatted;
  };

  const handleConvert = (amount: number, diamondCost: number) => {
    if (coins < amount || diamonds < diamondCost) {
      soundManager.playClick();
      setConvertMsg(
        language === 'bn'
          ? `পর্যাপ্ত কয়েন বা ডায়মন্ড নেই! (${formatLangNumber(amount)} কয়েন ও ${formatLangNumber(diamondCost)} ডায়মন্ড প্রয়োজন)`
          : `Not enough coins or diamonds! (${formatLangNumber(amount)} coins & ${formatLangNumber(diamondCost)} diamonds required)`
      );
      setTimeout(() => setConvertMsg(null), 3000);
      return;
    }
    soundManager.playUpgrade();
    const earned = Math.floor(amount / 1000); // 1000 coins = 1 HUT KUT token
    const updated = convertedTokens + earned;
    setConvertedTokens(updated);
    localStorage.setItem('loys_converted_tokens', String(updated));

    const newCoins = coins - amount;
    if (onUpdateCoins) {
      onUpdateCoins(newCoins);
    } else {
      localStorage.setItem('loys_coins', String(newCoins));
    }

    const newDiamonds = diamonds - diamondCost;
    if (onUpdateDiamonds) {
      onUpdateDiamonds(newDiamonds);
    } else {
      localStorage.setItem('loys_diamonds', String(newDiamonds));
    }

    setConvertMsg(
      language === 'bn'
        ? `সফলভাবে ${formatLangNumber(amount)} কয়েন ও ${formatLangNumber(diamondCost)} ডায়মন্ড কনভার্ট করে ${formatLangNumber(earned)} HUT KUT টোকেন যোগ হয়েছে!`
        : `Successfully converted ${formatLangNumber(amount)} coins & ${formatLangNumber(diamondCost)} diamonds into ${formatLangNumber(earned)} HUT KUT tokens!`
    );
    setTimeout(() => setConvertMsg(null), 4000);
  };
  
  const handleWithdraw = () => {
    const amount = Number(withdrawAmount);
    
    // Check if it's a first-time user and eligible for 100 withdrawal
    const hasWithdrawnBefore = localStorage.getItem('loys_has_withdrawn') === 'true';
    const isFirstTimeWithdrawal = !hasWithdrawnBefore && amount === 100;
    
    // Enforce 1000+ for normal withdrawals, or 100 if it's the very first time
    if (isNaN(amount) || (isFirstTimeWithdrawal ? false : amount < 1000) || amount > convertedTokens) {
        setWithdrawMsg(language === 'bn' 
            ? '১,০০০ এর বেশি (অথবা প্রথমবার ১০০) এবং আপনার ব্যালেন্সের সমান বা কম হতে হবে!' 
            : 'Amount must be 1,000+ (or 100 for first time) and <= balance!');
        setTimeout(() => setWithdrawMsg(null), 3000);
        return;
    }
    
    if (!exchangeId) {
        setWithdrawMsg(language === 'bn' ? 'বাইনেন্স/বাইবিট আইডি দিন!' : 'Enter Binance/Bybit ID!');
        setTimeout(() => setWithdrawMsg(null), 3000);
        return;
    }
    
    soundManager.playUpgrade();
    // 1000 HUT KUT = 1000 BTT (rate: 1 HUT KUT = 1 BTT)
    const bttReceived = amount;
    
    // Save withdrawal record
    const newRecord: WithdrawalRecord = {
      id: 'WD' + Math.floor(100000 + Math.random() * 900000),
      amountHutKut: amount,
      amountBtt: bttReceived,
      exchange,
      exchangeId,
      timestamp: Date.now(),
      status: 'pending',
    };
    const updatedWithdrawals = [newRecord, ...withdrawals];
    setWithdrawals(updatedWithdrawals);
    localStorage.setItem('loys_withdrawals', JSON.stringify(updatedWithdrawals));
    
    // Mark as having withdrawn at least once
    localStorage.setItem('loys_has_withdrawn', 'true');

    // Save to Firebase database
    saveWithdrawalToFirebase(airdropCode, newRecord);

    setConvertedTokens(prev => prev - amount);
    localStorage.setItem('loys_converted_tokens', String(convertedTokens - amount));
    setWithdrawAmount('');
    setExchangeId('');
    
    setWithdrawMsg(language === 'bn' ? `সফল! ${formatLangNumber(bttReceived)} BTT রিকোয়েস্ট পাঠানো হয়েছে ${exchange} আইডি: ${exchangeId}` : `Success! Requested ${formatLangNumber(bttReceived)} BTT to ${exchange} ID: ${exchangeId}`);
    setTimeout(() => setWithdrawMsg(null), 5000);
  };

  const [clickCount, setClickCount] = useState(0);
  const [showLogin, setShowLogin] = useState(false);

  const handleTitleClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount >= 5) {
      setClickCount(0);
      setShowLogin(true);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 px-4 py-3 overflow-y-auto pb-28 select-none max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => {
            soundManager.playClick();
            onBack();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-white/10 text-white font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-sm hover:border-amber-500/40"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400 stroke-[2.5]" />
          <span>{t.backToTap}</span>
        </button>

        <div onClick={handleTitleClick} className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-white/10 cursor-pointer">
          <span>💎</span>
          <span>{t.airdrop}</span>
        </div>
      </div>
      
      {showLogin && (
        <AdminLoginModal onSuccess={() => { setShowLogin(false); onOpenAdmin(); }} onClose={() => setShowLogin(false)} />
      )}
      
      {/* Static Code Display */}
      <div className="p-4 rounded-3xl bg-slate-900/90 border border-sky-500/30 mb-4 shadow-xl text-center">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-black text-white text-sm flex items-center gap-2">
            <Key className="w-4 h-4 text-sky-400" />
            {language === 'bn' ? 'আপনার ইউনিক এয়ারড্রপ কোড' : 'Your Unique Airdrop Code'}
          </h4>
          <span className="flex items-center gap-1 text-[10px] bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
            <Database className="w-3 h-3 text-emerald-400" />
            <span>{language === 'bn' ? 'ফায়ারবেজ কানেক্টেড' : 'Firebase Synced'}</span>
          </span>
        </div>
        <div className="text-3xl font-black text-sky-400 font-mono tracking-widest bg-slate-950 p-3 rounded-2xl border border-sky-900 shadow-inner">
            {airdropCode}
        </div>
        <div className="text-[10px] text-slate-400 mt-2">
            {language === 'bn'
              ? 'এই কোডটি সরাসরি ফায়ারবেজ ডাটাবেজের সাথে যুক্ত। এটি পরিবর্তন হবে না।'
              : 'This unique code is linked with Firebase database and will never change.'}
        </div>
      </div>

      {/* Token Conversion System Box */}
      <div className="p-4 rounded-3xl bg-slate-900/90 border border-amber-500/30 mb-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-amber-400 animate-spin-slow" />
            <h4 className="font-black text-white text-sm sm:text-base">
              {language === 'bn' ? 'HUT KUT টোকেন কনভার্টার' : 'HUT KUT Token Converter'}
            </h4>
          </div>
          <span className="text-[11px] bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full font-mono font-bold border border-amber-500/30">
            1K Coins = 1 HUT KUT
          </span>
        </div>

        <p className="text-xs text-slate-300 mb-3">
          {language === 'bn'
            ? 'আপনার ইন-গেম কয়েন কনভার্ট করে ইনস্ট্যান্টলি HUT KUT টোকেন এয়ারড্রপ ব্যালেন্সে যোগ করুন।'
            : 'Instantly convert your in-game coins into claimable HUT KUT airdrop balance.'}
        </p>

        {convertMsg && (
          <div className="mb-3 p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-200 text-xs font-bold text-center animate-pulse">
            {convertMsg}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleConvert(100000, 10)}
            className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex flex-col items-center gap-0.5 transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <span>Convert 100K + 10 💎</span>
            <span className="text-[10px] text-slate-400">+100 HUT KUT</span>
          </button>

          <button
            onClick={() => handleConvert(500000, 50)}
            className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex flex-col items-center gap-0.5 transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <span>Convert 500K + 50 💎</span>
            <span className="text-[10px] text-slate-400">+500 HUT KUT</span>
          </button>
        </div>
      </div>
      
      {/* Allocation Breakdown Metrics */}
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
        {language === 'bn' ? 'স্কোর ও ক্রাইটেরিয়া' : 'Airdrop Criteria Breakdown'}
      </h4>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/10">
          <div className="text-[11px] text-slate-400">Converted Balance</div>
          <div className="text-base font-extrabold text-amber-400 mt-0.5">
            ✨ {formatLangNumber(convertedTokens)} HUT
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/10">
          <div className="text-[11px] text-slate-400">{t.pphScore}</div>
          <div className="text-base font-extrabold text-emerald-400 mt-0.5">
            +{formatLangNumber(profitPerHour)}/h
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/10">
          <div className="text-[11px] text-slate-400">{t.diamondsScore}</div>
          <div className="text-base font-extrabold text-sky-400 mt-0.5">
            💎 {formatLangNumber(diamonds)}
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/10">
          <div className="text-[11px] text-slate-400">{t.tapsScore}</div>
          <div className="text-base font-extrabold text-amber-400 mt-0.5">
            👆 {formatLangNumber(totalTaps)}
          </div>
        </div>
      </div>
      
      {/* Withdraw Section */}
      <div className="p-4 rounded-3xl bg-slate-900/90 border border-emerald-500/30 mb-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-black text-white text-sm flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            {language === 'bn' ? 'উইথড্র (HUT KUT to BTT)' : 'Withdraw (HUT KUT to BTT)'}
          </h4>
          <span className="text-[11px] bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full font-mono font-bold border border-emerald-500/30">
            {language === 'bn' ? '১,০০০ HUT = ১,০০০ BTT' : '1,000 HUT = 1,000 BTT'}
          </span>
        </div>
        
        <div className="text-xs text-slate-400 mb-3">
            {language === 'bn' ? 'আপনার বর্তমান ব্যালেন্স:' : 'Your Balance:'} 
            <span className="text-white font-bold ml-1">{formatLangNumber(convertedTokens)} HUT KUT</span>
            {localStorage.getItem('loys_has_withdrawn') !== 'true' && (
                <div className="text-[10px] text-amber-400 font-bold mt-1 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                    {language === 'bn' 
                        ? '🎉 নতুন অফার: আপনি প্রথমবারের মতো মাত্র ১০০ HUT KUT উইথড্র করতে পারবেন!' 
                        : '🎉 New Offer: You can withdraw just 100 HUT KUT for your first time!'}
                </div>
            )}
        </div>

        <input 
            type="number" 
            placeholder={language === 'bn' ? 'উইথড্র পরিমাণ (ন্যূনতম ১,০০০)' : 'Withdraw Amount (Min 1,000)'}
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs mb-1"
        />
        
        {Number(withdrawAmount) >= 1000 && (
            <div className="text-[10px] text-emerald-400 mb-2 font-bold flex items-center gap-1">
                <span>✨</span>
                <span>
                  {language === 'bn' 
                      ? `আপনি পাবেন: ${formatLangNumber(Number(withdrawAmount))} BTT কয়েন`
                      : `You will receive: ${formatLangNumber(Number(withdrawAmount))} BTT Coins`}
                </span>
            </div>
        )}

        <select 
            value={exchange}
            onChange={(e) => {
                setExchange(e.target.value);
                setExchangeId('');
            }}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs mb-2"
        >
            <option value="Binance">Binance</option>
            <option value="Bybit">Bybit</option>
        </select>

        <input 
            type="text" 
            placeholder={language === 'bn' ? `${exchange} আইডি` : `${exchange} ID`}
            value={exchangeId}
            onChange={(e) => setExchangeId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs mb-3"
        />

        <button
            onClick={handleWithdraw}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-lg shadow-emerald-900/30"
        >
            {language === 'bn' ? 'উইথড্র সাবমিট করুন' : 'Submit Withdraw'}
        </button>
        {withdrawMsg && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 text-xs font-bold text-center animate-pulse">
            {withdrawMsg}
          </div>
        )}
      </div>

      {/* Withdrawal History & Status Section */}
      <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl mb-4">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">
                {language === 'bn' ? 'উইথড্র হিস্ট্রি ও স্ট্যাটাস' : 'Withdrawal History & Status'}
              </h4>
              <p className="text-[10px] text-slate-400">
                {language === 'bn' ? 'আপনার উত্তোলনের লাইভ অবস্থা ও ট্র্যাকিং' : 'Live tracking of your withdrawal requests'}
              </p>
            </div>
          </div>
          {withdrawals.length > 0 && (
            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-bold border border-white/5">
              {language === 'bn' ? `${toBengaliDigits(withdrawals.length)}টি রিকোয়েস্ট` : `${withdrawals.length} Requests`}
            </span>
          )}
        </div>

        {withdrawals.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-950/60 border border-white/5 text-center text-slate-400">
            <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-60" />
            <p className="text-xs font-semibold text-slate-300">
              {language === 'bn' ? 'এখনও কোনো উইথড্র করেননি' : 'No withdrawals yet'}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {language === 'bn'
                ? 'উইথড্র সাবমিট করলে এখানে আপনার রিকোয়েস্টের প্রসেসিং স্ট্যাটাস দেখতে পাবেন।'
                : 'Submit a withdrawal above to monitor your payout status in real-time.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {withdrawals.map((record) => {
              const currentStatus = getRecordStatus(record);
              return (
                <div
                  key={record.id}
                  className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 hover:border-slate-700 transition-all shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-slate-300 bg-slate-900 px-2 py-0.5 rounded-lg border border-white/5">
                        {record.id}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatRecordDate(record.timestamp)}
                      </span>
                    </div>

                    {/* Status Badge */}
                    {currentStatus === 'pending' && (
                      <span className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
                        <span>{language === 'bn' ? 'অপেক্ষমান (Pending)' : 'Pending'}</span>
                      </span>
                    )}

                    {currentStatus === 'processing' && (
                      <span className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30">
                        <RefreshCw className="w-3 h-3 text-sky-400 animate-spin" />
                        <span>{language === 'bn' ? 'প্রক্রিয়াধীন (Processing)' : 'Processing'}</span>
                      </span>
                    )}

                    {currentStatus === 'completed' && (
                      <span className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>{language === 'bn' ? 'সম্পন্ন (Completed)' : 'Completed'}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-white/5">
                    <div>
                      <div className="text-xs font-black text-emerald-400 flex items-center gap-1">
                        <span>+{formatLangNumber(record.amountBtt)} BTT</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        -{formatLangNumber(record.amountHutKut)} HUT KUT
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-white flex items-center justify-end gap-1">
                        <span className="text-slate-400 font-normal">{record.exchange}:</span>
                        <span className="font-mono text-amber-300">{record.exchangeId}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {currentStatus === 'completed'
                          ? (language === 'bn' ? 'ওয়ালেটে ট্রান্সফার সম্পন্ন' : 'Transferred to Account')
                          : currentStatus === 'processing'
                          ? (language === 'bn' ? 'নেটওয়ার্ক ভেরিফিকেশন চলছে' : 'Network verifying')
                          : (language === 'bn' ? 'অ্যাডমিন পর্যালোচনায় আছে' : 'In queue')}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
