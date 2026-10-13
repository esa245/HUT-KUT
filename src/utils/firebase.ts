import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  set,
  get,
  update,
  onValue,
  off,
  child,
  Database
} from 'firebase/database';
import { getAuth, signInAnonymously } from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  updateDoc,
  increment,
  Firestore
} from 'firebase/firestore';
import { LeaderboardEntry, WithdrawalRecord } from '../types/game';

// User's exact configured Firebase project (tiktok-bangla-boost-panel)
export const firebaseConfig = {
  apiKey: "AIzaSyCk1kg47SnRgvnW6has2aY122sg0PUYe8Y",
  authDomain: "tiktok-bangla-boost-panel.firebaseapp.com",
  projectId: "tiktok-bangla-boost-panel",
  storageBucket: "tiktok-bangla-boost-panel.firebasestorage.app",
  messagingSenderId: "364898002899",
  appId: "1:364898002899:web:70b335b54f67429112b126",
  databaseURL: "https://tiktok-bangla-boost-panel-default-rtdb.firebaseio.com"
};

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth & attempt anonymous login for RTDB security rules
try {
  const auth = getAuth(app);
  signInAnonymously(auth).catch(() => {
    // Anonymous auth might not be enabled in console, proceed without blocking
  });
} catch {}

// Initialize Firebase Realtime Database
let rtdbInstance: Database;
try {
  rtdbInstance = getDatabase(app, firebaseConfig.databaseURL);
} catch (e) {
  console.warn('Firebase RTDB initialization fallback:', e);
  rtdbInstance = getDatabase(app);
}
export const rtdb = rtdbInstance;

// Listen to Firebase RTDB native connection state (.info/connected)
export const listenToConnectionStatus = (callback: (connected: boolean, error?: string | null) => void) => {
  try {
    const connectedRef = ref(rtdb, '.info/connected');
    const unsub = onValue(
      connectedRef,
      (snap) => {
        const isConnected = !!snap.val();
        callback(isConnected, null);
      },
      (err) => {
        callback(false, err?.message || 'Connection or permission warning');
      }
    );
    return () => {
      try {
        off(connectedRef);
      } catch {}
    };
  } catch (e: any) {
    callback(false, e?.message);
    return () => {};
  }
};

// Initialize Firestore as secondary/compatibility storage
let firestoreInstance: Firestore | null = null;
try {
  firestoreInstance = getFirestore(app);
} catch (e) {
  console.warn('Firestore fallback warning:', e);
}
export const firestore = firestoreInstance;

// Helper to get or generate user's permanent 6-digit unique code
export const getUserAirdropCode = (): string => {
  if (typeof window === 'undefined') return '757207';
  let code = localStorage.getItem('loys_airdrop_code');
  if (!code || code.length !== 6 || isNaN(Number(code))) {
    code = Math.floor(100000 + Math.random() * 900000).toString();
    localStorage.setItem('loys_airdrop_code', code);
  }
  return code;
};

