import React from 'react';
import { Volume2, VolumeX, Globe, ArrowLeft } from 'lucide-react';
import { FoxRankInfo, Language } from '../types/game';
import { translations, formatNumber, toBengaliDigits } from '../utils/translations';
import { soundManager } from '../utils/audio';

interface HeaderStatsProps {
  coins: number;
  diamonds: number;
  level: number;
  currentRank: FoxRankInfo;
  nextRank: FoxRankInfo | null;
  autoEarn10Min: number;
  autoTimerSecondsLeft: number;
  language: Language;
  soundEnabled: boolean;
  activeTab?: string;
  onBackToTap?: () => void;
  onToggleSound: () => void;
  onToggleLanguage: () => void;
  onOpenRankModal: () => void;
}

export const HeaderStats: React.FC<HeaderStatsProps> = ({
  coins,
  diamonds,
  level,
  currentRank,
  nextRank,
  autoEarn10Min,
  autoTimerSecondsLeft,
  language,
  soundEnabled,
  activeTab,
  onBackToTap,
  onToggleSound,
  onToggleLanguage,
  onOpenRankModal,
}) => {
  const t = translations[language];

  // Calculate progress toward next rank
  let rankProgress = 100;
  if (nextRank) {
    const range = nextRank.minCoins - currentRank.minCoins;
    const progress = coins - currentRank.minCoins;
    rankProgress = Math.min(100, Math.max(0, Math.round((progress / range) * 100)));
  }

  const formatLangNumber = (num: number) => {
    const formatted = formatNumber(num, language);
    return language === 'bn' ? toBengaliDigits(formatted) : formatted;
  };

  const mins = Math.floor(autoTimerSecondsLeft / 60);
  const secs = autoTimerSecondsLeft % 60;
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <header className="w-full px-4 pt-3 pb-2 bg-slate-900/80 backdrop-blur-md border-b border-white/10 z-20 shrink-0">
      {/* Top bar controls */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {/* Back button if not on home/tap tab */}
          {activeTab && activeTab !== 'tap' && activeTab !== 'home' && onBackToTap && (
            <button
              onClick={() => {
                soundManager.playClick();
                onBackToTap();
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-sm shadow-amber-500/20"
              title={t.backToTap}
            >
              <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{t.back}</span>
            </button>
          )}

          {/* Rank & Level Badge */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenRankModal();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-300 hover:border-amber-400 transition-all text-xs font-semibold cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>
              {t.level} {language === 'bn' ? toBengaliDigits(level) : level}
            </span>
            <span className="text-white/40">|</span>
            <span className="truncate max-w-[100px] text-amber-200">
              {language === 'bn' ? currentRank.nameBn : currentRank.nameEn}
            </span>
          </button>

          {/* 10-Minute Auto Earn Pill with Countdown */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-emerald-950/70 border border-emerald-500/20 text-emerald-300 text-xs font-medium">
            <span className="text-emerald-400 text-[10px]">⚡</span>
            <span>+{formatLangNumber(autoEarn10Min)}/10m</span>
            <span className="text-white/30 hidden sm:inline">|</span>
            <span className="text-amber-300 font-mono text-[10.5px] font-bold hidden sm:inline">
              {language === 'bn' ? toBengaliDigits(timeFormatted) : timeFormatted}
            </span>
          </div>
        </div>

        {/* Audio and Language Toggles */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              soundManager.playClick();
              onToggleLanguage();
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-white/10 text-xs text-slate-200 transition-colors"
            title={t.language}
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold">{language === 'bn' ? 'বাংলা' : 'EN'}</span>
          </button>

          <button
            onClick={() => {
              onToggleSound();
            }}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-white/10 text-slate-300 transition-colors"
            title={soundEnabled ? t.soundOn : t.soundOff}
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-500" />
            )}
          </button>
        </div>
      </div>

      {/* Primary Currency Row */}
      <div className="grid grid-cols-2 gap-2">
        {/* Coins Total */}
        <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-800/60 to-slate-900 border border-amber-500/20 shadow-inner">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0">
              <span className="text-slate-950 font-black text-sm">🦊</span>
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold tracking-wider text-amber-400/80">
                {t.coins}
              </div>
              <div className="text-base sm:text-lg font-extrabold text-white truncate leading-none mt-0.5">
                {formatLangNumber(coins)}
              </div>
            </div>
          </div>
        </div>

        {/* Diamonds Total */}
        <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-gradient-to-br from-sky-500/10 via-slate-800/60 to-slate-900 border border-sky-500/20 shadow-inner">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-sky-400 flex items-center justify-center shadow-lg shadow-sky-500/30 shrink-0">
              <span className="text-base">💎</span>
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold tracking-wider text-sky-400/80">
                {t.diamonds}
              </div>
              <div className="text-base sm:text-lg font-extrabold text-sky-200 truncate leading-none mt-0.5">
                {formatLangNumber(diamonds)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Level XP Progress Bar */}
      <div className="mt-2">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
          <span className="flex items-center gap-1 font-medium">
            <span>{language === 'bn' ? currentRank.nameBn : currentRank.nameEn}</span>
          </span>
          {nextRank && (
            <span className="text-slate-400">
              {formatLangNumber(coins)} / {formatLangNumber(nextRank.minCoins)}
            </span>
          )}
        </div>
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-white/5">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 transition-all duration-300 ease-out rounded-full shadow-sm shadow-amber-400/50"
            style={{ width: `${rankProgress}%` }}
          />
        </div>
      </div>
    </header>
  );
};
