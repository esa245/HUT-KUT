export type Language = 'bn' | 'en';

export interface FloatingParticle {
  id: string;
  x: number;
  y: number;
  text: string;
  type: 'coin' | 'diamond' | 'turbo';
}

export interface MiningUpgrade {
  id: string;
  nameKey: string;
  descKey: string;
  baseCost: number;
  basePph: number; // profit per hour
  level: number;
  iconName: string;
}

export interface BoostItem {
  id: 'multitap' | 'energyLimit' | 'rechargeSpeed';
  nameKey: string;
  descKey: string;
  baseCost: number;
  level: number;
  maxLevel: number;
  costMultiplier: number;
}

export interface TaskItem {
  id: string;
  titleKey: string;
  rewardCoins: number;
  rewardDiamonds?: number;
  completed: boolean;
  claimed: boolean;
  type: 'social' | 'achievement' | 'checkin';
  actionUrl?: string;
  currentProgress?: number;
  requiredProgress?: number;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  coins: number;
  level: number;
  isUser?: boolean;
}

export interface ReferralFriend {
  id: string;
  name: string;
  joinedAt: string;
  rewardEarned: number;
  diamondsEarned: number;
  level: number;
  isPremium?: boolean;
}

export interface FoxRankInfo {
  level: number;
  nameEn: string;
  nameBn: string;
  minCoins: number;
  maxEnergyBonus: number;
  color: string;
  gradient: string;
}
