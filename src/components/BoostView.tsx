import React from 'react';
import { BatteryCharging, Flame, MousePointerClick, BatteryMedium, Gauge, ArrowLeft, Sparkles } from 'lucide-react';
import { BoostItem, Language } from '../types/game';
import { translations, formatNumber, toBengaliDigits } from '../utils/translations';
import { soundManager } from '../utils/audio';

interface BoostViewProps {
  coins: number;
  diamonds: number;
  boostItems: BoostItem[];
  freeRefillsLeft: number;
  freeTurboLeft: number;
  isTurboActive: boolean;
  dailyTapPower: number;
  dailyStreakDay: number;
  lastDailyTapClaimTimestamp: number;
  language: Language;
  onUseRefill: () => void;
  onUseTurbo: () => void;
  onUpgradeBoost: (boostId: BoostItem['id']) => void;
  onClaimDailyTapPower: () => void;
  onBack: () => void;
}

export const BoostView: React.FC<BoostViewProps> = ({
  coins,
  diamonds,
  boostItems,
  freeRefillsLeft,
  freeTurboLeft,
  isTurboActive,
  dailyTapPower,
  dailyStreakDay,
  lastDailyTapClaimTimestamp,
  language,
  onUseRefill,
  onUseTurbo,
  onUpgradeBoost,
  onClaimDailyTapPower,
  onBack,
}) => {
  const t = translations[language];

  const formatLangNumber = (num: number) => {
    const formatted = formatNumber(num, language);
    return language === 'bn' ? toBengaliDigits(formatted) : formatted;
  };

  const BOOST_ICONS: Record<string, React.ElementType> = {
    multitap: MousePointerClick,
    energyLimit: BatteryMedium,
    rechargeSpeed: Gauge,
  };

  // Check 24h cycle for Daily Free Tap Power Growth
  const oneDayMs = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const timeSinceLastClaim = now - lastDailyTapClaimTimestamp;
  const canClaimDailyTap = timeSinceLastClaim >= oneDayMs;
  const msLeft = Math.max(0, oneDayMs - timeSinceLastClaim);
  const hoursLeft = Math.floor(msLeft / (60 * 60 * 1000));
  const minsLeft = Math.floor((msLeft % (60 * 60 * 1000)) / (60 * 1000));

  const multitapBoost = boostItems.find((b) => b.id === 'multitap');
  const multitapLevel = multitapBoost ? multitapBoost.level : 1;
  const dailyStreakBonus = Math.max(0, dailyStreakDay - 1);
  const totalEffectivePower = multitapLevel + dailyTapPower + dailyStreakBonus;

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
          <span>🚀</span>
          <span>{t.boost}</span>
        </div>
      </div>

      {/* Daily Tap Power Growth Card (দিনে দিনে ট্যাপ বাড়ানোর সিস্টেম) */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-sky-500/15 border border-amber-500/30 mb-4 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-white">{t.dailyTapSection}</h4>
              <p className="text-[10px] text-slate-300">{t.dailyTapDesc}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-black text-amber-400">+{dailyTapPower}</span>
            <span className="text-[10px] text-slate-400 block">{language === 'bn' ? 'ফ্রি বৃদ্ধি' : 'Free boost'}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-white/10">
          <div className="text-[11px] text-slate-300">
            <span>{t.totalTapPower}: </span>
            <strong className="text-amber-300 font-black">+{totalEffectivePower}</strong>
            <span className="text-slate-400 text-[10px] ml-1">
              ({t.baseTapPower}: {multitapLevel} + {t.streakTapBonus}: {dailyStreakBonus} + {language === 'bn' ? 'ফ্রি' : 'Free'}: {dailyTapPower})
            </span>
          </div>

          <button
            onClick={() => {
              if (canClaimDailyTap) {
                soundManager.playLevelUp();
                onClaimDailyTapPower();
              } else {
                soundManager.playClick();
              }
            }}
            disabled={!canClaimDailyTap}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer self-start sm:self-auto ${
              canClaimDailyTap
                ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-md shadow-amber-400/20 active:scale-95 animate-pulse'
                : 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'
            }`}
          >
            {canClaimDailyTap ? t.claimDailyTap : `${t.dailyTapNextIn} ${hoursLeft}h ${minsLeft}m`}
          </button>
        </div>
      </div>

      {/* Daily Free Boosters Header */}
      <div className="mb-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
          {language === 'bn' ? 'দৈনিক ফ্রি বুস্টার (২৪ ঘণ্টা)' : 'Daily Free Boosters (24h)'}
        </h3>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Full Energy Refill */}
          <button
            onClick={() => {
              if (freeRefillsLeft > 0) {
                soundManager.playLevelUp();
                onUseRefill();
              } else {
                soundManager.playClick();
              }
            }}
            disabled={freeRefillsLeft <= 0}
            className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
              freeRefillsLeft > 0
                ? 'bg-gradient-to-br from-emerald-950/60 to-slate-900 border-emerald-500/40 hover:border-emerald-400 cursor-pointer shadow-md'
                : 'bg-slate-900/60 border-white/5 opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <BatteryCharging className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-emerald-300 border border-emerald-500/30">
                {language === 'bn' ? toBengaliDigits(freeRefillsLeft) : freeRefillsLeft}/3{' '}
                {language === 'bn' ? 'বাকি' : 'left'}
              </span>
            </div>
            <div>
              <h4 className="font-bold text-white text-xs">{t.fullTank}</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{t.fullTankDesc}</p>
            </div>
          </button>

          {/* Turbo Overdrive */}
          <button
            onClick={() => {
              if (freeTurboLeft > 0 && !isTurboActive) {
                soundManager.playTurbo();
                onUseTurbo();
              } else {
                soundManager.playClick();
              }
            }}
            disabled={freeTurboLeft <= 0 || isTurboActive}
            className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
              freeTurboLeft > 0 && !isTurboActive
                ? 'bg-gradient-to-br from-orange-950/60 to-slate-900 border-orange-500/40 hover:border-orange-400 cursor-pointer shadow-md'
                : 'bg-slate-900/60 border-white/5 opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
                <Flame className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-orange-300 border border-orange-500/30">
                {language === 'bn' ? toBengaliDigits(freeTurboLeft) : freeTurboLeft}/3{' '}
                {language === 'bn' ? 'বাকি' : 'left'}
              </span>
            </div>
            <div>
              <h4 className="font-bold text-white text-xs">{t.turboOverdrive}</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{t.turboDesc}</p>
            </div>
          </button>
        </div>
      </div>

      {/* Permanent Boosters List */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
          {language === 'bn' ? 'স্থায়ী আপগ্রেডসমূহ' : 'Permanent Boosters'}
        </h3>

        <div className="space-y-2.5">
          {boostItems.map((boost) => {
            const Icon = BOOST_ICONS[boost.id] || MousePointerClick;
            const currentCost = Math.round(
              boost.baseCost * Math.pow(boost.costMultiplier, boost.level - 1)
            );
            const isMax = boost.level >= boost.maxLevel;

            // Multitap Level > 2 requires Diamonds!
            const diamondCost = boost.id === 'multitap' && boost.level >= 2 ? (boost.level - 1) * 2 : 0;
            const canAfford = coins >= currentCost && diamonds >= diamondCost && !isMax;

            const name = t[boost.nameKey as keyof typeof t] || boost.nameKey;
            const desc = t[boost.descKey as keyof typeof t] || boost.descKey;

            return (
              <div
                key={boost.id}
                className="p-3 rounded-2xl bg-slate-900/90 border border-white/10 hover:border-amber-500/30 transition-all shadow-md flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-600/30 to-blue-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm truncate">{name}</h4>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/10 font-mono">
                        {t.lvlShort}{' '}
                        {language === 'bn' ? toBengaliDigits(boost.level) : boost.level}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{desc}</p>
                    {/* Multitap Diamond requirement notice */}
                    {boost.id === 'multitap' && boost.level >= 2 && (
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-sky-300 font-semibold">
                        <span>💎</span>
                        <span>{t.multitapDiamondNotice} ({diamondCost} 💎)</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (canAfford) {
                      soundManager.playUpgrade();
                      onUpgradeBoost(boost.id);
                    } else {
                      soundManager.playClick();
                    }
                  }}
                  disabled={!canAfford || isMax}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex flex-col items-center justify-center min-w-[80px] ${
                    isMax
                      ? 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'
                      : canAfford
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20 cursor-pointer active:scale-95'
                      : 'bg-slate-800/80 text-slate-500 border border-white/5 cursor-not-allowed opacity-75'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold opacity-80">
                    {isMax ? t.maxLevelReached : t.upgrade}
                  </span>
                  {!isMax && (
                    <div className="flex flex-col items-center leading-tight mt-0.5">
                      <span className="flex items-center gap-0.5 font-extrabold text-[11px]">
                        <span>🪙</span>
                        <span>{formatLangNumber(currentCost)}</span>
                      </span>
                      {diamondCost > 0 && (
                        <span className={`flex items-center gap-0.5 font-bold text-[10px] ${diamonds >= diamondCost ? 'text-slate-900' : 'text-rose-400'}`}>
                          <span>💎</span>
                          <span>{diamondCost}</span>
                        </span>
                      )}
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
