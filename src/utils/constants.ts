import { FoxRankInfo, MiningUpgrade, BoostItem, TaskItem, LeaderboardEntry } from '../types/game';

export const FOX_RANKS: FoxRankInfo[] = [
  {
    level: 1,
    nameEn: 'Bronze Fox',
    nameBn: 'ব্রোঞ্জ ফক্স',
    minCoins: 0,
    maxEnergyBonus: 0,
    color: '#cd7f32',
    gradient: 'from-amber-700 to-amber-900',
  },
  {
    level: 2,
    nameEn: 'Silver Prowler',
    nameBn: 'সিলভার প্রাউলার',
    minCoins: 500,
    maxEnergyBonus: 100,
    color: '#94a3b8',
    gradient: 'from-slate-400 to-slate-600',
  },
  {
    level: 3,
    nameEn: 'Golden Fox',
    nameBn: 'গোল্ডেন ফক্স',
    minCoins: 2500,
    maxEnergyBonus: 250,
    color: '#fbbf24',
    gradient: 'from-amber-400 to-yellow-600',
  },
  {
    level: 4,
    nameEn: 'Diamond Striker',
    nameBn: 'ডায়মন্ড স্ট্রাইকার',
    minCoins: 10000,
    maxEnergyBonus: 450,
    color: '#38bdf8',
    gradient: 'from-sky-400 to-blue-600',
  },
  {
    level: 5,
    nameEn: 'Master Loys',
    nameBn: 'মাস্টার লয়েস',
    minCoins: 35000,
    maxEnergyBonus: 700,
    color: '#c084fc',
    gradient: 'from-purple-500 to-indigo-700',
  },
  {
    level: 6,
    nameEn: 'Grandmaster Hut Kut',
    nameBn: 'গ্র্যান্ডমাস্টার হাট কুট',
    minCoins: 100000,
    maxEnergyBonus: 1000,
    color: '#f43f5e',
    gradient: 'from-rose-500 to-amber-600',
  },
  {
    level: 7,
    nameEn: 'Legendary Emperor Fox',
    nameBn: 'লিজেন্ডারি ফক্স সম্রাট',
    minCoins: 300000,
    maxEnergyBonus: 1500,
    color: '#eab308',
    gradient: 'from-yellow-300 via-amber-500 to-orange-600',
  },
];

// Mining upgrades: Auto earn per 10 minutes (১০ মিনিট পর পর অটো ব্যালেন্সে যোগ হবে)
export const INITIAL_MINING_UPGRADES: MiningUpgrade[] = [
  {
    id: 'fox_den',
    nameKey: 'upgrade_fox_den',
    descKey: 'upgrade_fox_den_desc',
    baseCost: 80,
    basePph: 3, // +3 coins every 10 minutes
    level: 0,
    iconName: 'Home',
  },
  {
    id: 'hutkut_autotapper',
    nameKey: 'upgrade_autotapper',
    descKey: 'upgrade_autotapper_desc',
    baseCost: 280,
    basePph: 8, // +8 coins every 10 minutes
    level: 0,
    iconName: 'Sparkles',
  },
  {
    id: 'golden_claw_vault',
    nameKey: 'upgrade_vault',
    descKey: 'upgrade_vault_desc',
    baseCost: 950,
    basePph: 25, // +25 coins every 10 minutes
    level: 0,
    iconName: 'Shield',
  },
  {
    id: 'loys_mining_rig',
    nameKey: 'upgrade_rig',
    descKey: 'upgrade_rig_desc',
    baseCost: 3200,
    basePph: 75, // +75 coins every 10 minutes
    level: 0,
    iconName: 'Cpu',
  },
  {
    id: 'fox_dex_pool',
    nameKey: 'upgrade_pool',
    descKey: 'upgrade_pool_desc',
    baseCost: 11000,
    basePph: 200, // +200 coins every 10 minutes
    level: 0,
    iconName: 'Coins',
  },
  {
    id: 'metaverse_syndicate',
    nameKey: 'upgrade_syndicate',
    descKey: 'upgrade_syndicate_desc',
    baseCost: 35000,
    basePph: 600, // +600 coins every 10 minutes
    level: 0,
    iconName: 'Crown',
  },
];

export const INITIAL_BOOST_ITEMS: BoostItem[] = [
  {
    id: 'multitap',
    nameKey: 'boost_multitap',
    descKey: 'boost_multitap_desc',
    baseCost: 150,
    level: 1,
    maxLevel: 20,
    costMultiplier: 2.0,
  },
  {
    id: 'energyLimit',
    nameKey: 'boost_energy_limit',
    descKey: 'boost_energy_limit_desc',
    baseCost: 200,
    level: 1,
    maxLevel: 20,
    costMultiplier: 1.8,
  },
  {
    id: 'rechargeSpeed',
    nameKey: 'boost_recharge',
    descKey: 'boost_recharge_desc',
    baseCost: 250,
    level: 1,
    maxLevel: 15,
    costMultiplier: 2.2,
  },
];

