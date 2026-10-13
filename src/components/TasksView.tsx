import React from 'react';
import {
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import { TaskItem, Language } from '../types/game';
import { translations, formatNumber, toBengaliDigits } from '../utils/translations';
import { soundManager } from '../utils/audio';

interface TasksViewProps {
  tasks: TaskItem[];
  language: Language;
  onClaimTask: (taskId: string) => void;
  onCompleteTaskAction: (task: TaskItem) => void;
  onBack: () => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  language,
  onClaimTask,
  onBack,
}) => {
  const t = translations[language];

  const formatLangNumber = (num: number) => {
    const formatted = formatNumber(num, language);
    return language === 'bn' ? toBengaliDigits(formatted) : formatted;
  };

  const achievementTasks = tasks.filter((task) => task.type === 'achievement' && task.id !== 'reach_lvl3');

  return (
    <div className="flex-1 flex flex-col min-h-0 px-4 py-3 overflow-y-auto pb-24 select-none max-w-4xl mx-auto w-full">
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

      {/* Achievement & Gameplay Missions */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
          {t.achievementTasks}
        </h4>
        <div className="space-y-2">
          {achievementTasks.map((task) => {
            const progress = task.currentProgress || 0;
            const required = task.requiredProgress || 1;
            const progressPercent = Math.min(100, Math.round((progress / required) * 100));

            let title: string;
            if (task.id === 'own_mining_3') {
              title = language === 'bn'
                ? `${toBengaliDigits(required)}টি মাইনিং কার্ড আপগ্রেড করুন`
                : `Upgrade ${required} Mining Cards`;
            } else if (task.id.startsWith('tap_')) {
              title = language === 'bn'
                ? `${formatLangNumber(required)} বার ট্যাপ করুন`
                : `Tap ${formatNumber(required, language)} times`;
            } else {
              title = t[task.titleKey as keyof typeof t] || task.titleKey;
            }

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
    </div>
  );
};

