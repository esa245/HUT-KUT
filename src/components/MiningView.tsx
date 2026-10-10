import React from 'react';
import { Home, Sparkles, Shield, Cpu, Coins, Crown, TrendingUp, ArrowLeft, Clock } from 'lucide-react';
import { MiningUpgrade, Language } from '../types/game';
import { translations, formatNumber, toBengaliDigits } from '../utils/translations';
import { soundManager } from '../utils/audio';

interface MiningViewProps {
  coins: number;
  autoEarn10Min: number;
  autoTimerSecondsLeft: number;
  upgrades: MiningUpgrade[];
  language: Language;
  onUpgrade: (upgradeId: string) => void;
  onBack: () => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Home,
  Sparkles,
  Shield,
  Cpu,
  Coins,
  Crown,
};

export const MiningView: React.FC<MiningViewProps> = ({
  coins,
  autoEarn10Min,
  autoTimerSecondsLeft,
  upgrades,
  language,
  onUpgrade,
  onBack,
}) => {
  const t = translations[language];

  const formatLangNumber = (num: number) => {
    const formatted = formatNumber(num, language);
    return language === 'bn' ? toBengaliDigits(formatted) : formatted;
  };

  const mins = Math.floor(autoTimerSecondsLeft / 60);
  const secs = autoTimerSecondsLeft % 60;
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

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
          <span>⛏️</span>
          <span>{t.mine}</span>
        </div>
      </div>

      {/* Header Banner: 10-Minute Auto Earn System */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-teal-500/15 border border-amber-500/30 mb-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-300 font-medium">{t.autoEarn10Min}</div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 flex items-center gap-1.5">
                <span>+{formatLangNumber(autoEarn10Min)}</span>
                <span className="text-xs text-slate-400 font-normal">{t.per10Min}</span>
              </div>
            </div>
          </div>

          {/* 10-Min Auto Countdown Timer */}
          <div className="flex items-center gap-2 bg-slate-900/90 px-3.5 py-2 rounded-2xl border border-white/10 self-start sm:self-auto shadow-inner">
            <Clock className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">{t.nextAutoIn}</div>
              <div className="text-sm font-mono font-black text-amber-300">
                {language === 'bn' ? toBengaliDigits(timeFormatted) : timeFormatted}
              </div>
            </div>
          </div>
        </div>

        {/* Info Note */}
        <div className="text-[11px] text-amber-200/90 bg-slate-950/60 p-2.5 rounded-2xl border border-white/5 flex items-center gap-2">
          <span className="text-amber-400 text-sm">💡</span>
          <span>{t.auto10MinDesc}</span>
        </div>
      </div>

      {/* Upgrades List */}
      <div className="space-y-2.5">
        {upgrades.map((item) => {
          const Icon = ICON_MAP[item.iconName] || Sparkles;
          const currentCost = Math.round(item.baseCost * Math.pow(1.5, item.level));
          const currentBoost = Math.round(item.basePph * Math.pow(1.3, item.level));
          const canAfford = coins >= currentCost;
          const name = t[item.nameKey as keyof typeof t] || item.nameKey;
          const desc = t[item.descKey as keyof typeof t] || item.descKey;

          return (
            <div
              key={item.id}
              className="p-3 rounded-2xl bg-slate-900/90 border border-white/10 hover:border-amber-500/30 transition-all shadow-md flex items-center justify-between gap-3"
            >
              {/* Icon & Details */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-600/30 to-yellow-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white text-sm truncate">{name}</h4>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/10 font-mono">
                      {t.lvlShort} {language === 'bn' ? toBengaliDigits(item.level) : item.level}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{desc}</p>
                  <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold mt-1">
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                    <span>+{formatLangNumber(currentBoost)} {t.per10Min}</span>
                  </div>
                </div>
              </div>

              {/* Purchase Button */}
              <button
                onClick={() => {
                  if (canAfford) {
                    soundManager.playUpgrade();
                    onUpgrade(item.id);
                  } else {
                    soundManager.playClick();
                  }
                }}
                disabled={!canAfford}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex flex-col items-center justify-center min-w-[76px] ${
                  canAfford
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20 cursor-pointer active:scale-95'
                    : 'bg-slate-800/80 text-slate-500 border border-white/5 cursor-not-allowed opacity-75'
                }`}
              >
                <span className="text-[10px] uppercase font-bold opacity-80">{t.upgrade}</span>
                <span className="flex items-center gap-0.5 font-extrabold text-xs">
                  <span>🪙</span>
                  <span>{formatLangNumber(currentCost)}</span>
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