// Sync user profile & stats to Firebase Realtime Database
export const syncUserToFirebase = async (
  airdropCode: string,
  userData: {
    coins: number;
    level?: number;
    totalTaps?: number;
    diamonds?: number;
    profitPerHour?: number;
    convertedTokens?: number;
    name?: string;
  }
) => {
  if (!airdropCode) return;
  const joinedDate = localStorage.getItem('loys_joined_date') || new Date().toLocaleDateString('en-GB');
  if (!localStorage.getItem('loys_joined_date')) {
    localStorage.setItem('loys_joined_date', joinedDate);
  }

  const payload = {
    id: airdropCode,
    airdropCode,
    name: `ID: ${airdropCode}`,
    coins: Math.floor(userData.coins),
    level: userData.level || 1,
    totalTaps: userData.totalTaps || 0,
    diamonds: userData.diamonds || 0,
    profitPerHour: userData.profitPerHour || 0,
    convertedTokens: userData.convertedTokens || 0,
    mintedTokens: userData.convertedTokens || 0,
    joinedDate,
    lastActive: Date.now(),
    updatedAt: Date.now(),
  };

  try {
    // 1. Check existing to preserve higher coins or recruits
    const userRef = ref(rtdb, `users/${airdropCode}`);
    const existingSnap = await get(userRef);
    let finalPayload: any = payload;
    if (existingSnap.exists()) {
      const exist = existingSnap.val();
      finalPayload = {
        ...exist,
        ...payload,
        coins: Math.max(Number(payload.coins) || 0, Number(exist.coins) || 0),
        diamonds: Math.max(Number(payload.diamonds) || 0, Number(exist.diamonds) || 0),
        totalTaps: Math.max(Number(payload.totalTaps) || 0, Number(exist.totalTaps) || 0),
        level: Math.max(Number(payload.level) || 1, Number(exist.level) || 1),
        referralCount: Number(exist.referralCount) || 0,
        joinedDate: exist.joinedDate || joinedDate,
        name: `ID: ${airdropCode}`,
      };
    }

    // 2. Sync directly to Realtime Database (/users and /players)
    await set(ref(rtdb, `users/${airdropCode}`), finalPayload);
    await set(ref(rtdb, `players/${airdropCode}`), finalPayload);
    await update(ref(rtdb, 'admin_data/overview'), {
      lastActiveUser: airdropCode,
      lastSyncTimestamp: Date.now(),
    });
  } catch (err) {
    console.warn('Firebase RTDB sync warning:', err);
  }

  // 3. Also sync to Firestore if configured
  if (firestore) {
    try {
      await setDoc(doc(firestore, 'users', airdropCode), payload, { merge: true });
      await setDoc(doc(firestore, 'players', airdropCode), payload, { merge: true });
    } catch {}
  }
};

// Reward referrer in Realtime Database & record recruited 6-digit ID
export const rewardReferrer = async (referrerCode: string, recruitCode?: string) => {
  if (!referrerCode || referrerCode === recruitCode) return;
  const rewardCoins = 10000;
  const rewardDiamonds = 100;
  const now = Date.now();
  const joinedDate = new Date().toLocaleDateString('en-GB');

  try {
    // 1. Reward the referrer
    const userRef = ref(rtdb, `users/${referrerCode}`);
    const snap = await get(userRef);
    if (snap.exists()) {
      const current = snap.val();
      const updatedRefCoumt = (Number(current.referralCount) || 0) + 1;
      await update(userRef, {
        coins: (Number(current.coins) || 0) + rewardCoins,
        diamonds: (Number(current.diamonds) || 0) + rewardDiamonds,
        referralCount: updatedRefCoumt,
        name: `ID: ${referrerCode}`,
        lastActive: now,
      });
      await update(ref(rtdb, `players/${referrerCode}`), {
        coins: (Number(current.coins) || 0) + rewardCoins,
      });
    }

    // 2. Record the recruit under the referrer's recruits node, with status: 'accepted'
    if (recruitCode) {
      await set(ref(rtdb, `users/${referrerCode}/recruits/${recruitCode}`), {
        id: recruitCode,
        airdropCode: recruitCode,
        name: `ID: ${recruitCode}`,
        joinedDate,
        timestamp: now,
        status: 'accepted', // Automatically accepted
      });
      // Also tag the recruit with referredBy
      await update(ref(rtdb, `users/${recruitCode}`), {
        referredBy: referrerCode,
      });
    }
  } catch (error) {
    console.warn('Error rewarding referrer in RTDB:', error);
    // If it fails, add it as 'pending' for admin
    if (recruitCode) {
      await set(ref(rtdb, `users/${referrerCode}/recruits/${recruitCode}`), {
        id: recruitCode,
        airdropCode: recruitCode,
        name: `ID: ${recruitCode}`,
        joinedDate,
        timestamp: now,
        status: 'pending', // Pending admin approval due to failure
      });
    }
  }

  if (firestore) {
    try {
      await updateDoc(doc(firestore, 'users', referrerCode), {
        coins: increment(rewardCoins),
        diamonds: increment(rewardDiamonds),
        referralCount: increment(1)
      });
    } catch {}
  }
};

