import React, { useState } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  Calendar,
  Sparkles,
  Check,
  ArrowLeft,
  AlertTriangle,
  Flame,
  Crown,
  Eye,
  X,
  Clock,
} from 'lucide-react';
import { TaskItem, Language } from '../types/game';
import { DAILY_STREAK_REWARDS, getDailyStreakReward, DailyStreakReward } from '../utils/constants';
import { translations, formatNumber, toBengaliDigits } from '../utils/translations';
import { soundManager } from '../utils/audio';

interface TasksViewProps {
  tasks: TaskItem[];
  dailyStreakDay: number;
  lastDailyClaimTimestamp: number;
  streakResetNotice?: boolean;
  language: Language;
  onClaimDailyStreak: () => void;
  onResetDailyStreak?: () => void;
  onClaimTask: (taskId: string) => void;
  onCompleteTaskAction: (task: TaskItem) => void;
  onBack: () => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  dailyStreakDay,
  lastDailyClaimTimestamp,
  streakResetNotice,
  language,
  onClaimDailyStreak,
  onResetDailyStreak,
  onClaimTask,
  onCompleteTaskAction,
  onBack,
}) => {
  const t = translations[language];
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [showAll100DaysModal, setShowAll100DaysModal] = useState(false);

  // Time calculations for 24h claim & 48h streak expiration
  const oneDayMs = 24 * 60 * 60 * 1000;
  const twoDaysMs = 48 * 60 * 60 * 1000;
  const now = Date.now();
  const timeSinceClaim = lastDailyClaimTimestamp > 0 ? now - lastDailyClaimTimestamp : oneDayMs;
  // Allow claim anytime for testing/smooth gameplay without waiting 24h
  const canClaimDaily = true;

  // Streak expiration countdown (must claim before 48h to preserve streak)
  const msUntilStreakReset = Math.max(0, twoDaysMs - timeSinceClaim);
  const hoursUntilReset = Math.floor(msUntilStreakReset / (3600 * 1000));
  const minsUntilReset = Math.floor((msUntilStreakReset % (3600 * 1000)) / (60 * 1000));

  const formatLangNumber = (num: number) => {
    const formatted = formatNumber(num, language);
    return language === 'bn' ? toBengaliDigits(formatted) : formatted;
  };

  const currentReward = DAILY_STREAK_REWARDS[dailyStreakDay - 1] || getDailyStreakReward(dailyStreakDay);

  // Key milestones to highlight: Days 20, 50, 75, 100
  const milestoneDays = [20, 50, 75, 100];

  // Window of ±3 days around current day for quick view
  const windowStart = Math.max(1, Math.min(94, dailyStreakDay - 2));
  const visibleDays = DAILY_STREAK_REWARDS.slice(windowStart - 1, windowStart + 6);

  const socialTasks = tasks.filter((task) => task.type === 'social');
  const achievementTasks = tasks.filter((task) => task.type === 'achievement');

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
          <span>📋</span>
          <span>{t.tasks}</span>
        </div>
      </div>

      {/* 100-Day Daily Streak Section */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-950/50 via-slate-900 to-slate-950 border border-amber-500/40 mb-4 shadow-xl relative overflow-hidden">
        {/* Glow corner */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Missed Day Reset Alert Notice */}
        {streakResetNotice && (
          <div className="mb-3 p-2.5 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs font-bold flex items-center gap-2 animate-pulse">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{t.streakResetAlert}</span>
          </div>
        )}

        {/* Header: Title and Streak Day Counter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20 shrink-0">
              <Flame className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-white">{t.dailyStreak}</h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold">
                  {language === 'bn' ? `দিন ${toBengaliDigits(dailyStreakDay)} / ১০০` : `Day ${dailyStreakDay} / 100`}
                </span>
              </div>
              <p className="text-[11px] text-amber-200/80 mt-0.5">{t.dailyStreakSubtitle}</p>
            </div>
          </div>

          {/* Claim Action Button & Reset Button */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => {
                soundManager.playLevelUp();
                onClaimDailyStreak();
              }}
              className="py-2 px-4 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 shadow-lg shadow-amber-400/30 active:scale-95 animate-pulse"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {t.claimDaily} {language === 'bn' ? toBengaliDigits(dailyStreakDay) : dailyStreakDay}
              </span>
            </button>
            {onResetDailyStreak && (
              <button
                onClick={() => {
                  soundManager.playClick();
                  onResetDailyStreak();
                }}
                title={language === 'bn' ? 'স্ট্রিক রিসেট করুন' : 'Reset Streak'}
                className="py-2 px-2.5 rounded-xl text-[11px] font-bold bg-slate-800 hover:bg-rose-950/80 text-slate-300 hover:text-rose-200 border border-white/10 hover:border-rose-500/40 transition-all cursor-pointer"
              >
                🔄 {language === 'bn' ? 'রিসেট' : 'Reset'}
              </button>
            )}
          </div>
        </div>

        {/* Warning banner: Miss 1 day and streak resets to Day 1! */}
        <div className="p-2 px-3 rounded-xl bg-slate-950/80 border border-white/10 flex flex-wrap items-center justify-between gap-2 text-[10.5px] mb-3">
          <div className="flex items-center gap-1.5 text-amber-300 font-medium">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{t.dailyStreakWarning}</span>
          </div>

          {lastDailyClaimTimestamp > 0 && timeSinceClaim < twoDaysMs && (
            <div className="flex items-center gap-1 text-slate-300 font-mono text-[10px]">
              <Clock className="w-3 h-3 text-sky-400" />
              <span>{t.streakTimeRemaining}: <strong className="text-amber-400">{hoursUntilReset}h {minsUntilReset}m</strong></span>
            </div>
          )}
        </div>

        {/* Active 7-Day Window Carousel */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 px-0.5">
            <span>{language === 'bn' ? `বর্তমান পর্ব (দিন ${toBengaliDigits(windowStart)} - ${toBengaliDigits(windowStart + visibleDays.length - 1)})` : `Current Range (Days ${windowStart} - ${windowStart + visibleDays.length - 1})`}</span>
            <button
              onClick={() => {
                soundManager.playClick();
                setShowAll100DaysModal(true);
              }}
              className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 transition-colors cursor-pointer text-xs"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{t.allDaysModalBtn}</span>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {visibleDays.map((reward) => {
              const isCompleted = reward.day < dailyStreakDay;
              const isCurrent = reward.day === dailyStreakDay;

              return (
                <div
                  key={reward.day}
                  className={`flex flex-col items-center justify-between py-2 px-1 rounded-xl border text-center transition-all ${
                    isCurrent
                      ? 'bg-amber-500/25 border-amber-400 text-amber-300 ring-2 ring-amber-400/50 shadow-md scale-105'
                      : isCompleted
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400 opacity-90'
                      : reward.isMilestone
                      ? 'bg-purple-950/40 border-purple-500/30 text-purple-300'
                      : 'bg-slate-900/60 border-white/5 text-slate-400'
                  }`}
                >
                  <span className="text-[10px] font-bold">
                    {language === 'bn' ? `দিন ${toBengaliDigits(reward.day)}` : `D${reward.day}`}
                  </span>
                  <span className="text-base my-0.5">
                    {isCompleted ? '✓' : reward.day === 100 ? '👑' : reward.diamonds > 0 ? '💎' : '🪙'}
                  </span>
                  <span className="text-[9px] font-mono font-bold leading-tight truncate max-w-full">
                    +{formatLangNumber(reward.coins)}
                  </span>
                  {reward.diamonds > 0 && (
                    <span className="text-[8.5px] font-bold text-sky-300 leading-none">
                      +{reward.diamonds}💎
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Major Milestones Preview (Days 20, 50, 75, 100) */}
        <div>
          <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-0.5">
            {t.milestonesTitle}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {milestoneDays.map((mDay) => {
              const mReward = getDailyStreakReward(mDay);
              const isReached = dailyStreakDay >= mDay;

              return (
                <div
                  key={mDay}
                  className={`p-2.5 rounded-2xl border flex items-center gap-2 ${
                    isReached
                      ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-900/80 border-white/10 text-slate-300'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                    mDay === 100
                      ? 'bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 shadow-md'
                      : 'bg-slate-800 text-amber-400 border border-white/10'
                  }`}>
                    {mDay === 100 ? '👑' : `${mDay}`}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold truncate">
                      {language === 'bn' ? `দিন ${toBengaliDigits(mDay)}` : `Day ${mDay}`}
                    </div>
                    <div className="text-[10px] font-extrabold text-amber-300 truncate">
                      +{formatLangNumber(mReward.coins)} 🪙
                    </div>
                    <div className="text-[9.5px] font-bold text-sky-300">
                      +{mReward.diamonds} 💎
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Community Tasks */}
      <div className="mb-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
          {t.socialTasks}
        </h4>
        <div className="space-y-2">
          {socialTasks.map((task) => {
            const title = t[task.titleKey as keyof typeof t] || task.titleKey;

            return (
              <div
                key={task.id}
                className="p-3 rounded-2xl bg-slate-900/90 border border-white/10 hover:border-amber-500/30 transition-all flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center text-amber-400 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h5 className="font-bold text-white text-xs sm:text-sm truncate">{title}</h5>
                    <div className="flex items-center gap-2 mt-0.5 text-xs">
                      <span className="text-amber-400 font-bold flex items-center gap-0.5">
                        🪙 +{formatLangNumber(task.rewardCoins)}
                      </span>
                      {task.rewardDiamonds && (
                        <span className="text-sky-300 font-bold flex items-center gap-0.5">
                          💎 +{formatLangNumber(task.rewardDiamonds)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {task.claimed ? (
                  <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-950/50 border border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t.claimed}</span>
                  </div>
                ) : task.completed ? (
                  <button
                    onClick={() => {
                      soundManager.playDiamond();
                      onClaimTask(task.id);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer animate-pulse"
                  >
                    {t.claimReward}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (task.id === 'invite_friend') {
                        navigator.clipboard?.writeText(
                          window.location.href + '?ref=fox' + Math.floor(Math.random() * 1000)
                        );
                        setCopiedInvite(true);
                        setTimeout(() => setCopiedInvite(false), 2000);
                      }
                      soundManager.playClick();
                      onCompleteTaskAction(task);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-white/10 flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <span>{task.id === 'invite_friend' && copiedInvite ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : t.go}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievement & Gameplay Missions */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
          {t.achievementTasks}
        </h4>
        <div className="space-y-2">
          {achievementTasks.map((task) => {
            const title = t[task.titleKey as keyof typeof t] || task.titleKey;
            const progress = task.currentProgress || 0;
            const required = task.requiredProgress || 1;
            const progressPercent = Math.min(100, Math.round((progress / required) * 100));

            return (
              <div
                key={task.id}
                className="p-3 rounded-2xl bg-slate-900/90 border border-white/10 hover:border-amber-500/30 transition-all flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h5 className="font-bold text-white text-xs sm:text-sm truncate">{title}</h5>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {language === 'bn' ? toBengaliDigits(progress) : progress}/
                      {language === 'bn' ? toBengaliDigits(required) : required}
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-1.5">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-amber-400 font-bold flex items-center gap-0.5">
                      🪙 +{formatLangNumber(task.rewardCoins)}
                    </span>
                    {task.rewardDiamonds && (
                      <span className="text-sky-300 font-bold flex items-center gap-0.5">
                        💎 +{formatLangNumber(task.rewardDiamonds)}
                      </span>
                    )}
                  </div>
                </div>

                {task.claimed ? (
                  <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-950/50 border border-emerald-500/20 shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t.claimed}</span>
                  </div>
                ) : task.completed ? (
                  <button
                    onClick={() => {
                      soundManager.playDiamond();
                      onClaimTask(task.id);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer animate-pulse shrink-0"
                  >
                    {t.claimReward}
                  </button>
                ) : (
                  <div className="text-[11px] font-bold text-slate-500 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-white/5 shrink-0">
                    {progressPercent}%
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Complete 100-Day Streak Modal (১০০ দিনের পুরো তালিকা) */}
      {showAll100DaysModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5">
          <div className="w-full max-w-2xl max-h-[88vh] bg-slate-950 border border-amber-500/40 rounded-3xl flex flex-col overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-slate-900/80">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-sm sm:text-base text-white">
                  {language === 'bn' ? '১০০ দিনের সম্পূর্ণ ডেইলি স্ট্রিক ম্যাট্রিক্স' : 'Complete 100-Day Streak Matrix'}
                </h3>
              </div>
              <button
                onClick={() => {
                  soundManager.playClick();
                  setShowAll100DaysModal(false);
                }}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Info Note */}
            <div className="p-3 bg-amber-500/10 border-b border-white/5 text-[11px] text-amber-200 font-medium flex items-center gap-2 shrink-0">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{t.dailyStreakWarning}</span>
            </div>

            {/* 100-Day Grid */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 gap-2">
              {DAILY_STREAK_REWARDS.map((reward) => {
                const isCompleted = reward.day < dailyStreakDay;
                const isCurrent = reward.day === dailyStreakDay;

                return (
                  <div
                    key={reward.day}
                    className={`flex flex-col items-center justify-between p-2 rounded-2xl border text-center transition-all ${
                      isCurrent
                        ? 'bg-amber-500/30 border-amber-400 text-amber-300 ring-2 ring-amber-400 shadow-md scale-105'
                        : isCompleted
                        ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                        : reward.isMilestone
                        ? 'bg-purple-950/40 border-purple-500/40 text-purple-300'
                        : 'bg-slate-900/70 border-white/5 text-slate-400'
                    }`}
                  >
                    <span className="text-[10px] font-black">
                      {language === 'bn' ? `দিন ${toBengaliDigits(reward.day)}` : `D${reward.day}`}
                    </span>
                    <span className="text-base my-0.5">
                      {isCompleted ? '✓' : reward.day === 100 ? '👑' : reward.diamonds > 0 ? '💎' : '🪙'}
                    </span>
                    <span className="text-[9px] font-mono font-bold leading-tight truncate max-w-full">
                      +{formatLangNumber(reward.coins)}
                    </span>
                    {reward.diamonds > 0 && (
                      <span className="text-[8px] font-black text-sky-300">
                        +{reward.diamonds}💎
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-white/10 bg-slate-900/60 flex items-center justify-between text-xs text-slate-300 shrink-0">
              <span>
                {language === 'bn'
                  ? `আপনার বর্তমান অবস্থান: দিন ${toBengaliDigits(dailyStreakDay)}`
                  : `Current Progress: Day ${dailyStreakDay} of 100`}
              </span>
              <button
                onClick={() => setShowAll100DaysModal(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer"
              >
                {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
