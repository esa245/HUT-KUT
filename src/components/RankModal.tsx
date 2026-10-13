import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Trophy,
  ArrowLeft,
  Crown,
  Search,
  Radio,
  Flame,
  Target,
  Sparkles,
  RefreshCw,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { FoxRankInfo, Language, LeaderboardEntry } from '../types/game';
import { FOX_RANKS } from '../utils/constants';
import { translations, toBengaliDigits } from '../utils/translations';
import { soundManager } from '../utils/audio';
import { listenToGlobalLeaderboard } from '../utils/firebase';

interface RankModalProps {
  currentRank: FoxRankInfo;
  userCoins: number;
  userLevel: number;
  userAirdropCode: string;
  language: Language;
  onClose: () => void;
}

export const RankModal: React.FC<RankModalProps> = ({
  currentRank,
  userCoins,
  userLevel,
  userAirdropCode,
  language,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'ranks'>('leaderboard');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number>(1);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const userRowRef = useRef<HTMLDivElement | null>(null);
  const listContainerRef = useRef<HTMLDivElement | null>(null);

  // Subscribe to Firebase Realtime Database Leaderboard
  useEffect(() => {
    const unsubscribe = listenToGlobalLeaderboard(
      userAirdropCode,
      { coins: userCoins, level: userLevel, name: `You #${userAirdropCode}` },
      (lb, rank, isConnected) => {
        if (lb && lb.length > 0) {
          setLeaderboard(lb);
        }
        if (rank > 0) {
          setUserRank(rank);
        }
        if (isConnected !== undefined) {
          setIsLiveConnected(isConnected);
        }
      }
    );
    return () => unsubscribe();
  }, [userAirdropCode, userCoins, userLevel]);

  // Compute coins needed to reach next rank
  const { playerAhead, coinsNeededToClimb } = useMemo(() => {
    if (userRank <= 1) {
      return { playerAhead: null, coinsNeededToClimb: 0 };
    }
    const ahead = leaderboard.find((p) => p.rank === userRank - 1);
    if (!ahead) {
      return { playerAhead: null, coinsNeededToClimb: 0 };
    }
    const diff = Math.max(0, ahead.coins - userCoins + 1);
    return { playerAhead: ahead, coinsNeededToClimb: diff };
  }, [leaderboard, userRank, userCoins]);

  // Filtered leaderboard based on search query
  const filteredLeaderboard = useMemo(() => {
    if (!searchQuery.trim()) return leaderboard;
    const query = searchQuery.toLowerCase().trim();
    return leaderboard.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        (item.airdropCode && item.airdropCode.toLowerCase().includes(query)) ||
        String(item.rank).includes(query)
    );
  }, [leaderboard, searchQuery]);

  const formatCoins = (coins: number) => {
    if (coins >= 1000000000) {
      return (coins / 1000000000).toFixed(2) + 'B';
    }
    if (coins >= 1000000) {
      return (coins / 1000000).toFixed(2) + 'M';
    }
    if (coins >= 1000) {
      return (coins / 1000).toFixed(2) + 'K';
    }
    return coins.toLocaleString();
  };

  const handleScrollToUser = () => {
    soundManager.playClick();
    setHighlightedId(userAirdropCode);
    setTimeout(() => {
      if (userRowRef.current) {
        userRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);

    setTimeout(() => {
      setHighlightedId(null);
    }, 2500);
  };

  const handleRefresh = () => {
    soundManager.playClick();
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-sm max-h-[92vh] bg-[#070b14] border border-[#1e2e4a] rounded-3xl flex flex-col overflow-hidden shadow-2xl relative">
        {/* Top Header Bar */}
        <div className="p-3.5 border-b border-[#18233a] bg-[#0a101f] flex items-center justify-between shrink-0">
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#131d33] hover:bg-[#1a2744] text-amber-400 font-bold text-xs border border-[#233554] transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 stroke-[3]" />
            <span>{language === 'bn' ? 'ফিরে যান' : 'Back'}</span>
          </button>

          <div className="flex items-center gap-2 font-black text-sm text-white">
            <Trophy className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>{language === 'bn' ? 'র‍্যাংক ও লিডারবোর্ড' : 'Ranks & Board'}</span>
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="p-1.5 rounded-full bg-[#131d33] text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Toggle: Leaderboard vs Rank Tiers */}
        <div className="p-3 bg-[#070b14] shrink-0 border-b border-[#111c2f]/70">
          <div className="p-1 rounded-2xl bg-[#0d1627] border border-[#1a2845] flex items-center gap-1">
            <button
              onClick={() => {
                soundManager.playClick();
                setActiveTab('leaderboard');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'leaderboard'
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'লাইভ লিডারবোর্ড' : 'Leaderboard'}</span>
            </button>
            <button
              onClick={() => {
                soundManager.playClick();
                setActiveTab('ranks');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'ranks'
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'র‍্যাংক টায়ার' : 'Rank Tiers'}</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div
          ref={listContainerRef}
          className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3 custom-scrollbar"
        >
          {activeTab === 'ranks' ? (
            // Rank Tiers View
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
                      ? 'bg-[#0c1527] border-[#1e2e4a]'
                      : 'bg-[#0c1527]/50 border-white/5 opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                        isCurrent
                          ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/30'
                          : 'bg-slate-800 text-amber-400'
                      }`}
                    >
                      {rank.level}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white">
                        {language === 'bn' ? rank.nameBn : rank.nameEn}
                      </h4>
                      <span className="text-[10px] text-amber-300 font-bold">
                        {formatCoins(rank.minCoins)} 🪙
                      </span>
                    </div>
                  </div>

                  {isCurrent && (
                    <span className="px-2 py-0.5 rounded-lg bg-amber-400 text-slate-950 text-[10px] font-black uppercase">
                      {language === 'bn' ? 'বর্তমান' : 'CURRENT'}
                    </span>
                  )}
                </div>
              );
            })
          ) : (
            // Live Real-Time Leaderboard View
            <>
              {/* CURRENT USER PROMINENT RANK CARD (Real-time Firebase RTDB Position) */}
              <div className="p-3.5 rounded-2xl border-2 border-amber-400 bg-gradient-to-br from-amber-500/25 via-[#182642] to-[#0a1222] shadow-2xl relative overflow-hidden ring-2 ring-amber-400/40">
                {/* Glow effect */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

                {/* Top Badge */}
                <div className="flex items-center justify-between mb-2.5">
                  <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[9px] uppercase tracking-wider shadow-sm flex items-center gap-1">
                    <Crown className="w-2.5 h-2.5 fill-slate-950" />
                    <span>{language === 'bn' ? 'আপনার লাইভ র‍্যাংক অবস্থান' : 'YOUR LIVE RANK POSITION'}</span>
                  </span>

                  <button
                    onClick={handleScrollToUser}
                    className="text-[10px] font-bold text-amber-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/30"
                  >
                    <Target className="w-3 h-3 text-amber-400" />
                    <span>{language === 'bn' ? 'তালিকায় দেখুন' : 'Locate In List'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Rank Badge with Crown */}
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-500 to-amber-600 text-slate-950 font-black flex flex-col items-center justify-center shadow-lg shadow-amber-500/40 border border-amber-200">
                        <span className="text-[9px] leading-none font-bold uppercase text-slate-900 tracking-tight">
                          RANK
                        </span>
                        <span className="leading-tight text-base font-black">
                          #{language === 'bn' ? toBengaliDigits(userRank) : userRank}
                        </span>
                      </div>
                      {userRank === 1 && (
                        <div className="absolute -top-1.5 -right-1.5 p-0.5 bg-yellow-300 rounded-full text-slate-950 shadow">
                          <Crown className="w-3 h-3 fill-slate-950" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-black text-xs text-white truncate">
                          {language === 'bn' ? `আপনি (#${userAirdropCode})` : `You (#${userAirdropCode})`}
                        </h4>
                        <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-mono text-[10px] font-black border border-amber-400/30">
                          ID: {userAirdropCode}
                        </span>
                      </div>

                      <div className="text-xs font-black text-amber-400 flex items-center gap-1.5 mt-0.5">
                        <span className="text-sm">{formatCoins(userCoins)}</span>
                        <span>🪙</span>
                        <span className="text-slate-300 text-[10px] font-semibold">
                          ({language === 'bn' ? `${toBengaliDigits(userRank)} নং স্থানে` : `Rank #${userRank}`})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="px-2.5 py-1 rounded-xl bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-400/20">
                      LVL {language === 'bn' ? toBengaliDigits(userLevel) : userLevel}
                    </div>
                  </div>
                </div>

                {/* Subtext: Competitive Context & Next Goal */}
                <div className="mt-2.5 pt-2 border-t border-amber-400/20 flex items-center justify-between text-[10px]">
                  {userRank === 1 ? (
                    <div className="text-amber-300 font-black flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      <span>{language === 'bn' ? '👑 আপনি সবার শীর্ষে আছেন (Rank #1 Champion)!' : '👑 You lead the leaderboard as #1 Champion!'}</span>
                    </div>
                  ) : (
                    <div className="text-amber-200 font-medium flex items-center gap-1 min-w-0">
                      <Flame className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="truncate">
                        {language === 'bn'
                          ? `পরবর্তী স্থান (#${toBengaliDigits(userRank - 1)}) অতিক্রম করতে দরকার:`
                          : `To overtake #${userRank - 1}:`}{' '}
                        <strong className="text-amber-400 font-black">
                          +{formatCoins(coinsNeededToClimb)} 🪙
                        </strong>
                      </span>
                    </div>
                  )}

                  <span className="text-slate-400 text-[9px] shrink-0 ml-1">
                    {language === 'bn'
                      ? `${toBengaliDigits(leaderboard.length)} জনের মধ্যে`
                      : `of ${leaderboard.length}`}
                  </span>
                </div>
              </div>

              {/* Real-time Status & Search Controls */}
              <div className="space-y-2">
                {/* Live RTDB Connection Status & Total Count Bar */}
                <div className="flex items-center justify-between px-1 py-0.5 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isLiveConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                      }`}
                    />
                    <span className="text-slate-300 font-bold text-[10px] flex items-center gap-1">
                      <span>{language === 'bn' ? 'রিয়েল-টাইম ডাটাবেজ' : 'Realtime Database'}</span>
                      <span
                        className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                          isLiveConnected
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {isLiveConnected
                          ? language === 'bn'
                            ? 'লাইভ সিঙ্ক'
                            : 'Live'
                          : language === 'bn'
                          ? 'অফলাইন'
                          : 'Offline'}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">
                      {language === 'bn'
                        ? `মোট ${toBengaliDigits(leaderboard.length)} জন খেলোয়াড়`
                        : `${leaderboard.length} Players`}
                    </span>
                    <button
                      onClick={handleRefresh}
                      title="Sync RTDB"
                      className="p-1 rounded-lg bg-[#111c30] text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      language === 'bn'
                        ? 'খেলোয়াড়ের নাম বা ৬-সংখ্যার আইডি দিয়ে খুঁজুন...'
                        : 'Search by player name or 6-digit ID...'
                    }
                    className="w-full pl-8 pr-7 py-2 rounded-xl bg-[#0c1527] border border-[#1e2e4a] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/40"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Leaderboard Player List */}
              <div className="space-y-2 pt-1">
                {filteredLeaderboard.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    {language === 'bn'
                      ? 'কোনো খেলোয়াড় পাওয়া যায়নি।'
                      : 'No players found matching your search.'}
                  </div>
                ) : (
                  filteredLeaderboard.map((entry, index) => {
                    const isCrown1 = entry.rank === 1;
                    const isCrown2 = entry.rank === 2;
                    const isCrown3 = entry.rank === 3;
                    const isCurrentUser =
                      entry.isUser || entry.airdropCode === userAirdropCode;
                    const isHighlighted = highlightedId === entry.airdropCode;

                    return (
                      <div
                        key={entry.airdropCode || index}
                        ref={isCurrentUser ? userRowRef : null}
                        id={`player-row-${entry.airdropCode}`}
                        className={`p-3 rounded-2xl border flex items-center justify-between gap-2 shadow-sm transition-all duration-300 ${
                          isCurrentUser
                            ? isHighlighted
                              ? 'bg-amber-500/30 border-amber-300 ring-4 ring-amber-400 scale-[1.02] shadow-xl'
                              : 'bg-gradient-to-r from-amber-500/20 via-[#132038] to-[#0c1527] border-amber-400/80 ring-1 ring-amber-400/50 shadow-md'
                            : isCrown1
                            ? 'bg-[#151c2d] border-amber-500/50'
                            : isCrown2
                            ? 'bg-[#11192b] border-sky-500/40'
                            : isCrown3
                            ? 'bg-[#11192b] border-orange-500/40'
                            : 'bg-[#0c1527] border-[#1e2e4a] hover:border-[#2b4168]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Rank Icon / Badge */}
                          {isCrown1 ? (
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30 border border-amber-300">
                              <Crown className="w-4 h-4 fill-slate-950 text-slate-950" />
                            </div>
                          ) : isCrown2 ? (
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-slate-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 shadow-md shadow-sky-500/20 border border-sky-300">
                              <span className="font-black text-xs">#2</span>
                            </div>
                          ) : isCrown3 ? (
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-amber-700 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 shadow-md shadow-orange-500/20 border border-orange-300">
                              <span className="font-black text-xs">#3</span>
                            </div>
                          ) : (
                            <div
                              className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                                isCurrentUser
                                  ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                                  : 'bg-[#15233c] text-slate-400'
                              }`}
                            >
                              #{language === 'bn' ? toBengaliDigits(entry.rank) : entry.rank}
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4
                                className={`font-bold text-xs truncate max-w-[125px] ${
                                  isCurrentUser
                                    ? 'text-amber-300 font-black'
                                    : isCrown1
                                    ? 'text-amber-200'
                                    : 'text-white'
                                }`}
                              >
                                {isCurrentUser
                                  ? language === 'bn'
                                    ? `আপনি (#${userAirdropCode})`
                                    : `You (#${userAirdropCode})`
                                  : `ID: #${entry.airdropCode || '000000'}`}
                              </h4>
                              {isCurrentUser ? (
                                <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 text-[9px] font-black uppercase shadow-xs">
                                  {language === 'bn' ? 'আপনি' : 'YOU'}
                                </span>
                              ) : entry.airdropCode ? (
                                <span className="px-1 py-0.2 rounded bg-slate-800 text-slate-400 text-[9px] font-mono">
                                  #{entry.airdropCode}
                                </span>
                              ) : null}
                            </div>
                            <div className="text-xs font-semibold text-slate-300 flex items-center gap-1 mt-0.5">
                              <span
                                className={
                                  isCurrentUser
                                    ? 'text-amber-400 font-black text-xs'
                                    : 'text-slate-200 font-bold'
                                }
                              >
                                {formatCoins(entry.coins)}
                              </span>
                              <span>🪙</span>
                            </div>
                          </div>
                        </div>

                        {/* Level Badge on right */}
                        <div
                          className={`px-2.5 py-1 rounded-lg border text-[10px] font-black shrink-0 ${
                            isCurrentUser
                              ? 'bg-amber-400/20 border-amber-400/40 text-amber-300'
                              : isCrown1
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                              : 'bg-[#15233c] border-white/5 text-slate-300'
                          }`}
                        >
                          LVL {language === 'bn' ? toBengaliDigits(entry.level || 1) : entry.level || 1}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
