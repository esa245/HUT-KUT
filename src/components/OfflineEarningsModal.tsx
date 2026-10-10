import React from 'react';
import { Sparkles, Coins, Check } from 'lucide-react';
import { Language } from '../types/game';
import { translations, formatNumber, toBengaliDigits } from '../utils/translations';
import { soundManager } from '../utils/audio';

interface OfflineEarningsModalProps {
  amount: number;
  hoursAway: number;
  language: Language;
  onClaim: () => void;
}

export const OfflineEarningsModal: React.FC<OfflineEarningsModalProps> = ({
  amount,
  hoursAway,
  language,
  onClaim,
}) => {
  const t = translations[language];

  const formatLangNumber = (num: number) => {
    const formatted = formatNumber(num, language);
    return language === 'bn' ? toBengaliDigits(formatted) : formatted;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/40 rounded-3xl p-6 text-center shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-amber-500/30 text-slate-950">
          <Coins className="w-8 h-8" />
        </div>

        <h3 className="text-lg font-black text-white mb-1">{t.offlineModalTitle}</h3>
        <p className="text-xs text-slate-300 mb-4">{t.offlineModalDesc}</p>

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-5">
          <div className="text-xs text-amber-300/80 font-bold uppercase tracking-wider mb-1">
            {t.offlineClaimed}
          </div>
          <div className="text-3xl font-black text-amber-400 flex items-center justify-center gap-1.5">
            <span>+{formatLangNumber(amount)}</span>
            <span className="text-lg">🪙</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {language === 'bn'
              ? `বিগত ${toBengaliDigits(hoursAway.toFixed(1))} ঘণ্টার মাইনিং প্রফিট`
              : `Earned from ${hoursAway.toFixed(1)}h of offline mining`}
          </div>
        </div>

        <button
          onClick={() => {
            soundManager.playDiamond();
            onClaim();
          }}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/30 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{t.claimOffline}</span>
        </button>
      </div>
    </div>
  );
};
