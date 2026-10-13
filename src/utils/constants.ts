import { FoxRankInfo, MiningUpgrade, BoostItem, TaskItem, LeaderboardEntry } from '../types/game';

export const FOX_RANKS: FoxRankInfo[] = Array.from({ length: 100 }, (_, index) => {
  const lvl = index + 1;
  let nameEn = `Fox Rank ${lvl}`;
  let nameBn = `ফক্স র‍্যাঙ্ক ${lvl}`;
  let color = '#38bdf8';
  let gradient = 'from-sky-400 to-blue-600';

  if (lvl === 1) {
    nameEn = 'Bronze Fox';
    nameBn = 'ব্রোঞ্জ ফক্স';
    color = '#cd7f32';
    gradient = 'from-amber-700 to-amber-900';
  } else if (lvl === 25) {
    nameEn = 'Silver Prowler';
    nameBn = 'সিলভার প্রাউলার';
    color = '#94a3b8';
    gradient = 'from-slate-400 to-slate-600';
  } else if (lvl === 50) {
    nameEn = 'Golden Fox';
    nameBn = 'গোল্ডেন ফক্স';
    color = '#fbbf24';
    gradient = 'from-amber-400 to-yellow-600';
  } else if (lvl === 75) {
    nameEn = 'Master Loys';
    nameBn: 'মাস্টার লয়েস';
    color = '#c084fc';
    gradient = 'from-purple-500 to-indigo-700';
  } else if (lvl === 100) {
    nameEn = 'Legendary Emperor Fox (100)';
    nameBn: 'লিজেন্ডারি ফক্স সম্রাট (১০০)';
    color = '#eab308';
    gradient = 'from-yellow-300 via-amber-500 to-orange-600';
  }

  // Level 1 = 0, Level 2 = 100,000 (1 Lakh), Level 100 = 1,000,000,000 (1000 Million / 1 Billion) coins
  const minCoins =
    lvl === 1
      ? 0
      : lvl === 100
      ? 1000000000
      : Math.round(100000 * Math.pow(1.09854, lvl - 2));
  const maxEnergyBonus = (lvl - 1) * 50;

  return {
    level: lvl,
    nameEn,
    nameBn,
    minCoins,
    maxEnergyBonus,
    color,
    gradient,
  };
});

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
    id: 'tap_5000',
    titleKey: 'task_tap_5000',
    rewardCoins: 5000,
    rewardDiamonds: 3,
    completed: false,
    claimed: false,
    type: 'achievement',
    currentProgress: 0,
    requiredProgress: 5000,
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
  {
    id: 'tap_20000',
    titleKey: 'task_tap_20000',
    rewardCoins: 20000,
    rewardDiamonds: 5,
    completed: false,
    claimed: false,
    type: 'achievement',
    currentProgress: 0,
    requiredProgress: 20000,
  },
];

export interface DailyStreakReward {
  day: number;
  coins: number;
  diamonds: number;
  isMilestone?: boolean;
}

export const DAILY_STREAK_REWARDS: DailyStreakReward[] = [
  { day: 1, coins: 500, diamonds: 0 },
  { day: 2, coins: 1000, diamonds: 0 },
  { day: 3, coins: 2500, diamonds: 1 },
  { day: 4, coins: 5000, diamonds: 2 },
  { day: 5, coins: 10000, diamonds: 3 },
  { day: 6, coins: 20000, diamonds: 5 },
  { day: 7, coins: 50000, diamonds: 15, isMilestone: true },
];

export const getDailyStreakReward = (day: number): DailyStreakReward => {
  const adjustedDay = ((day - 1) % 7) + 1;
  return DAILY_STREAK_REWARDS[adjustedDay - 1] || DAILY_STREAK_REWARDS[0];
};
