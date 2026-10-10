import React, { useState } from 'react';
import { X, Trophy, Award, Crown, Check, ChevronRight, ArrowLeft } from 'lucide-react';
import { FoxRankInfo, LeaderboardEntry, Language } from '../types/game';
import { FOX_RANKS } from '../utils/constants';
import { translations, formatNumber, toBengaliDigits } from '../utils/translations';
import { soundManager } from '../utils/audio';

interface RankModalProps {
  currentRank: FoxRankInfo;
  userCoins: number;
  userLevel: number;
  leaderboard: LeaderboardEntry[];
  language: Language;
  onClose: () => void;
}

export const RankModal: React.FC<RankModalProps> = ({
  currentRank,
  userCoins,
  userLevel,
  leaderboard,
  language,
  onClose,
}) => {
  const t = translations[language];
  const [modalTab, setModalTab] = useState<'ranks' | 'leaderboard'>('ranks');

  const formatLangNumber = (num: number) => {
    const formatted = formatNumber(num, language);
    return language === 'bn' ? toBengaliDigits(formatted) : formatted;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm max-h-[85vh] bg-slate-950 border border-white/10 rounded-3xl flex flex-col overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-3.5 border-b border-white/10 flex items-center justify-between shrink-0">
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs border border-white/10 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>{t.back}</span>
          </button>

          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h3 className="font-extrabold text-xs sm:text-sm text-white">
              {language === 'bn' ? 'পদবী ও লিডারবোর্ড' : 'Ranks & Board'}
            </h3>
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="p-2 border-b border-white/5 flex gap-2 shrink-0 bg-slate-900/60">
          <button
            onClick={() => {
              soundManager.playClick();
              setModalTab('ranks');
            }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              modalTab === 'ranks'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {language === 'bn' ? 'পদবী তালিকা' : 'Rank Tiers'}
          </button>
          <button
            onClick={() => {
              soundManager.playClick();
              setModalTab('leaderboard');
            }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              modalTab === 'leaderboard'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {language === 'bn' ? 'শীর্ষ খেলোয়াড়' : 'Leaderboard'}
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {modalTab === 'ranks' ? (
            // Ranks list
            FOX_RANKS.map((rank) => {
              const isUnlocked = userLevel >= rank.level;
              const isCurrent = currentRank.level === rank.level;

              return (
                <div
                  key={rank.level}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isCurrent
                      ? 'bg-amber-500/15 border-amber-400/60 ring-1 ring-amber-400/40 shadow-sm'
                      : isUnlocked
                      ? 'bg-slate-900/80 border-white/10'
                      : 'bg-slate-900/40 border-white/5 opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                        isCurrent
                          ? 'bg-amber-400 text-slate-950'
                          : isUnlocked
                          ? 'bg-slate-800 text-amber-400 border border-white/10'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {language === 'bn' ? toBengaliDigits(rank.level) : rank.level}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-xs sm:text-sm text-white truncate">
                          {language === 'bn' ? rank.nameBn : rank.nameEn}
                        </h4>
                        {isCurrent && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-black">
                            {language === 'bn' ? 'বর্তমান' : 'ACTIVE'}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {language === 'bn' ? 'প্রয়োজন:' : 'Requires:'}{' '}
                        <span className="text-amber-300 font-bold">
                          {formatLangNumber(rank.minCoins)}
                        </span>{' '}
                        🪙
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-emerald-400 font-bold block">
                      +{formatLangNumber(rank.maxEnergyBonus)} ⚡
                    </span>
                    <span className="text-[9px] text-slate-500">
                      {language === 'bn' ? 'ম্যাক্স এনার্জি' : 'Max Energy'}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            // Leaderboard list
            <div className="space-y-2">
              {/* User Standing card */}
              <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-400/50 mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">
                    #42
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">
                      {language === 'bn' ? 'আপনি (ইউজার)' : 'You (Boss Fox)'}
                    </div>
                    <div className="text-[11px] text-amber-300 font-mono font-bold">
                      {formatLangNumber(userCoins)} 🪙
                    </div>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-amber-400">
                  {t.level} {language === 'bn' ? toBengaliDigits(userLevel) : userLevel}
                </span>
              </div>

              {leaderboard.map((player) => (
                <div
                  key={player.rank}
                  className="p-2.5 rounded-xl bg-slate-900/80 border border-white/5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                        player.rank === 1
                          ? 'bg-amber-400 text-slate-950'
                          : player.rank === 2
                          ? 'bg-slate-300 text-slate-950'
                          : player.rank === 3
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {player.rank <= 3 ? '👑' : `#${player.rank}`}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white truncate max-w-[130px]">
                        {player.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {formatLangNumber(player.coins)} 🪙
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/10 font-bold">
                    {t.level} {language === 'bn' ? toBengaliDigits(player.level) : player.level}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