// Realtime Listener for Global Leaderboard (100% Real Users by 6-Digit ID from RTDB)
export const listenToGlobalLeaderboard = (
  userAirdropCode: string,
  userStats: { coins: number; level: number; name?: string },
  onUpdate: (
    leaderboard: LeaderboardEntry[],
    userRank: number,
    isConnected?: boolean
  ) => void
) => {
  const playersRef = ref(rtdb, 'players');
  const usersRef = ref(rtdb, 'users');
  let playersData: Record<string, any> | null = null;
  let usersData: Record<string, any> | null = null;
  let isRtdbConnected = true;

  // Function to merge and compute ranks strictly from REAL users
  const recompute = () => {
    const map = new Map<string, LeaderboardEntry>();

    // 1. Add / merge REAL players from Realtime Database `users` node
    const uData = usersData;
    if (uData && typeof uData === 'object') {
      Object.keys(uData).forEach((key) => {
        const item = uData[key];
        if (!item || item.isDemo) return;
        const code = item.airdropCode || key;
        // Skip non-digit mock keys
        if (!code || isNaN(Number(code))) return;
        const existing = map.get(code);
        const coins = Math.max(Number(item.coins) || 0, existing?.coins || 0);
        const level = Math.max(Number(item.level) || 1, existing?.level || 1);
        map.set(code, {
          rank: 0,
          name: code === userAirdropCode ? `You (ID: #${code})` : `ID: #${code}`,
          coins,
          level,
          airdropCode: code,
          isUser: code === userAirdropCode,
        });
      });
    }

    // 2. Add / merge REAL players from Realtime Database `players` node
    const pData = playersData;
    if (pData && typeof pData === 'object') {
      Object.keys(pData).forEach((key) => {
        const item = pData[key];
        if (!item || item.isDemo) return;
        const code = item.airdropCode || key;
        if (!code || isNaN(Number(code))) return;
        const existing = map.get(code);
        const coins = Math.max(Number(item.coins) || 0, existing?.coins || 0);
        const level = Math.max(Number(item.level) || 1, existing?.level || 1);
        map.set(code, {
          rank: 0,
          name: code === userAirdropCode ? `You (ID: #${code})` : `ID: #${code}`,
          coins,
          level,
          airdropCode: code,
          isUser: code === userAirdropCode,
        });
      });
    }

    // 3. Guarantee current user entry with their live 6-digit ID and game stats
    if (userAirdropCode) {
      const existing = map.get(userAirdropCode);
      const localCoins = Math.max(Number(userStats.coins) || 0, Number(existing?.coins) || 0);
      const localLevel = Math.max(Number(userStats.level) || 1, Number(existing?.level) || 1);
      map.set(userAirdropCode, {
        rank: 0,
        name: `You (ID: #${userAirdropCode})`,
        coins: localCoins,
        level: localLevel,
        airdropCode: userAirdropCode,
        isUser: true,
      });
    }

    // 4. Sort descending by coins, then by level
    const sorted = Array.from(map.values()).sort((a, b) => {
      if (b.coins !== a.coins) return b.coins - a.coins;
      if (b.level !== a.level) return b.level - a.level;
      return (a.airdropCode || '').localeCompare(b.airdropCode || '');
    });

    // 5. Calculate exact 1-indexed ranks and locate current user's specific rank
    let computedUserRank = 1;
    sorted.forEach((item, idx) => {
      item.rank = idx + 1;
      if (item.isUser || item.airdropCode === userAirdropCode) {
        computedUserRank = item.rank;
      }
    });

    onUpdate(sorted, computedUserRank, isRtdbConnected);
  };

  try {
    const unsubPlayers = onValue(
      playersRef,
      (snapshot) => {
        playersData = snapshot.val();
        recompute();
      },
      () => {
        recompute();
      }
    );

    const unsubUsers = onValue(
      usersRef,
      (snapshot) => {
        usersData = snapshot.val();
        recompute();
      },
      () => {
        recompute();
      }
    );

    const unsubConn = listenToConnectionStatus((connected) => {
      isRtdbConnected = connected;
      recompute();
    });

    recompute();

    return () => {
      try {
        off(playersRef);
      } catch {}
      try {
        off(usersRef);
      } catch {}
      try {
        unsubConn();
      } catch {}
    };
  } catch (e) {
    console.warn('listenToGlobalLeaderboard init error:', e);
    recompute();
    return () => {};
  }
};

