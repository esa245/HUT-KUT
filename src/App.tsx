/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { HeaderStats } from './components/HeaderStats';
import { TapArea } from './components/TapArea';
import { MiningView } from './components/MiningView';
import { BoostView } from './components/BoostView';
import { TasksView } from './components/TasksView';
import { ReferralView } from './components/ReferralView';
import { AirdropView } from './components/AirdropView';
import { BottomNav, NavTab } from './components/BottomNav';
import { OfflineEarningsModal } from './components/OfflineEarningsModal';
import { RankModal } from './components/RankModal';
import { AdminPanel } from './components/AdminPanel';
import {
  FOX_RANKS,
  INITIAL_MINING_UPGRADES,
  INITIAL_BOOST_ITEMS,
  INITIAL_TASKS,
  DAILY_STREAK_REWARDS,
  getDailyStreakReward,
} from './utils/constants';
import {
  FloatingParticle,
  Language,
  MiningUpgrade,
  BoostItem,
  TaskItem,
  ReferralFriend,
} from './types/game';
import { soundManager } from './utils/audio';
import {
  getUserAirdropCode,
  syncUserToFirebase,
  rewardReferrer
} from './utils/firebase';

export default function App() {
  // --- Persistent State ---
  const [userAirdropCode] = useState<string>(() => getUserAirdropCode());

  const [coins, setCoins] = useState<number>(() => {
    const saved = localStorage.getItem('loys_coins');
    return saved !== null ? Number(saved) : 0;
  });

  const [diamonds, setDiamonds] = useState<number>(() => {
    const saved = localStorage.getItem('loys_diamonds');
    return saved !== null ? Number(saved) : 0;
  });

  const [level, setLevel] = useState<number>(() => {
    const saved = localStorage.getItem('loys_level');
    return saved !== null ? Number(saved) : 1;
  });

  const [totalTaps, setTotalTaps] = useState<number>(() => {
    const saved = localStorage.getItem('loys_total_taps');
    return saved !== null ? Number(saved) : 0;
  });

  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('loys_language');
    return (saved as Language) || 'bn'; // Bengali by default
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('loys_sound_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  const [miningUpgrades, setMiningUpgrades] = useState<MiningUpgrade[]>(() => {
    const saved = localStorage.getItem('loys_mining_upgrades');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return INITIAL_MINING_UPGRADES;
  });

  const [boostItems, setBoostItems] = useState<BoostItem[]>(() => {
    const saved = localStorage.getItem('loys_boost_items');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return INITIAL_BOOST_ITEMS;
  });

  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    const saved = localStorage.getItem('loys_tasks');
    if (saved) {
      try {
        let parsed: TaskItem[] = JSON.parse(saved);
        // Exclude reach_lvl3 (Golden Fox) completely
        parsed = parsed.filter(t => t.id !== 'reach_lvl3');
        // Ensure all 5 tasks from INITIAL_TASKS exist
        const ids = new Set(parsed.map(t => t.id));
        for (const initT of INITIAL_TASKS) {
          if (!ids.has(initT.id)) {
            parsed.push({ ...initT });
          }
        }
        return parsed.map(t => {
          if (t.type === 'social' && t.id !== 'invite_friend') {
            const { actionUrl, ...rest } = t;
            return rest as TaskItem;
          }
          return t;
        });
      } catch {}
    }
    return INITIAL_TASKS;
  });

  const [referralFriends, setReferralFriends] = useState<ReferralFriend[]>(() => {
    const saved = localStorage.getItem('loys_referral_friends');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  const [dailyTapPower, setDailyTapPower] = useState<number>(() => {
    const saved = localStorage.getItem('loys_daily_tap_power');
    return saved !== null ? Number(saved) : 0;
  });

  const [lastDailyTapClaimTimestamp, setLastDailyTapClaimTimestamp] = useState<number>(() => {
    const saved = localStorage.getItem('loys_last_daily_tap_claim');
    return saved !== null ? Number(saved) : 0;
  });

  const [dailyStreakDay, setDailyStreakDay] = useState<number>(() => {
    const saved = localStorage.getItem('loys_daily_streak_day');
    return saved !== null ? Number(saved) : 1;
  });

  const [lastDailyClaimTimestamp, setLastDailyClaimTimestamp] = useState<number>(() => {
    const saved = localStorage.getItem('loys_last_daily_claim');
    return saved !== null ? Number(saved) : 0;
  });

  const [streakResetNotice, setStreakResetNotice] = useState<boolean>(false);

  // Hardcore streak check: If user missed more than 48 hours, reset streak back to Day 1!
  useEffect(() => {
    if (lastDailyClaimTimestamp > 0) {
      const elapsedHours = (Date.now() - lastDailyClaimTimestamp) / (3600 * 1000);
      if (elapsedHours > 48) {
        setDailyStreakDay(1);
        localStorage.setItem('loys_daily_streak_day', '1');
        setStreakResetNotice(true);
      }
    }
  }, [lastDailyClaimTimestamp]);

  const [freeRefillsLeft, setFreeRefillsLeft] = useState<number>(() => {
    const saved = localStorage.getItem('loys_free_refills');
    return saved !== null ? Number(saved) : 3;
  });

  const [freeTurboLeft, setFreeTurboLeft] = useState<number>(() => {
    const saved = localStorage.getItem('loys_free_turbo');
    return saved !== null ? Number(saved) : 3;
  });

  // Active Tab (Defaults to Home)
  const [activeTab, setActiveTab] = useState<NavTab>('home');

  // Floating particles
  const [floatingParticles, setFloatingParticles] = useState<FloatingParticle[]>([]);

  // Modals
  const [showRankModal, setShowRankModal] = useState<boolean>(false);
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(() => {
    const hasSeenWelcome = localStorage.getItem('loys_has_seen_welcome');
    if (!hasSeenWelcome) {
      // Give 100 HUT KUT tokens (converted tokens) on first entry
      const currentConverted = Number(localStorage.getItem('loys_converted_tokens') || '0');
      if (currentConverted === 0) {
        localStorage.setItem('loys_converted_tokens', '100');
      }
      return true;
    }
    return false;
  });
  const [offlineEarnings, setOfflineEarnings] = useState<{ amount: number; hours: number } | null>(
    null
  );

  // Turbo Overdrive Active Timer
  const [isTurboActive, setIsTurboActive] = useState<boolean>(false);
  const [turboSecondsLeft, setTurboSecondsLeft] = useState<number>(0);

  // Sound sync
  useEffect(() => {
    soundManager.enabled = soundEnabled;
  }, [soundEnabled]);

  // Daily Reset Check
  useEffect(() => {
    const todayStr = new Date().toDateString();
    const lastReset = localStorage.getItem('loys_last_daily_reset');
    if (lastReset !== todayStr) {
      setFreeRefillsLeft(3);
      setFreeTurboLeft(3);
      localStorage.setItem('loys_free_refills', '3');
      localStorage.setItem('loys_free_turbo', '3');
      localStorage.setItem('loys_last_daily_reset', todayStr);
    }

    // --- Referral Detection System ---
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('start') || urlParams.get('ref');
    const myCode = localStorage.getItem('loys_airdrop_code');
    const alreadyReferred = localStorage.getItem('loys_referred_by');

    if (refCode && myCode && refCode !== myCode && !alreadyReferred) {
      localStorage.setItem('loys_referred_by', refCode);

      // Trigger server-side/RTDB referral reward
      rewardReferrer(refCode, myCode);
      
      console.log(`Referral detected: ${refCode} referred ${myCode}`);
    }
  }, [language]);

  // --- Dynamic Calculations ---
  const multitapBoost = boostItems.find((b) => b.id === 'multitap');
  const energyLimitBoost = boostItems.find((b) => b.id === 'energyLimit');
  const rechargeBoost = boostItems.find((b) => b.id === 'rechargeSpeed');

  const multitapLevel = multitapBoost ? multitapBoost.level : 1;
  const clickPower = multitapLevel + dailyTapPower;

  const currentRank = useMemo(() => {
    return FOX_RANKS.find((r) => r.level === level) || FOX_RANKS[0];
  }, [level]);

  const nextRank = useMemo(() => {
    return FOX_RANKS.find((r) => r.level === level + 1) || null;
  }, [level]);

  const maxEnergy = useMemo(() => {
    const base = 1000;
    const rankBonus = currentRank.maxEnergyBonus;
    const boostBonus = energyLimitBoost ? (energyLimitBoost.level - 1) * 500 : 0;
    return base + rankBonus + boostBonus;
  }, [currentRank, energyLimitBoost]);

  const [energy, setEnergy] = useState<number>(() => {
    const saved = localStorage.getItem('loys_energy');
    return saved !== null ? Number(saved) : 1000;
  });

  // Energy Recharge Rate calibrated so full capacity takes 1 hour (3600 seconds)
  const energyRegenRate = useMemo(() => {
    const baseRate = maxEnergy / 3600; // Full in 1 hour
    const boostBonus = rechargeBoost ? (rechargeBoost.level - 1) * (baseRate * 0.25) : 0;
    return baseRate + boostBonus;
  }, [maxEnergy, rechargeBoost]);

  // Auto Earn (10-Minute Cycle): 1 base auto coin + upgrades bonus (১০ মিনিট পরে একটা করে অটো বাড়বে)
  const autoEarn10Min = useMemo(() => {
    const base = 1; // Base +1 auto coin every 10 minutes even without cards
    const upgradesBonus = miningUpgrades.reduce((sum, item) => {
      if (item.level <= 0) return sum;
      const itemBonus = Math.round(item.basePph * Math.pow(1.3, item.level - 1));
      return sum + itemBonus;
    }, 0);
    return base + upgradesBonus;
  }, [miningUpgrades]);

  const [lastAutoDropTimestamp, setLastAutoDropTimestamp] = useState<number>(() => {
    const saved = localStorage.getItem('loys_last_auto_drop');
    return saved !== null ? Number(saved) : Date.now();
  });

  const [autoTimerSecondsLeft, setAutoTimerSecondsLeft] = useState<number>(600);
  const [autoDropNotification, setAutoDropNotification] = useState<number | null>(null);

  // Check Offline Earnings on mount (based on 10-minute cycles)
  useEffect(() => {
    const lastActiveStr = localStorage.getItem('loys_last_active_time');
    const now = Date.now();
    
    if (lastActiveStr) {
      const lastActive = Number(lastActiveStr);
      const elapsedSeconds = Math.max(0, (now - lastActive) / 1000);
      
      // 1. Energy catch-up
      if (elapsedSeconds > 1) {
        const restoredEnergy = elapsedSeconds * energyRegenRate;
        setEnergy((prev) => Math.min(maxEnergy, prev + restoredEnergy));
      }

      // 2. Offline earnings check
      if (autoEarn10Min > 0 && elapsedSeconds >= 600) {
        // Capped at 18 cycles (3 hours max offline accumulation)
        const cycles = Math.min(18, Math.floor(elapsedSeconds / 600));
        const hoursAway = (cycles * 10) / 60;
        const earnedCoins = cycles * autoEarn10Min;
        if (earnedCoins > 0) {
          setOfflineEarnings({
            amount: earnedCoins,
            hours: hoursAway,
          });
        }
      }
    }
    localStorage.setItem('loys_last_active_time', String(now));
  }, [autoEarn10Min, maxEnergy, energyRegenRate]);

  // Periodic Energy Regeneration (24-hour cycle) & 10-Minute Auto Harvest Tick
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();

      // 1. Slow 24-hour cycle energy regeneration (takes 24h for 0% to 100%)
      setEnergy((prev) => {
        if (prev < maxEnergy) {
          const nextVal = Math.min(maxEnergy, prev + energyRegenRate);
          localStorage.setItem('loys_energy', String(Math.floor(nextVal)));
          return nextVal;
        }
        return prev;
      });

      // 2. 10-Minute Auto Income Harvest (১০ মিনিট পর পর অটো ব্যালেন্সে যোগ হবে)
      const elapsedSeconds = Math.floor((now - lastAutoDropTimestamp) / 1000);
      if (elapsedSeconds >= 600) {
        const cycles = Math.floor(elapsedSeconds / 600);
        const autoEarnTotal = cycles * autoEarn10Min;
        setCoins((prev) => {
          const nextCoins = prev + autoEarnTotal;
          localStorage.setItem('loys_coins', String(Math.floor(nextCoins)));
          return nextCoins;
        });

        const newDropTime = now - (elapsedSeconds % 600) * 1000;
        setLastAutoDropTimestamp(newDropTime);
        localStorage.setItem('loys_last_auto_drop', String(newDropTime));
        setAutoTimerSecondsLeft(600 - (elapsedSeconds % 600));

        // Visual and sound feedback
        setAutoDropNotification(autoEarnTotal);
        setTimeout(() => setAutoDropNotification(null), 3500);
        soundManager.playLevelUp();
      } else {
        setAutoTimerSecondsLeft(Math.max(0, 600 - elapsedSeconds));
      }

      localStorage.setItem('loys_last_active_time', String(now));
    }, 1000);

    return () => clearInterval(interval);
  }, [maxEnergy, energyRegenRate, autoEarn10Min, lastAutoDropTimestamp]);

  // Turbo Mode Countdown Timer
  useEffect(() => {
    if (!isTurboActive) return;

    const timer = setInterval(() => {
      setTurboSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsTurboActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTurboActive]);

  // Check Level-Up condition when coins change
  useEffect(() => {
    const currentCoinInt = Math.floor(coins);
    const eligibleRank = [...FOX_RANKS]
      .reverse()
      .find((rank) => currentCoinInt >= rank.minCoins);

    if (eligibleRank && eligibleRank.level > level) {
      setLevel(eligibleRank.level);
      localStorage.setItem('loys_level', String(eligibleRank.level));
      soundManager.playLevelUp();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#fbbf24', '#f59e0b', '#38bdf8', '#ffffff'],
      });
    }
  }, [coins, level]);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('loys_coins', String(Math.floor(coins)));
  }, [coins]);

  useEffect(() => {
    localStorage.setItem('loys_diamonds', String(diamonds));
  }, [diamonds]);

  useEffect(() => {
    localStorage.setItem('loys_total_taps', String(totalTaps));
  }, [totalTaps]);

  useEffect(() => {
    localStorage.setItem('loys_mining_upgrades', JSON.stringify(miningUpgrades));
  }, [miningUpgrades]);

  useEffect(() => {
    localStorage.setItem('loys_boost_items', JSON.stringify(boostItems));
  }, [boostItems]);

  useEffect(() => {
    localStorage.setItem('loys_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('loys_referral_friends', JSON.stringify(referralFriends));
  }, [referralFriends]);

  useEffect(() => {
    localStorage.setItem('loys_daily_tap_power', String(dailyTapPower));
  }, [dailyTapPower]);

  useEffect(() => {
    localStorage.setItem('loys_last_daily_tap_claim', String(lastDailyTapClaimTimestamp));
  }, [lastDailyTapClaimTimestamp]);

  useEffect(() => {
    localStorage.setItem('loys_language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('loys_sound_enabled', String(soundEnabled));
  }, [soundEnabled]);

  // Sync current user to Firebase Realtime Database immediately on link click / app open
  useEffect(() => {
    syncUserToFirebase(userAirdropCode, {
      coins: Math.floor(coins),
      level,
      totalTaps,
      diamonds,
      profitPerHour: autoEarn10Min * 6,
    });
  }, [userAirdropCode]);

  // Sync User Stats with Firebase Realtime Database in real-time (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      syncUserToFirebase(userAirdropCode, {
        coins: Math.floor(coins),
        level,
        totalTaps,
        diamonds,
        profitPerHour: autoEarn10Min * 6,
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, [coins, level, totalTaps, diamonds, userAirdropCode, autoEarn10Min]);

  // Purge reach_lvl3 from tasks and ensure mining progress is in sync with upgrades
  useEffect(() => {
    const totalMiningUpgrades = miningUpgrades.reduce((sum, m) => sum + m.level, 0);
    setTasks((prev) => {
      let changed = false;
      let next = prev.filter((t) => t.id !== 'reach_lvl3');
      if (next.length !== prev.length) changed = true;

      const ids = new Set(next.map((t) => t.id));
      for (const initT of INITIAL_TASKS) {
        if (!ids.has(initT.id)) {
          next.push({ ...initT });
          changed = true;
        }
      }

      next = next.map((t) => {
        if (t.id === 'own_mining_3' && !t.completed && !t.claimed) {
          const req = t.requiredProgress || 3;
          if (t.currentProgress !== totalMiningUpgrades) {
            changed = true;
            return {
              ...t,
              currentProgress: totalMiningUpgrades,
              completed: totalMiningUpgrades >= req,
            };
          }
        }
        return t;
      });

      if (changed) {
        localStorage.setItem('loys_tasks', JSON.stringify(next));
      }
      return changed ? next : prev;
    });
  }, [miningUpgrades]);

  // Update task progress for achievements
  const updateTaskProgress = useCallback((achievementType: 'tap' | 'mining', val: number) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.completed || task.claimed) return task;

        if (achievementType === 'tap' && task.id.startsWith('tap_')) {
          const newProg = val;
          const req = task.requiredProgress || 1;
          return {
            ...task,
            currentProgress: newProg,
            completed: newProg >= req,
          };
        }

        if (achievementType === 'mining' && task.id === 'own_mining_3') {
          const req = task.requiredProgress || 3;
          return {
            ...task,
            currentProgress: val,
            completed: val >= req,
          };
        }

        return task;
      })
    );
  }, []);

  // --- Tap Handler (Multi-touch support & RARE diamonds) ---
  const handleTap = useCallback(
    (count: number, coords: Array<{ x: number; y: number }>) => {
      const effectivePower = isTurboActive ? clickPower * 5 : clickPower;
      const totalPower = effectivePower * count;
      const energyNeeded = isTurboActive ? 0 : clickPower * count;

      if (!isTurboActive && energy < energyNeeded) {
        return;
      }

      // 1. Deduct energy if not in turbo
      if (!isTurboActive) {
        setEnergy((prev) => {
          const nextVal = Math.max(0, prev - energyNeeded);
          localStorage.setItem('loys_energy', String(Math.floor(nextVal)));
          return nextVal;
        });
      }

      // 2. Increase Coins
      setCoins((prev) => prev + totalPower);

      // 3. Increment total taps
      const newTaps = totalTaps + count;
      setTotalTaps(newTaps);
      updateTaskProgress('tap', newTaps);

      // 4. Rare Diamond Drop Chance (0.5% chance per tap, very rare!)
      let gotDiamond = false;
      let diamondsWon = 0;
      for (let i = 0; i < count; i++) {
        if (Math.random() < 0.005) {
          gotDiamond = true;
          diamondsWon += 1;
        }
      }

      if (gotDiamond) {
        setDiamonds((prev) => prev + diamondsWon);
        soundManager.playDiamond();
      } else {
        soundManager.playTap();
      }

      // 5. Spawn floating number particles
      const newParticles: FloatingParticle[] = coords.map((coord, idx) => ({
        id: Math.random().toString(36).substring(2, 9) + idx,
        x: coord.x,
        y: coord.y,
        text: gotDiamond && idx === 0 ? `+${diamondsWon} 💎` : `+${effectivePower}`,
        type: gotDiamond && idx === 0 ? 'diamond' : isTurboActive ? 'turbo' : 'coin',
      }));

      setFloatingParticles((prev) => [...prev, ...newParticles]);

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(25);
        } catch {}
      }

      setTimeout(() => {
        setFloatingParticles((prev) =>
          prev.filter((p) => !newParticles.some((np) => np.id === p.id))
        );
      }, 900);
    },
    [clickPower, energy, isTurboActive, totalTaps, updateTaskProgress]
  );

  // --- Booster Handlers ---
  const handleUseRefill = useCallback(() => {
    if (freeRefillsLeft <= 0) return;
    setEnergy(maxEnergy);
    setFreeRefillsLeft((prev) => {
      const nextVal = prev - 1;
      localStorage.setItem('loys_free_refills', String(nextVal));
      return nextVal;
    });
  }, [freeRefillsLeft, maxEnergy]);

  const handleUseTurbo = useCallback(() => {
    if (freeTurboLeft <= 0 || isTurboActive) return;
    setIsTurboActive(true);
    setTurboSecondsLeft(20);
    setFreeTurboLeft((prev) => {
      const nextVal = prev - 1;
      localStorage.setItem('loys_free_turbo', String(nextVal));
      return nextVal;
    });
  }, [freeTurboLeft, isTurboActive]);

  const handleUpgradeBoost = useCallback((boostId: BoostItem['id']) => {
    setBoostItems((prevItems) => {
      const item = prevItems.find((b) => b.id === boostId);
      if (!item) return prevItems;

      const currentCost = Math.round(
        item.baseCost * Math.pow(item.costMultiplier, item.level - 1)
      );

      // Multitap Level > 2 requires Diamonds!
      const diamondCost = boostId === 'multitap' && item.level >= 2 ? (item.level - 1) * 2 : 0;

      if (coins < currentCost || diamonds < diamondCost || item.level >= item.maxLevel) return prevItems;

      setCoins((c) => Math.max(0, c - currentCost));
      if (diamondCost > 0) {
        setDiamonds((d) => Math.max(0, d - diamondCost));
      }

      return prevItems.map((b) => (b.id === boostId ? { ...b, level: b.level + 1 } : b));
    });
  }, [coins, diamonds]);

  const handleClaimDailyTapPower = useCallback(() => {
    const oneDayMs = 24 * 60 * 60 * 1000;
    if (Date.now() - lastDailyTapClaimTimestamp < oneDayMs) return;

    setDailyTapPower((prev) => prev + 1);
    setLastDailyTapClaimTimestamp(Date.now());

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#fbbf24', '#eab308', '#38bdf8'],
    });
  }, [lastDailyTapClaimTimestamp]);

  // --- Mining Upgrade Handler ---
  const handleUpgradeMining = useCallback((upgradeId: string) => {
    setMiningUpgrades((prevUpgrades) => {
      const item = prevUpgrades.find((m) => m.id === upgradeId);
      if (!item) return prevUpgrades;

      const currentCost = Math.round(item.baseCost * Math.pow(1.6, item.level));
      if (coins < currentCost) return prevUpgrades;

      setCoins((c) => Math.max(0, c - currentCost));

      const updated = prevUpgrades.map((m) =>
        m.id === upgradeId ? { ...m, level: m.level + 1 } : m
      );

      const totalUpgradesCount = updated.reduce((sum, m) => sum + m.level, 0);
      updateTaskProgress('mining', totalUpgradesCount);

      return updated;
    });
  }, [coins, updateTaskProgress]);

  // --- Tasks Handlers ---
  const handleClaimDailyStreak = useCallback(() => {
    const currentReward = DAILY_STREAK_REWARDS[dailyStreakDay - 1] || getDailyStreakReward(dailyStreakDay);
    setCoins((prev) => prev + currentReward.coins);
    if (currentReward.diamonds > 0) {
      setDiamonds((prev) => prev + currentReward.diamonds);
    }

    const nextDay = dailyStreakDay >= 100 ? 1 : dailyStreakDay + 1;
    setDailyStreakDay(nextDay);
    setLastDailyClaimTimestamp(Date.now());
    localStorage.setItem('loys_daily_streak_day', String(nextDay));
    localStorage.setItem('loys_last_daily_claim', String(Date.now()));
    setStreakResetNotice(false);

    confetti({
      particleCount: currentReward.isMilestone ? 90 : 50,
      spread: 70,
      origin: { y: 0.5 },
      colors: ['#fbbf24', '#38bdf8', '#a855f7'],
    });
  }, [dailyStreakDay]);

  const handleResetDailyStreak = useCallback(() => {
    setDailyStreakDay(1);
    setLastDailyClaimTimestamp(0);
    localStorage.setItem('loys_daily_streak_day', '1');
    localStorage.setItem('loys_last_daily_claim', '0');
    setStreakResetNotice(false);
  }, []);

  const handleCompleteTaskAction = useCallback((task: TaskItem) => {
    if (task.actionUrl) {
      window.open(task.actionUrl, '_blank', 'noopener,noreferrer');
    }

    setTimeout(() => {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, completed: true } : t))
      );
    }, 1500);
  }, []);

  const handleClaimTask = useCallback((taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !task.completed || task.claimed) return;

    setCoins((c) => c + task.rewardCoins);
    const rewardDiamonds = task.rewardDiamonds;
    if (rewardDiamonds) {
      setDiamonds((d) => d + rewardDiamonds);
    }

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          // Mining upgrades requirement increases by 3 each time (৩ টা বা ৪ টা করে বাড়তে থাকবে)
          const nextRequired = t.id === 'own_mining_3'
            ? (t.requiredProgress || 3) + 3
            : Math.round((t.requiredProgress || 100) * 1.5);
          const nextCoins = Math.round(t.rewardCoins * 1.5);
          const nextDiamonds = t.rewardDiamonds ? t.rewardDiamonds + 1 : 1;
          const currentProg = t.currentProgress || 0;
          return {
            ...t,
            requiredProgress: nextRequired,
            rewardCoins: nextCoins,
            rewardDiamonds: nextDiamonds,
            completed: currentProg >= nextRequired,
            claimed: false,
          };
        }
        return t;
      })
    );

    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.5 },
      colors: ['#fbbf24', '#10b981'],
    });
  }, [tasks]);

  // --- Referral Friend Handler ---
  const handleInviteFriend = useCallback((isPremium: boolean) => {
    const coinsReward = isPremium ? 75000 : 25000;
    const diamondsReward = isPremium ? 3 : 1;
    const sampleNames = ['Rahim_Fox', 'Tanvir99', 'Sadia_BD', 'CryptoShuvo', 'LoysMaster', 'Hunter_BD'];
    const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)] + '_' + Math.floor(100 + Math.random() * 900);

    const newFriend: ReferralFriend = {
      id: 'friend_' + Date.now(),
      name: randomName,
      joinedAt: new Date().toLocaleDateString(),
      rewardEarned: coinsReward,
      diamondsEarned: diamondsReward,
      level: Math.floor(1 + Math.random() * 4),
      isPremium,
    };

    const updated = [newFriend, ...referralFriends];
    setReferralFriends(updated);
    setCoins((c) => c + coinsReward);
    setDiamonds((d) => d + diamondsReward);

    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.5 },
      colors: ['#fbbf24', '#a855f7', '#38bdf8'],
    });
  }, [referralFriends]);

  const hasTasksAvailable = useMemo(() => {
    const oneDayMs = 24 * 60 * 60 * 1000;
    const canClaimDaily = lastDailyClaimTimestamp === 0 || Date.now() - lastDailyClaimTimestamp >= oneDayMs;
    const hasUnclaimedQuests = tasks.some((t) => t.completed && !t.claimed);
    return canClaimDaily || hasUnclaimedQuests;
  }, [tasks, lastDailyClaimTimestamp]);

  const isHomeTab = activeTab === 'home' || activeTab === 'tap';

  return (
    <div className="w-full h-screen h-[100dvh] bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white flex flex-col overflow-hidden relative">
      <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col overflow-hidden min-h-0 relative h-full">
        {/* Auto Drop Notification Toast */}
        {autoDropNotification !== null && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs px-4 py-2 rounded-2xl shadow-xl shadow-emerald-500/40 border border-emerald-400 flex items-center gap-2 animate-bounce pointer-events-none">
            <span>⚡</span>
            <span>
              +{autoDropNotification} 🪙 {language === 'bn' ? 'অটো কয়েন মেইন ব্যালেন্সে যোগ হয়েছে!' : 'Auto coins added to main balance!'}
            </span>
          </div>
        )}

        {/* Top Header with Coins, Diamonds, Rank & Back Control */}
        <HeaderStats
          coins={Math.floor(coins)}
          diamonds={diamonds}
          level={level}
          currentRank={currentRank}
          nextRank={nextRank}
          autoEarn10Min={autoEarn10Min}
          autoTimerSecondsLeft={autoTimerSecondsLeft}
          language={language}
          soundEnabled={soundEnabled}
          activeTab={isHomeTab ? 'home' : activeTab}
          onBackToTap={() => setActiveTab('home')}
          onToggleSound={() => setSoundEnabled((prev) => !prev)}
          onToggleLanguage={() => setLanguage((prev) => (prev === 'bn' ? 'en' : 'bn'))}
          onOpenRankModal={() => setShowRankModal(true)}
        />

        {/* View Switcher based on active tab */}
        {isHomeTab && (
          <TapArea
            energy={Math.floor(energy)}
            maxEnergy={maxEnergy}
            clickPower={clickPower}
            energyRegenRate={energyRegenRate}
            isTurboActive={isTurboActive}
            turboSecondsLeft={turboSecondsLeft}
            language={language}
            onTap={handleTap}
            floatingParticles={floatingParticles}
          />
        )}

        {activeTab === 'mine' && (
          <MiningView
            coins={coins}
            autoEarn10Min={autoEarn10Min}
            autoTimerSecondsLeft={autoTimerSecondsLeft}
            upgrades={miningUpgrades}
            language={language}
            onUpgrade={handleUpgradeMining}
            onBack={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'friends' && (
          <ReferralView
            friends={referralFriends}
            language={language}
            onInviteFriend={handleInviteFriend}
            onBack={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'boost' && (
          <BoostView
            coins={coins}
            diamonds={diamonds}
            boostItems={boostItems}
            freeRefillsLeft={freeRefillsLeft}
            freeTurboLeft={freeTurboLeft}
            isTurboActive={isTurboActive}
            dailyTapPower={dailyTapPower}
            lastDailyTapClaimTimestamp={lastDailyTapClaimTimestamp}
            language={language}
            onUseRefill={handleUseRefill}
            onUseTurbo={handleUseTurbo}
            onUpgradeBoost={handleUpgradeBoost}
            onClaimDailyTapPower={handleClaimDailyTapPower}
            onBack={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'tasks' && (
          <TasksView
            tasks={tasks}
            language={language}
            onClaimTask={handleClaimTask}
            onCompleteTaskAction={handleCompleteTaskAction}
            onBack={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'airdrop' && (
          <AirdropView
            coins={Math.floor(coins)}
            diamonds={diamonds}
            profitPerHour={autoEarn10Min * 6}
            totalTaps={totalTaps}
            language={language}
            onUpdateCoins={(newCoins) => {
              setCoins(newCoins);
              localStorage.setItem('loys_coins', String(newCoins));
            }}
            onUpdateDiamonds={(newDiamonds) => {
              setDiamonds(newDiamonds);
              localStorage.setItem('loys_diamonds', String(newDiamonds));
            }}
            onBack={() => setActiveTab('home')}
            onOpenAdmin={() => setShowAdminPanel(true)}
          />
        )}

        {/* Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          language={language}
          hasTasksAvailable={hasTasksAvailable}
        />
        {/* Rank & Leaderboard Modal */}
        {showRankModal && (
          <RankModal
            currentRank={currentRank}
            userCoins={Math.floor(coins)}
            userLevel={level}
            userAirdropCode={userAirdropCode}
            language={language}
            onClose={() => setShowRankModal(false)}
          />
        )}

        {/* Admin Panel */}
        {showAdminPanel && <AdminPanel onClose={() => setShowAdminPanel(false)} />}

        {/* First-time Welcome & 100 Coins Offer Popup */}
        {showWelcomePopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
            <div className="w-full max-w-sm p-6 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/40 shadow-2xl text-center relative overflow-hidden">
              {/* Glow effect */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-yellow-500/20 rounded-full blur-2xl pointer-events-none" />

              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 mx-auto shadow-lg shadow-amber-500/40 mb-3 animate-bounce">
                <span className="text-3xl">🎁</span>
              </div>

              <h3 className="text-lg font-black text-white mb-1">
                {language === 'bn' ? 'স্বাগতম! প্রথমবার ফ্রি উপহার 🎉' : 'Welcome! Free Welcome Gift 🎉'}
              </h3>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                {language === 'bn'
                  ? 'আপনি প্রথমবার প্রবেশ করেছেন! আপনার এয়ারড্রপ ব্যালেন্সে যোগ হয়েছে ১০০ HUT KUT টোকেন, যা এখনই BTT কয়েন হিসেবে উইথড্র করতে পারবেন!'
                  : 'You entered for the first time! 100 HUT KUT tokens have been added to your airdrop balance, ready to withdraw as BTT coins!'}
              </p>

              <div className="p-3 rounded-2xl bg-slate-950 border border-amber-500/30 mb-5 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">
                  {language === 'bn' ? 'ফ্রি এয়ারড্রপ ব্যালেন্স:' : 'Free Airdrop Balance:'}
                </span>
                <span className="text-sm font-black text-amber-400">
                  +100 HUT KUT (100 BTT)
                </span>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    soundManager.playUpgrade();
                    localStorage.setItem('loys_has_seen_welcome', 'true');
                    setShowWelcomePopup(false);
                    // Navigate to Airdrop / Withdraw page
                    setActiveTab('airdrop');
                  }}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs transition-all active:scale-95 shadow-lg shadow-emerald-500/30 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>💸</span>
                  <span>{language === 'bn' ? 'এখনই উইথড্র করুন (BTT)' : 'Withdraw BTT Now'}</span>
                </button>

                <button
                  onClick={() => {
                    soundManager.playClick();
                    localStorage.setItem('loys_has_seen_welcome', 'true');
                    setShowWelcomePopup(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all active:scale-95 cursor-pointer"
                >
                  {language === 'bn' ? 'পরে উইথড্র করব' : 'Claim & Play'}
                </button>
              </div>
            </div>
          </div>
        )}


      </div>
    </div>
  );
}