export const INITIAL_TASKS: TaskItem[] = [
  {
    id: 'telegram_channel',
    titleKey: 'task_telegram',
    rewardCoins: 500,
    rewardDiamonds: 1,
    completed: false,
    claimed: false,
    type: 'social',
    actionUrl: 'https://t.me',
  },
  {
    id: 'twitter_follow',
    titleKey: 'task_twitter',
    rewardCoins: 500,
    rewardDiamonds: 1,
    completed: false,
    claimed: false,
    type: 'social',
    actionUrl: 'https://x.com',
  },
  {
    id: 'youtube_sub',
    titleKey: 'task_youtube',
    rewardCoins: 800,
    rewardDiamonds: 1,
    completed: false,
    claimed: false,
    type: 'social',
    actionUrl: 'https://youtube.com',
  },
  {
    id: 'invite_friend',
    titleKey: 'task_invite',
    rewardCoins: 1500,
    rewardDiamonds: 2,
    completed: false,
    claimed: false,
    type: 'social',
  },
  {
    id: 'tap_100',
    titleKey: 'task_tap_100',
    rewardCoins: 200,
    completed: false,
    claimed: false,
    type: 'achievement',
    currentProgress: 0,
    requiredProgress: 100,
  },
  {
    id: 'tap_1000',
    titleKey: 'task_tap_1000',
    rewardCoins: 1000,
    rewardDiamonds: 1,
    completed: false,
    claimed: false,
    type: 'achievement',
    currentProgress: 0,
    requiredProgress: 1000,
  },
  {
    id: 'reach_lvl3',
    titleKey: 'task_reach_lvl3',
    rewardCoins: 1500,
    rewardDiamonds: 2,
    completed: false,
    claimed: false,
    type: 'achievement',
    currentProgress: 1,
    requiredProgress: 3,
  },
  {
    id: 'own_mining_3',
    titleKey: 'task_own_mining',
    rewardCoins: 2500,
    rewardDiamonds: 2,
    completed: false,
    claimed: false,
    type: 'achievement',
    currentProgress: 0,
    requiredProgress: 3,
  },
];

export const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: 'FoxEmperor99', coins: 285000, level: 7 },
  { rank: 2, name: 'LoysKing_BD', coins: 194000, level: 7 },
  { rank: 3, name: 'HutKutMaster', coins: 148000, level: 7 },
  { rank: 4, name: 'CryptoSultan', coins: 89000, level: 6 },
  { rank: 5, name: 'CyberTanvir', coins: 52000, level: 6 },
  { rank: 6, name: 'GoldenPawX', coins: 34000, level: 5 },
  { rank: 7, name: 'RedFoxDhaka', coins: 21000, level: 5 },
  { rank: 8, name: 'NeonTapPro', coins: 14000, level: 4 },
  { rank: 9, name: 'LoysHodler', coins: 8500, level: 4 },
  { rank: 10, name: 'SpeedyClaw', coins: 4200, level: 3 },
];

export interface DailyStreakReward {
  day: number;
  coins: number;
  diamonds: number;
  isMilestone?: boolean;
}

export const getDailyStreakReward = (day: number): DailyStreakReward => {
  const d = Math.max(1, Math.min(100, day));
  // Daily Streak starts at 20 coins (Day 1) and progresses to Day 100 with 100 diamonds!
  const coins = d === 1 ? 20 : Math.round(20 + (d - 1) * 8 + Math.pow(d, 1.35));

  let diamonds = 0;
  let isMilestone = false;

  if (d === 100) {
    diamonds = 100; // Grand 100 diamonds milestone at Day 100!
    isMilestone = true;
  } else if (d === 75) {
    diamonds = 50;
    isMilestone = true;
  } else if (d === 50) {
    diamonds = 25;
    isMilestone = true;
  } else if (d === 30) {
    diamonds = 10;
    isMilestone = true;
  } else if (d === 20) {
    diamonds = 5;
    isMilestone = true;
  } else if (d % 10 === 0) {
    diamonds = Math.floor(d / 10);
    isMilestone = true;
  } else if (d % 5 === 0) {
    diamonds = 1;
    isMilestone = true;
  }

  return {
    day: d,
    coins,
    diamonds,
    isMilestone,
  };
};

export const DAILY_STREAK_REWARDS: DailyStreakReward[] = Array.from(
  { length: 100 },
  (_, idx) => getDailyStreakReward(idx + 1)
);
