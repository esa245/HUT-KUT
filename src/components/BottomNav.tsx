import React from 'react';
import { Home, TrendingUp, Users, Rocket, ListCheck, Wallet } from 'lucide-react';
import { Language } from '../types/game';
import { translations } from '../utils/translations';
import { soundManager } from '../utils/audio';

export type NavTab = 'home' | 'tap' | 'mine' | 'friends' | 'boost' | 'tasks' | 'airdrop';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  language: Language;
  hasTasksAvailable: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  language,
  hasTasksAvailable,
}) => {
  const t = translations[language];

  const tabs: Array<{ id: NavTab; label: string; icon: React.ElementType }> = [
    { id: 'home', label: t.home, icon: Home },
    { id: 'mine', label: t.mine, icon: TrendingUp },
    { id: 'friends', label: t.friends, icon: Users },
    { id: 'boost', label: t.boost, icon: Rocket },
    { id: 'tasks', label: t.tasks, icon: ListCheck },
    { id: 'airdrop', label: t.airdrop, icon: Wallet },
  ];

  return (
    <nav className="w-full bg-slate-950/95 backdrop-blur-xl border-t border-white/10 px-1.5 py-2 flex justify-around items-center z-30 shrink-0">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isCurrentActive = activeTab === tab.id || (tab.id === 'home' && activeTab === 'tap');

        return (
          <button
            key={tab.id}
            onClick={() => {
              soundManager.playClick();
              onTabChange(tab.id);
            }}
            className={`flex flex-col items-center justify-center py-1 px-2 sm:px-3 rounded-2xl transition-all relative cursor-pointer ${
              isCurrentActive
                ? 'text-amber-400 font-extrabold scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {/* Active glow indicator */}
            {isCurrentActive && (
              <span className="absolute -top-2 w-7 sm:w-8 h-1 bg-amber-400 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.9)]" />
            )}

            <div className="relative">
              <Icon className={`w-5 h-5 sm:w-5.5 sm:h-5.5 transition-transform ${isCurrentActive ? 'scale-115 text-amber-400' : ''}`} />
              {tab.id === 'tasks' && hasTasksAvailable && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-slate-900 animate-pulse" />
              )}
            </div>

            <span className="text-[10px] sm:text-[11px] mt-1 font-semibold leading-none truncate max-w-[55px] sm:max-w-none">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

