import React, { useState } from 'react';
import { Wallet, ShieldCheck, Sparkles, CheckCircle, ExternalLink, Flame, Clock, ArrowLeft, Send, Award, Zap } from 'lucide-react';
import { Language } from '../types/game';
import { translations, formatNumber, toBengaliDigits } from '../utils/translations';
import { soundManager } from '../utils/audio';

interface AirdropViewProps {
  coins: number;
  diamonds: number;
  profitPerHour: number;
  totalTaps: number;
  language: Language;
  onBack: () => void;
}

export const AirdropView: React.FC<AirdropViewProps> = ({
  coins,
  diamonds,
  profitPerHour,
  totalTaps,
  language,
  onBack,
}) => {
  const t = translations[language];
  const [walletConnected, setWalletConnected] = useState<boolean>(() => {
    return localStorage.getItem('loys_wallet_connected') === 'true';
  });
  const [walletAddress, setWalletAddress] = useState<string>(() => {
    return (
      localStorage.getItem('loys_wallet_addr') ||
      'UQ' + Math.random().toString(36).substring(2, 8).toUpperCase() + '...' + Math.random().toString(36).substring(2, 6).toUpperCase()
    );
  });

  // Auto Telegram Name and ID
  const [telegramUser] = useState<{ name: string; username: string; id: number }>(() => {
    let savedName = localStorage.getItem('loys_tg_name');
    let savedUsername = localStorage.getItem('loys_tg_username');
    let savedId = localStorage.getItem('loys_tg_id');

    if (!savedName || !savedUsername || !savedId) {
      savedName = 'Loys VIP Miner';
      savedUsername = '@LoysPlayer_' + Math.floor(1000 + Math.random() * 9000);
      savedId = String(Math.floor(80000000 + Math.random() * 200000000));
      localStorage.setItem('loys_tg_name', savedName);
      localStorage.setItem('loys_tg_username', savedUsername);
      localStorage.setItem('loys_tg_id', savedId);
    }

    return {
      name: savedName,
      username: savedUsername,
      id: Number(savedId),
    };
  });

  const handleConnectWallet = () => {
    soundManager.playUpgrade();
    const newConnected = !walletConnected;
    setWalletConnected(newConnected);
    localStorage.setItem('loys_wallet_connected', String(newConnected));
  };

  const formatLangNumber = (num: number) => {
    const formatted = formatNumber(num, language);
    return language === 'bn' ? toBengaliDigits(formatted) : formatted;
  };

  // Estimated LOYS token drop calculation
  const estimatedLoysTokens = Math.round(
    coins / 1000 + profitPerHour * 0.5 + diamonds * 25 + totalTaps * 0.1
  );

  return (
    <div className="flex-1 flex flex-col px-4 py-3 overflow-y-auto pb-20 select-none max-w-4xl mx-auto w-full">
      {/* Top Navigation Bar with Back Button */}
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
        <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <span>💎</span>
          <span>{t.airdrop}</span>
        </div>
      </div>

      {/* Auto Telegram Profile Card (চমকদার টেলিগ্রাম আইডি ও নাম) */}
      <div className="p-3.5 rounded-3xl bg-gradient-to-r from-sky-950/60 via-slate-900 to-slate-950 border border-sky-500/30 mb-3 shadow-lg flex items-center justify-between gap-3 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-sky-500/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-400 flex items-center justify-center text-slate-950 font-black shadow-md shadow-sky-500/30 shrink-0">
            <Send className="w-6 h-6 fill-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-white text-sm">{telegramUser.name}</span>
              <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded-full border border-sky-500/30 font-mono">
                Verified ⚡
              </span>
            </div>
            <div className="text-xs text-sky-300 font-mono font-bold mt-0.5">
              {telegramUser.username} • <span className="text-slate-400">ID: {telegramUser.id}</span>
            </div>
          </div>
        </div>
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-[10px] text-slate-400 font-medium">Telegram Status</span>
          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Connected
          </span>
        </div>
      </div>

      {/* Hero Banner with Stunning Airdrop Token Showcase (চমক) */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/25 via-slate-900 to-slate-950 border-2 border-amber-400/50 text-center mb-4 shadow-2xl relative overflow-hidden">
        {/* Glowing aura effect */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />

        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 via-yellow-400 to-amber-500 flex items-center justify-center text-slate-950 mx-auto shadow-xl shadow-amber-400/30 mb-3 animate-bounce">
          <Sparkles className="w-8 h-8 fill-slate-950" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-black text-xs mb-2">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>{language === 'bn' ? 'এক্সক্লুসিভ এয়ারড্রপ অ্যালোকেশন' : 'EXCLUSIVE AIRDROP ALLOCATION'}</span>
        </div>

        <h3 className="font-black text-2xl sm:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 mb-1 font-mono tracking-tight">
          {formatLangNumber(estimatedLoysTokens)} <span className="text-lg text-amber-400">LOYS</span>
        </h3>
        <p className="text-xs text-amber-200/90 font-bold mb-4">
          {language === 'bn' ? 'আপনার টেলিগ্রাম ওয়ালেটে সরাসরি টোকেন পাঠানো হবে!' : 'Tokens will be airdropped directly to your Telegram Wallet!'}
        </p>

        {/* Connect Wallet Button */}
        <button
          onClick={handleConnectWallet}
          className={`w-full py-3 px-4 rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
            walletConnected
              ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 shadow-emerald-500/20'
              : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 shadow-amber-400/40 hover:scale-[1.02] active:scale-95 animate-pulse'
          }`}
        >
          {walletConnected ? (
            <>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>
                {t.walletConnected}: {walletAddress}
              </span>
            </>
          ) : (
            <>
              <Wallet className="w-4 h-4" />
              <span>{t.connectWallet}</span>
            </>
          )}
        </button>
      </div>

      {/* Allocation Breakdown Metrics */}
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
        {language === 'bn' ? 'স্কোর ও ক্রাইটেরিয়া' : 'Airdrop Criteria Breakdown'}
      </h4>
      <div className="grid grid-cols-2 gap-2">
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

        <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/10">
          <div className="text-[11px] text-slate-400">{language === 'bn' ? 'লিস্টিং পর্যায়' : 'Listing Status'}</div>
          <div className="text-base font-extrabold text-purple-400 mt-0.5 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Q4 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
};