// Save a withdrawal request to Realtime Database
export const saveWithdrawalToFirebase = async (
  airdropCode: string,
  record: WithdrawalRecord
) => {
  const payload = {
    ...record,
    airdropCode,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  try {
    // 1. Realtime Database /withdrawals
    await set(ref(rtdb, `withdrawals/${record.id}`), payload);
    await set(ref(rtdb, `users/${airdropCode}/withdrawals/${record.id}`), payload);
  } catch (error) {
    console.warn('Realtime Database withdrawal save warning:', error);
  }

  if (firestore) {
    try {
      await setDoc(doc(firestore, 'withdrawals', record.id), payload, { merge: true });
    } catch {}
  }
};

// Listen to user's withdrawal status updates from Realtime Database
export const listenToUserWithdrawals = (
  airdropCode: string,
  onUpdate: (withdrawals: WithdrawalRecord[]) => void
) => {
  if (!airdropCode) return () => {};
  const wdRef = ref(rtdb, 'withdrawals');

  try {
    onValue(
      wdRef,
      (snapshot) => {
        const val = snapshot.val();
        const results: WithdrawalRecord[] = [];
        if (val && typeof val === 'object') {
          Object.keys(val).forEach((key) => {
            const data = val[key];
            if (data && data.airdropCode === airdropCode) {
              results.push({
                id: data.id || key,
                airdropCode: data.airdropCode,
                amountHutKut: Number(data.amountHutKut) || 0,
                amountBtt: Number(data.amountBtt) || 0,
                exchange: data.exchange || 'Binance',
                exchangeId: data.exchangeId || '',
                timestamp: Number(data.timestamp) || Date.now(),
                status: data.status || 'pending',
              });
            }
          });
        }
        results.sort((a, b) => b.timestamp - a.timestamp);
        if (results.length > 0) {
          onUpdate(results);
        }
      },
      (err) => {
        console.warn('listenToUserWithdrawals RTDB warning:', err);
      }
    );

    return () => {
      try {
        off(wdRef);
      } catch {}
    };
  } catch (error) {
    console.warn('listenToUserWithdrawals error:', error);
    return () => {};
  }
};

// --- ADMIN SPECIFIC REALTIME DATABASE SERVICES ---

// Admin: Listen to all registered users from Realtime Database (100% Real Users by 6-Digit ID)
export const listenToAdminAllUsers = (onUpdate: (users: any[]) => void) => {
  const usersRef = ref(rtdb, 'users');

  const processUsers = (val: Record<string, any> | null) => {
    const mergedMap = new Map<string, any>();

    // 1. Realtime Database genuine registered users
    if (val && typeof val === 'object') {
      Object.keys(val).forEach((key) => {
        const item = val[key];
        if (!item) return;
        const code = item.airdropCode || key;
        // Require 6-digit ID
        if (!code || isNaN(Number(code))) return;

        mergedMap.set(code, {
          ...item,
          id: code,
          airdropCode: code,
          name: `ID: ${code}`,
          coins: Number(item.coins) || 0,
          diamonds: Number(item.diamonds) || 0,
          totalTaps: Number(item.totalTaps) || 0,
          level: Number(item.level) || 1,
          referralCount: Number(item.referralCount) || 0,
          mintedTokens: Number(item.mintedTokens || item.convertedTokens) || 0,
          joinedDate: item.joinedDate || '10/11/2026',
          recruits: item.recruits || {},
          referredBy: item.referredBy || null,
        });
      });
    }

    // 2. Current active player (if not yet in snapshot, register immediately)
    const myCode = localStorage.getItem('loys_airdrop_code');
    if (myCode && !isNaN(Number(myCode))) {
      const existing = mergedMap.get(myCode);
      mergedMap.set(myCode, {
        ...existing,
        id: myCode,
        airdropCode: myCode,
        name: `ID: ${myCode}`,
        coins: Math.max(Number(localStorage.getItem('loys_coins') || '0'), Number(existing?.coins || 0)),
        diamonds: Math.max(Number(localStorage.getItem('loys_diamonds') || '0'), Number(existing?.diamonds || 0)),
        totalTaps: Math.max(Number(localStorage.getItem('loys_total_taps') || '0'), Number(existing?.totalTaps || 0)),
        level: Math.max(Number(localStorage.getItem('loys_level') || '1'), Number(existing?.level || 1)),
        referralCount: Number(existing?.referralCount || 0),
        mintedTokens: Math.max(Number(localStorage.getItem('loys_converted_tokens') || '0'), Number(existing?.mintedTokens || 0)),
        joinedDate: existing?.joinedDate || localStorage.getItem('loys_joined_date') || '10/11/2026',
        recruits: existing?.recruits || {},
        referredBy: existing?.referredBy || localStorage.getItem('loys_referred_by') || null,
      });
    }

    const list = Array.from(mergedMap.values());
    list.sort((a, b) => (Number(b.coins) || 0) - (Number(a.coins) || 0));
    onUpdate(list);
  };

  try {
    onValue(
      usersRef,
      (snapshot) => {
        processUsers(snapshot.val());
      },
      (err) => {
        console.warn('Admin users RTDB onValue warning:', err);
        processUsers(null);
      }
    );

    return () => {
      try {
        off(usersRef);
      } catch {}
    };
  } catch (e) {
    console.warn('listenToAdminAllUsers error:', e);
    processUsers(null);
    return () => {};
  }
};

// Admin: Listen to all withdrawal requests from Realtime Database (Real Records)
export const listenToAdminAllWithdrawals = (
  onUpdate: (withdrawals: WithdrawalRecord[]) => void
) => {
  const wdRef = ref(rtdb, 'withdrawals');

  try {
    onValue(
      wdRef,
      (snapshot) => {
        const val = snapshot.val();
        const list: WithdrawalRecord[] = [];
        if (val && typeof val === 'object') {
          Object.keys(val).forEach((key) => {
            const data = val[key];
            if (!data) return;
            list.push({
              id: data.id || key,
              airdropCode: data.airdropCode || '',
              amountHutKut: Number(data.amountHutKut) || 0,
              amountBtt: Number(data.amountBtt) || 0,
              exchange: data.exchange || 'Binance',
              exchangeId: data.exchangeId || '',
              timestamp: Number(data.timestamp) || Date.now(),
              status: data.status || 'pending',
            });
          });
        }
        list.sort((a, b) => b.timestamp - a.timestamp);
        onUpdate(list);
      },
      (err) => {
        console.warn('Admin withdrawals RTDB onValue error:', err);
      }
    );

    return () => {
      try {
        off(wdRef);
      } catch {}
    };
  } catch (e) {
    console.warn('listenToAdminAllWithdrawals error:', e);
    return () => {};
  }
};

// Admin: Update withdrawal status (approve / mark completed / reject)
export const updateWithdrawalStatusInFirebase = async (
  withdrawalId: string,
  airdropCode: string,
  newStatus: 'pending' | 'processing' | 'completed' | 'rejected'
) => {
  try {
    await update(ref(rtdb, `withdrawals/${withdrawalId}`), {
      status: newStatus,
      updatedAt: Date.now(),
    });
    if (airdropCode) {
      await update(ref(rtdb, `users/${airdropCode}/withdrawals/${withdrawalId}`), {
        status: newStatus,
        updatedAt: Date.now(),
      });
    }
  } catch (e) {
    console.warn('updateWithdrawalStatusInFirebase RTDB warning:', e);
  }

  if (firestore) {
    try {
      await setDoc(doc(firestore, 'withdrawals', withdrawalId), { status: newStatus, updatedAt: Date.now() }, { merge: true });
    } catch {}
  }
};

// Admin: Update referral status (accept / reject)
export const updateReferralStatusInFirebase = async (
  referrerCode: string,
  recruitCode: string,
  newStatus: 'accepted' | 'rejected'
) => {
  try {
    if (newStatus === 'accepted') {
      const rewardCoins = 10000;
      const rewardDiamonds = 100;

      // 1. Reward the referrer
      const userRef = ref(rtdb, `users/${referrerCode}`);
      const snap = await get(userRef);
      if (snap.exists()) {
        const current = snap.val();
        await update(userRef, {
          coins: (Number(current.coins) || 0) + rewardCoins,
          diamonds: (Number(current.diamonds) || 0) + rewardDiamonds,
        });
        await update(ref(rtdb, `players/${referrerCode}`), {
          coins: (Number(current.coins) || 0) + rewardCoins,
        });
      }

      if (firestore) {
        try {
          await updateDoc(doc(firestore, 'users', referrerCode), {
            coins: increment(rewardCoins),
            diamonds: increment(rewardDiamonds),
          });
        } catch {}
      }
    }

    // 2. Update status
    await update(ref(rtdb, `users/${referrerCode}/recruits/${recruitCode}`), {
      status: newStatus,
      updatedAt: Date.now(),
    });
  } catch (e) {
    console.warn('updateReferralStatusInFirebase error:', e);
  }
};

// Admin: Force push real current user data to Realtime Database
export const forcePushCloudSync = async () => {
  const code = localStorage.getItem('loys_airdrop_code');
  if (!code) return false;
  try {
    const payload = {
      id: code,
      airdropCode: code,
      name: `ID: ${code}`,
      coins: Number(localStorage.getItem('loys_coins')) || 0,
      diamonds: Number(localStorage.getItem('loys_diamonds')) || 0,
      totalTaps: Number(localStorage.getItem('loys_total_taps')) || 0,
      level: Number(localStorage.getItem('loys_level')) || 1,
      referralCount: Number(localStorage.getItem('loys_referral_count')) || 0,
      joinedDate: localStorage.getItem('loys_joined_date') || new Date().toLocaleDateString('en-GB'),
      lastActive: Date.now(),
      updatedAt: Date.now(),
    };
    await set(ref(rtdb, `users/${code}`), payload);
    await set(ref(rtdb, `players/${code}`), payload);
    return true;
  } catch (e) {
    console.warn('forcePushCloudSync RTDB warning:', e);
    return false;
  }
};

// Admin: Purge all lingering demo data from Firebase Realtime Database
export const purgeDemoDataInFirebase = async () => {
  try {
    // 1. Purge demo users from RTDB
    const usersSnap = await get(ref(rtdb, 'users'));
    if (usersSnap.exists()) {
      const val = usersSnap.val();
      for (const key of Object.keys(val)) {
        if (val[key]?.isDemo || isNaN(Number(key))) {
          await set(ref(rtdb, `users/${key}`), null);
          await set(ref(rtdb, `players/${key}`), null);
        }
      }
    }

    // 2. Purge demo withdrawals from RTDB
    const snap = await get(ref(rtdb, 'withdrawals'));
    if (snap.exists()) {
      const val = snap.val();
      for (const key of Object.keys(val)) {
        if (val[key]?.isDemo) {
          await set(ref(rtdb, `withdrawals/${key}`), null);
        }
      }
    }
    return true;
  } catch (e) {
    console.warn('purgeDemoDataInFirebase warning:', e);
    return false;
  }
};
